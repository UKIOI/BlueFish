package cn.lanwen.chat;

import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

final class AppUpdate {
    static final int INSTALL_PERMISSION = 24;
    static final String INSTALL_PATH = "/updates/BlueFish.apk";
    static final String APK_TYPE = "application/vnd.android.package-archive";
    private static final String PATH = "/bluefish/android/";
    private static final long MAX_APK_BYTES = 128L * 1024 * 1024;
    private static final int CHECK_INTERVAL = 5 * 60_000;
    private static final String[] ORIGINS = { BuildConfig.UPDATE_R2_ORIGIN, BuildConfig.UPDATE_TUNNEL_ORIGIN };

    private final MainActivity activity;
    private final ExecutorService network = Executors.newFixedThreadPool(2);
    private final File apk;
    private final long installedVersion;
    private final Set<Signature> installedSigners;
    private final Release[] checks = new Release[ORIGINS.length];
    private final int signatureFlag = Build.VERSION.SDK_INT >= 28
        ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
    private long checkedAt = -CHECK_INTERVAL;
    private int pendingChecks;
    private Release available;
    private Release ready;
    private boolean downloading;
    private boolean foreground;
    private boolean closed;

    AppUpdate(MainActivity activity) {
        this.activity = activity;
        apk = cachedApk(activity.getCacheDir());
        try {
            PackageInfo installed = activity.getPackageManager().getPackageInfo(activity.getPackageName(), signatureFlag);
            installedVersion = code(installed);
            installedSigners = signers(installed);
        } catch (PackageManager.NameNotFoundException error) {
            throw new IllegalStateException(error);
        }
    }

    static File cachedApk(File cache) { return new File(new File(cache, "updates"), "verified.apk"); }

    void resume() {
        foreground = true;
        check();
    }

    void pause() { foreground = false; }

    void close() {
        closed = true;
        network.shutdownNow();
    }

    void sync() {
        signal(downloading ? "downloading" : ready != null ? "ready" : "available");
        check();
    }

    private void check() {
        long now = SystemClock.elapsedRealtime();
        if (closed || downloading || pendingChecks != 0 || now - checkedAt < CHECK_INTERVAL) return;
        checkedAt = now;
        for (int source = 0; source < ORIGINS.length; source++) {
            if (ORIGINS[source].isEmpty()) continue;
            final int index = source;
            pendingChecks++;
            network.execute(() -> {
                Release result = findRelease(ORIGINS[index]);
                activity.runOnUiThread(() -> checked(index, result));
            });
        }
    }

    private void checked(int source, Release release) {
        if (closed) return;
        checks[source] = release;
        if (--pendingChecks != 0 || downloading) return;
        // Prefer R2 on a tie. Keep a previously observed update through temporary outages.
        Release newest = null;
        for (Release candidate : checks) {
            if (candidate != null && (newest == null || candidate.versionCode > newest.versionCode)) newest = candidate;
        }
        if (newest == null || (available != null && newest.versionCode < available.versionCode)) return;
        available = newest;
        if (ready != null && !ready.sha256.equals(available.sha256)) ready = null;
        sync();
    }

    private Release findRelease(String origin) {
        HttpsURLConnection connection = null;
        try {
            connection = connect(origin, "latest.json", 5000);
            if (connection.getResponseCode() != 200) return null;
            ByteArrayOutputStream data = new ByteArrayOutputStream();
            try (InputStream input = connection.getInputStream()) {
                transfer(input, data, null, 4096, 8000);
            }
            Release release = new Release(new JSONObject(new String(data.toByteArray(), StandardCharsets.UTF_8)));
            return release.versionCode > installedVersion ? release : null;
        } catch (Exception error) {
            Log.d("BlueFish", "Update check unavailable: " + error.getClass().getSimpleName());
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    void download() {
        if (closed || downloading || available == null || !foreground) return;
        if (ready != null && apk.isFile()) {
            openInstaller();
            return;
        }
        ready = null;
        downloading = true;
        Release release = available;
        signal("downloading");
        network.execute(() -> {
            boolean success = validCachedApk(release);
            for (int source = 0; !success && source < ORIGINS.length; source++) {
                if (Thread.currentThread().isInterrupted()) break;
                if (ORIGINS[source].isEmpty()) continue;
                if (source == 1 && !ORIGINS[0].isEmpty()) {
                    activity.runOnUiThread(() -> { if (!closed) signal("fallback"); });
                }
                try {
                    fetchApk(ORIGINS[source], release);
                    success = true;
                } catch (Exception error) {
                    Log.w("BlueFish", "Update download failed at source " + source + ": " + error.getClass().getSimpleName());
                }
            }
            boolean verified = success;
            activity.runOnUiThread(() -> {
                if (closed) return;
                downloading = false;
                if (verified) {
                    ready = release;
                    signal("ready");
                    if (foreground) openInstaller();
                } else {
                    signal("downloadFailed");
                }
            });
        });
    }

    private boolean validCachedApk(Release release) {
        if (apk.length() != release.size) return false;
        try (InputStream input = new FileInputStream(apk)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            transfer(input, null, digest, release.size, 15_000);
            verify(apk, release, digest);
            return true;
        } catch (Exception error) {
            return false;
        }
    }

    private void fetchApk(String origin, Release release) throws Exception {
        File directory = apk.getParentFile();
        if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("Update cache unavailable");
        File part = File.createTempFile("bluefish-", ".apk", directory);
        HttpsURLConnection connection = null;
        try {
            connection = connect(origin, release.fileName(), 10_000);
            if (connection.getResponseCode() != 200) throw new IOException("APK unavailable");
            long length = connection.getContentLengthLong();
            if (length >= 0 && length != release.size) throw new IOException("Wrong APK size");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(part)) {
                transfer(input, output, digest, release.size, 180_000);
            }
            verify(part, release, digest);
            if (!part.renameTo(apk)) throw new IOException("Could not save the verified APK");
        } finally {
            if (connection != null) connection.disconnect();
            part.delete();
        }
    }

    private void verify(File file, Release release, MessageDigest digest) throws IOException {
        if (file.length() != release.size || !MessageDigest.isEqual(digest.digest(), release.hash)) {
            throw new IOException("APK digest mismatch");
        }
        PackageInfo archive = activity.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(), signatureFlag);
        if (archive == null || !activity.getPackageName().equals(archive.packageName) || code(archive) != release.versionCode
                || !release.versionName.equals(archive.versionName) || installedSigners.isEmpty()
                || !installedSigners.equals(signers(archive))) {
            throw new IOException("APK identity or signature mismatch");
        }
    }

    private static long code(PackageInfo update) {
        return Build.VERSION.SDK_INT >= 28 ? update.getLongVersionCode() : update.versionCode;
    }

    private static Set<Signature> signers(PackageInfo info) {
        Signature[] values = Build.VERSION.SDK_INT >= 28
            ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        return values == null ? new HashSet<>() : new HashSet<>(Arrays.asList(values));
    }

    void onPermissionResult() {
        if (ready == null || closed) return;
        if (activity.getPackageManager().canRequestPackageInstalls()) openInstaller();
        else signal("permission");
    }

    private void openInstaller() {
        try {
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                signal("permission");
                activity.startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.fromParts("package", activity.getPackageName(), null)), INSTALL_PERMISSION);
                return;
            }
            Uri uri = Uri.parse("content://" + AttachmentProvider.AUTHORITY + INSTALL_PATH);
            Intent install = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, APK_TYPE)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            install.setClipData(ClipData.newRawUri("BlueFish.apk", uri));
            activity.startActivity(install);
        } catch (RuntimeException error) {
            signal("installFailed");
        }
    }

    private void signal(String state) {
        activity.showAppUpdate(available == null ? "" : available.versionName, state);
    }

    private static HttpsURLConnection connect(String origin, String name, int timeout) throws IOException {
        HttpsURLConnection connection = (HttpsURLConnection) new URL(origin + PATH + name).openConnection();
        connection.setConnectTimeout(timeout);
        connection.setReadTimeout(timeout);
        connection.setInstanceFollowRedirects(false);
        connection.setUseCaches(false);
        connection.setRequestProperty("Accept-Encoding", "identity");
        if ("latest.json".equals(name)) connection.setRequestProperty("Cache-Control", "no-cache");
        return connection;
    }

    private static void transfer(InputStream input, OutputStream output, MessageDigest digest, long limit, int timeout)
            throws IOException {
        long deadline = SystemClock.elapsedRealtime() + timeout;
        byte[] buffer = new byte[32 * 1024];
        long total = 0;
        for (int count; (count = input.read(buffer)) != -1;) {
            total += count;
            if (total > limit || SystemClock.elapsedRealtime() > deadline || Thread.currentThread().isInterrupted()) {
                throw new IOException("Update transfer limit exceeded");
            }
            if (output != null) output.write(buffer, 0, count);
            if (digest != null) digest.update(buffer, 0, count);
        }
    }

    private static final class Release {
        final long versionCode, size;
        final String versionName, sha256;
        final byte[] hash = new byte[32];

        Release(JSONObject manifest) throws Exception {
            versionCode = integer(manifest, "versionCode");
            versionName = manifest.getString("versionName");
            size = integer(manifest, "size");
            sha256 = manifest.getString("sha256");
            if (versionCode <= 0 || versionCode > Integer.MAX_VALUE || size <= 0 || size > MAX_APK_BYTES
                    || !versionName.matches("[0-9]{1,8}\\.[0-9]{1,8}\\.[0-9]{1,8}") || !sha256.matches("[a-f0-9]{64}")) {
                throw new IOException("Invalid update manifest");
            }
            for (int i = 0; i < hash.length; i++) hash[i] = (byte) Integer.parseInt(sha256.substring(i * 2, i * 2 + 2), 16);
        }

        String fileName() { return "BlueFish-" + versionCode + "-" + sha256 + ".apk"; }

        private static long integer(JSONObject manifest, String field) throws IOException {
            Object value = manifest.opt(field);
            if (!(value instanceof Integer) && !(value instanceof Long)) throw new IOException("Invalid update " + field);
            return ((Number) value).longValue();
        }
    }
}
