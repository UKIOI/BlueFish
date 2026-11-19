package cn.lanwen.chat;

import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Insets;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.os.ext.SdkExtensions;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.provider.Settings;
import android.util.AtomicFile;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import org.json.JSONArray;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final String TAG = "BlueFish";
    private static final String HOST = "app.lanwen.invalid";
    private static final int PICK = 20, CAMERA = 21, PHOTO_ACCESS = 22, PICK_DEEPSEEK_EXPORT = 23;
    private static final String DEEPSEEK_EXPORT_PATH = "/deepseek-history/";
    private static final int STATE_LIMIT = 24 * 1024 * 1024;
    private final ExecutorService network = Executors.newFixedThreadPool(4);
    private final ConcurrentHashMap<String, Api.Call> active = new ConcurrentHashMap<>();
    private final Api api = new Api(this);
    private ReplySpeech speech;
    private RecentPhotos recentPhotos;
    private AppUpdate updates;
    private volatile String appearance;
    private boolean incognito;
    private int appliedSurface;
    private ValueAnimator surfaceTransition;
    private WebView web;
    private volatile Bridge bridge;
    private FrameLayout root;
    private boolean keyboardVisible;
    private boolean rendererRetried;
    private int recoveryMessage;
    private OnBackInvokedCallback inAppBack;
    private AtomicFile data;
    private Secrets secrets;
    SharedPreferences fileIds;
    private File cameraFile;
    private File attachmentDir;
    private Bridge deepSeekPickerOwner;
    private final Object deepSeekExportLock = new Object();
    private File deepSeekExport;
    private String deepSeekExportToken;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        recentPhotos = new RecentPhotos(this);
        updates = new AppUpdate(this);
        appearance = getPreferences(MODE_PRIVATE).getString("appearance", "system");
        speech = new ReplySpeech(this, (id, failed) -> {
            if (web != null) web.evaluateJavascript("window.onSpeechFinished && window.onSpeechFinished("
                + JSONObject.quote(id) + "," + failed + ")", null);
        });
        secrets = new Secrets(this);
        data = new AtomicFile(new File(getFilesDir(), "chat.json"));
        fileIds = getSharedPreferences("uploaded-files", MODE_PRIVATE);
        attachmentDir = new File(getFilesDir(), "attachments");
        attachmentDir.mkdirs();
        if (saved != null && saved.getString("camera") != null) cameraFile = new File(saved.getString("camera"));

        root = new FrameLayout(this);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets padding = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(padding.left, padding.top, padding.right, padding.bottom);
                keyboardVisible = insets.isVisible(WindowInsets.Type.ime());
                if (web != null) web.evaluateJavascript("window.setKeyboardVisible && window.setKeyboardVisible(" + keyboardVisible + ")", null);
                return WindowInsets.CONSUMED;
            });
        }
        setContentView(root);
        applyAppearance();
        startWebView();
    }

    private void startWebView() {
        if (web != null || isFinishing() || isDestroyed()) return;
        try {
            WebView view = new WebView(this);
            web = view;
            view.setBackgroundColor(appearanceSurface());
            configureWebView(view);
            bridge = new Bridge();
            view.addJavascriptInterface(bridge, "Lanwen");
            recoveryMessage = 0;
            root.removeAllViews();
            root.addView(view, new FrameLayout.LayoutParams(-1, -1));
            view.loadUrl("https://" + HOST + "/");
        } catch (RuntimeException | LinkageError error) {
            Log.e(TAG, "WebView startup failed", error);
            releaseWebView();
            showWebViewRecovery(R.string.webview_startup_failed);
        }
    }

    private void configureWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));
        view.setWebChromeClient(new WebChromeClient());
        view.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                if (view == web) view.evaluateJavascript("window.setKeyboardVisible && window.setKeyboardVisible(" + keyboardVisible + ")", null);
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                if (view != web) return true;
                boolean crashed = detail.didCrash();
                Log.w(TAG, crashed ? "WebView renderer crashed" : "WebView renderer was terminated");
                releaseWebView();
                if (isFinishing() || isDestroyed()) return true;
                if (!crashed && !rendererRetried) {
                    rendererRetried = true;
                    root.post(MainActivity.this::startWebView);
                } else {
                    showWebViewRecovery(R.string.webview_renderer_stopped);
                }
                return true;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost())) return empty();
                String path = uri.getPath();
                if (path == null) return empty();
                try {
                    switch (path) {
                        case "/": return asset("index.html", "text/html");
                        case "/styles.css": return asset("styles.css", "text/css");
                        case "/core.js": return asset("core.js", "application/javascript");
                        case "/deepseek-import.js": return asset("deepseek-import.js", "application/javascript");
                        case "/i18n.js": return asset("i18n.js", "application/javascript");
                        case "/app.js": return asset("app.js", "application/javascript");
                        case "/markdown-it.js": return asset("markdown-it.js", "application/javascript");
                        case "/math.js": return asset("math.js", "application/javascript");
                        case "/katex/katex.min.js": return asset("katex/katex.min.js", "application/javascript");
                        case "/katex/katex.min.css": return asset("katex/katex.min.css", "text/css");
                        default:
                            if (path.startsWith(DEEPSEEK_EXPORT_PATH) && "GET".equals(request.getMethod())) {
                                return openDeepSeekExport(path.substring(DEEPSEEK_EXPORT_PATH.length()));
                            }
                            if (path.matches("/katex/fonts/KaTeX_[A-Za-z0-9]+-[A-Za-z]+\\.woff2")) {
                                return new WebResourceResponse("font/woff2", null, getAssets().open(path.substring(1)));
                            }
                            if (path.startsWith("/thumb/")) {
                                File file = attachmentFile(path.substring(7));
                                if (file.isFile() && new File(attachmentDir, file.getName() + ".image").isFile()) {
                                    return new WebResourceResponse("image/jpeg", null, new FileInputStream(file));
                                }
                            }
                            if (path.startsWith("/gallery-thumb/")) {
                                WebResourceResponse thumbnail = recentPhotos.thumbnail(path.substring("/gallery-thumb/".length()));
                                return thumbnail == null ? empty() : thumbnail;
                            }
                    }
                } catch (Exception ignored) { }
                return empty();
            }
        });
    }

    private void releaseWebView() {
        bridge = null;
        synchronized (deepSeekExportLock) { clearDeepSeekExport(); }
        setBackIntercept(false);
        WebView view = web;
        web = null;
        if (incognito) {
            incognito = false;
            applyAppearance();
        }
        if (!active.isEmpty()) {
            ArrayList<Api.Call> calls = new ArrayList<>(active.values());
            active.clear();
            new Thread(() -> calls.forEach(Api.Call::close), "cancel-web-requests").start();
        }
        if (view == null) return;
        root.removeView(view);
        try { view.destroy(); }
        catch (RuntimeException | LinkageError error) { Log.w(TAG, "WebView cleanup failed", error); }
    }

    private void showWebViewRecovery(int message) {
        recoveryMessage = message;
        root.removeAllViews();
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        int padding = Math.round(24 * getResources().getDisplayMetrics().density);
        panel.setPadding(padding, padding, padding, padding);

        int ink = getColor(usesDarkAppearance() ? R.color.app_ink_dark : R.color.app_ink_light);
        TextView title = new TextView(this);
        title.setText(R.string.webview_recovery_title);
        title.setTextSize(22);
        title.setTextColor(ink);
        title.setGravity(Gravity.CENTER);
        panel.addView(title);

        TextView detail = new TextView(this);
        detail.setText(message);
        detail.setTextSize(16);
        detail.setTextColor(ink);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(0, padding / 2, 0, padding / 2);
        panel.addView(detail);

        Button retry = new Button(this);
        retry.setText(R.string.webview_retry);
        retry.setAllCaps(false);
        retry.setOnClickListener(button -> {
            rendererRetried = false;
            startWebView();
        });
        panel.addView(retry);
        scroll.addView(panel);
        root.addView(scroll, new FrameLayout.LayoutParams(-1, -1));
    }

    private WebResourceResponse asset(String name, String mime) throws Exception {
        return new WebResourceResponse(mime, "UTF-8", getAssets().open(name));
    }
    private static WebResourceResponse empty() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", java.util.Collections.emptyMap(),
            new ByteArrayInputStream(new byte[0]));
    }
    @Override public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        applyAppearance();
        if (web != null) {
            web.getSettings().setTextZoom(Math.round(config.fontScale * 100));
            web.evaluateJavascript("window.syncTheme && window.syncTheme()", null);
        } else if (recoveryMessage != 0) {
            showWebViewRecovery(recoveryMessage);
        }
    }
    private boolean darkMode() {
        return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }
    private boolean usesDarkAppearance() {
        if ("dark".equals(appearance)) return true;
        if ("light".equals(appearance)) return false;
        return darkMode();
    }
    private int appearanceSurface() {
        if (incognito) return usesDarkAppearance() ? 0xff191d30 : 0xfff0f3fc;
        return getColor(usesDarkAppearance() ? R.color.app_surface_dark : R.color.app_surface_light);
    }
    private void applyAppearance() {
        applyAppearance(false);
    }
    private void applyAppearance(boolean animate) {
        int surface = appearanceSurface();
        if (surfaceTransition != null) surfaceTransition.cancel();
        if (animate && appliedSurface != surface) {
            surfaceTransition = ValueAnimator.ofArgb(appliedSurface, surface);
            surfaceTransition.setDuration(320);
            surfaceTransition.addUpdateListener(animation -> tintSurface((int) animation.getAnimatedValue()));
            surfaceTransition.start();
        } else {
            tintSurface(surface);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController bars = getWindow().getInsetsController();
            int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            if (bars != null) bars.setSystemBarsAppearance(usesDarkAppearance() ? 0 : light, light);
        } else {
            View decor = getWindow().getDecorView();
            int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            decor.setSystemUiVisibility((decor.getSystemUiVisibility() & ~light) | (usesDarkAppearance() ? 0 : light));
        }
    }
    private void tintSurface(int color) {
        appliedSurface = color;
        root.setBackgroundColor(color);
        if (web != null) web.setBackgroundColor(color);
        if (Build.VERSION.SDK_INT < 30) {
            getWindow().setStatusBarColor(color);
            getWindow().setNavigationBarColor(color);
        }
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        if (cameraFile != null) state.putString("camera", cameraFile.getAbsolutePath());
    }
    @Override public void onBackPressed() { handleBack(); }

    private void handleBack() {
        if (web != null) web.evaluateJavascript("window.appBack && window.appBack()", value -> {
            if (!"true".equals(value)) super.onBackPressed();
        });
        else super.onBackPressed();
    }

    private void setBackIntercept(boolean enabled) {
        if (Build.VERSION.SDK_INT < 33 || enabled == (inAppBack != null)) return;
        if (enabled) {
            inAppBack = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, inAppBack);
        } else {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(inAppBack);
            inAppBack = null;
        }
    }

    @Override protected void onDestroy() {
        updates.close();
        speech.close();
        releaseWebView();
        network.shutdownNow();
        super.onDestroy();
    }

    @Override protected void onStop() {
        speech.stop();
        super.onStop();
    }

    File attachmentFile(String id) {
        if (!id.matches("[a-f0-9-]{36}")) throw new IllegalArgumentException("无效附件");
        return new File(attachmentDir, id);
    }

    private void emit(String id, String type, Object value) {
        runOnUiThread(() -> {
            if (web == null || isFinishing()) return;
            String json = value == null ? "null" : value.toString();
            web.evaluateJavascript("window.onNative && window.onNative(" + JSONObject.quote(id) + ","
                + JSONObject.quote(type) + ",JSON.parse(" + JSONObject.quote(json) + "))", null);
        });
    }

    private void fail(String id, Exception error) {
        try {
            int status = error instanceof Api.Failure ? ((Api.Failure) error).status : 0;
            String message = error.getMessage();
            if (status == 0 && !(error instanceof IllegalArgumentException)) message = "连接或读取失败，请重试";
            emit(id, "fail", Api.object("status", status, "message", message == null ? "操作未完成" : message));
        } catch (Exception ignored) { }
    }

    private String endpoint() throws Exception {
        return trialCredentials().optString("origin", BuildConfig.TRIAL_ORIGIN);
    }
    private JSONObject trialCredentials() throws Exception {
        String value = secrets.read("trial");
        return value.isEmpty() ? new JSONObject() : new JSONObject(value);
    }
    private Api.Account account(String mode) throws Exception {
        boolean trial = "trial".equals(mode);
        String origin = trial ? endpoint() : Api.DEEPSEEK;
        String token = trial ? trialCredentials().optString("token") : secrets.read("key");
        if (origin.isEmpty() || token.isEmpty()) throw new Api.Failure(401, trial ? "请先启用试用" : "请先配置 API Key");
        return new Api.Account(trial, origin, token);
    }

    private JSONObject settings() throws Exception {
        String key = secrets.read("key");
        String session = trialCredentials().optString("token");
        return Api.object("key", key.isEmpty() ? "" : "•••• " + key.substring(Math.max(0, key.length() - 4)),
            "keyTag", key.isEmpty() ? "" : account("key").tag,
            "trialTag", session.isEmpty() ? "" : account("trial").tag,
            "trialEndpoint", endpoint());
    }

    private void request(String id, String type, JSONObject args, Api.Call call) throws Exception {
        switch (type) {
            case "info":
                emit(id, "ok", settings());
                break;
            case "saveKey": {
                String key = args.getString("value").trim();
                if (!key.matches("[A-Za-z0-9_\\-]{12,256}")) throw new Api.Failure(400, "请检查 Key 格式");
                JSONObject balance = api.json(Api.DEEPSEEK + "/user/balance", key, null, call);
                secrets.write("key", key);
                emit(id, "ok", Api.object("info", settings(), "balance", balance));
                break;
            }
            case "removeKey":
                secrets.remove("key");
                emit(id, "ok", settings());
                break;
            case "claim": {
                String origin = Api.trialOrigin(args.getString("origin"));
                String code = args.getString("code").trim();
                if (!code.matches("[A-Za-z0-9_-]{8,128}")) throw new Api.Failure(400, "请输入有效的试用邀请码");
                JSONObject claim = api.json(origin + "/v1/claim", "", Api.object("code", code), call);
                String token = claim.getString("token");
                if (!token.matches("[A-Za-z0-9_-]{32,256}")) throw new Api.Failure(400, "试用服务返回了无效凭证");
                secrets.write("trial", Api.object("origin", origin, "token", token).toString());
                // Credentials travel together so a failed write cannot pair a token with the wrong service.
                emit(id, "ok", Api.object("info", settings(), "balance", claim.getJSONObject("balance")));
                break;
            }
            case "balance": {
                Api.Account account = account(args.optString("mode"));
                emit(id, "ok", api.json(account.origin + (account.trial ? "/v1/balance" : "/user/balance"), account.token, null, call));
                break;
            }
            case "chat": {
                Api.Account account = account(args.optString("mode"));
                if (!account.tag.equals(args.optString("tag"))) throw new Api.Failure(409, "使用方式已变更，请重新发送");
                api.chat(account, args.getJSONObject("payload"), call, (name, value) -> emit(id, name, value));
                emit(id, call.stopped ? "stopped" : "ok", new JSONObject());
                break;
            }
            case "recentPhotos":
                emit(id, "ok", recentPhotos.list());
                break;
            case "importRecentPhoto": {
                Uri photo = recentPhotos.photo(args.optString("id"));
                if (photo == null) throw new Api.Failure(400, "照片已不可访问，请从相册重新选择");
                emit(id, "ok", importUri(photo));
                break;
            }
            default:
                throw new Api.Failure(400, "操作不可用");
        }
    }

    private final class Bridge {
        @JavascriptInterface public void syncAppUpdate() {
            runOnUiThread(() -> { if (bridge == this) updates.sync(); });
        }
        @JavascriptInterface public void downloadAppUpdate() {
            runOnUiThread(() -> { if (bridge == this) updates.download(); });
        }
        @JavascriptInterface public boolean isDarkMode() { return darkMode(); }
        @JavascriptInterface public String getAppVersion() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (PackageManager.NameNotFoundException ignored) {
                return "";
            }
        }
        @JavascriptInterface public String getAppearance() { return appearance; }
        @JavascriptInterface public void setAppearance(String value) {
            if (!"system".equals(value) && !"light".equals(value) && !"dark".equals(value)) return;
            runOnUiThread(() -> {
                if (bridge != this) return;
                appearance = value;
                getPreferences(MODE_PRIVATE).edit().putString("appearance", value).apply();
                applyAppearance();
            });
        }
        @JavascriptInterface public void setBackIntercept(boolean enabled) {
            runOnUiThread(() -> { if (bridge == this) MainActivity.this.setBackIntercept(enabled); });
        }
        @JavascriptInterface public void setIncognito(boolean enabled) {
            runOnUiThread(() -> {
                if (bridge != this || incognito == enabled) return;
                incognito = enabled;
                applyAppearance(true);
            });
        }
        @JavascriptInterface public String load() {
            synchronized (data) {
                if (bridge != this) return "";
                try { return Api.read(data.openRead(), STATE_LIMIT); }
                catch (Exception ignored) { return ""; }
            }
        }
        @JavascriptInterface public boolean save(String state) {
            byte[] bytes = state.getBytes(StandardCharsets.UTF_8);
            if (bytes.length > STATE_LIMIT) return false;
            synchronized (data) {
                if (bridge != this) return false;
                FileOutputStream out = null;
                try {
                    out = data.startWrite();
                    out.write(bytes);
                    data.finishWrite(out);
                    return true;
                } catch (Exception error) {
                    if (out != null) data.failWrite(out);
                    return false;
                }
            }
        }
        @JavascriptInterface public void request(String id, String type, String raw) {
            if (bridge != this) return;
            Api.Call call = new Api.Call();
            if (active.putIfAbsent(id, call) != null) return;
            try {
                network.execute(() -> {
                    try { if (bridge == this) requestFromBridge(id, type, raw, call); }
                    catch (Exception error) {
                        if (call.stopped) emit(id, "stopped", new JSONObject());
                        else fail(id, error);
                    } finally { active.remove(id, call); }
                });
            } catch (RejectedExecutionException disposed) {
                active.remove(id, call);
            }
        }
        @JavascriptInterface public void stop(String id) {
            Api.Call call = active.get(id);
            if (call != null) new Thread(call::close, "stop-stream").start();
        }
        @JavascriptInterface public void pick(String mode) {
            runOnUiThread(() -> { if (bridge == this) launchPicker(mode); });
        }
        @JavascriptInterface public void pickDeepSeekExport() {
            runOnUiThread(() -> { if (bridge == this) launchDeepSeekPicker(this); });
        }
        @JavascriptInterface public void requestPhotoAccess() {
            runOnUiThread(() -> { if (bridge == this) requestGalleryAccess(); });
        }
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText(getString(R.string.app_name), text)));
        }
        @JavascriptInterface public void speak(String id, String text) {
            if (!id.matches("[a-f0-9-]{32,36}") || text.length() > STATE_LIMIT) return;
            runOnUiThread(() -> { if (bridge == this) speech.speak(id, text); });
        }
        @JavascriptInterface public void stopSpeech() {
            runOnUiThread(() -> { if (bridge == this) speech.stop(); });
        }
        @JavascriptInterface public void share(String text, String title) {
            runOnUiThread(() -> startActivity(Intent.createChooser(new Intent(Intent.ACTION_SEND)
                .setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), title)));
        }
        @JavascriptInterface public void openLink(String value) {
            Uri uri = Uri.parse(value);
            if (uri.getHost() == null || !("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))) return;
            runOnUiThread(() -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
                catch (ActivityNotFoundException ignored) { }
            });
        }
    }

    private void requestFromBridge(String id, String type, String raw, Api.Call call) throws Exception {
        request(id, type, new JSONObject(raw), call);
    }

    private void requestGalleryAccess() {
        String access = recentPhotos.access();
        if ("full".equals(access)) return;
        String[] permissions = RecentPhotos.permissions();
        if ("none".equals(access) && getPreferences(MODE_PRIVATE).getBoolean("requestedPhotoAccess", false)
                && !shouldShowRequestPermissionRationale(permissions[0])) {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getPackageName(), null)));
            return;
        }
        requestPermissions(permissions, PHOTO_ACCESS);
    }

    @Override public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(request, permissions, results);
        if (request != PHOTO_ACCESS) return;
        if (results.length > 0) getPreferences(MODE_PRIVATE).edit().putBoolean("requestedPhotoAccess", true).apply();
        refreshGalleryPanel();
    }

    @Override protected void onResume() {
        super.onResume();
        updates.resume();
        refreshGalleryPanel();
    }

    @Override protected void onPause() {
        updates.pause();
        super.onPause();
    }

    void showAppUpdate(String version, String state) {
        if (web != null) web.evaluateJavascript("window.onAppUpdate && window.onAppUpdate("
            + JSONObject.quote(version) + "," + JSONObject.quote(state) + ")", null);
    }

    private void refreshGalleryPanel() {
        if (web != null) web.evaluateJavascript("window.refreshRecentPhotos && window.refreshRecentPhotos()", null);
    }

    private void launchPhotoPicker() {
        if (Build.VERSION.SDK_INT >= 33 || (Build.VERSION.SDK_INT >= 30 && SdkExtensions.getExtensionVersion(30) >= 2)) {
            Intent picker = new Intent(MediaStore.ACTION_PICK_IMAGES).setType("image/*");
            picker.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, MediaStore.getPickImagesMaxLimit());
            try {
                startActivityForResult(picker, PICK);
                return;
            } catch (ActivityNotFoundException ignored) {
                // Some devices do not have the modular picker installed.
            }
        }
        Intent gallery = new Intent(Intent.ACTION_PICK)
            .setDataAndType(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image/*")
            .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(gallery, PICK);
    }

    private void launchPicker(String mode) {
        try {
            if ("camera".equals(mode)) {
                File folder = new File(getCacheDir(), "camera");
                folder.mkdirs();
                cameraFile = new File(folder, UUID.randomUUID() + ".jpg");
                if (!cameraFile.createNewFile()) throw new IllegalStateException();
                Uri uri = Uri.parse("content://" + AttachmentProvider.AUTHORITY + "/" + cameraFile.getName());
                Intent capture = new Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                capture.setClipData(ClipData.newRawUri("camera", uri));
                startActivityForResult(capture, CAMERA);
            } else if ("photo".equals(mode)) {
                launchPhotoPicker();
            } else {
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*").putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                startActivityForResult(pick, PICK);
            }
        } catch (Exception error) {
            String name = "camera".equals(mode) ? "相机" : "photo".equals(mode) ? "相册选择器" : "文件选择器";
            fail("picker", new Api.Failure(400, "设备没有可用的" + name));
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request, result, intent);
        if (request == AppUpdate.INSTALL_PERMISSION) {
            updates.onPermissionResult();
        } else if (request == PICK_DEEPSEEK_EXPORT) {
            Bridge owner = deepSeekPickerOwner;
            deepSeekPickerOwner = null;
            if (owner == null || owner != bridge) return;
            Uri uri = result == RESULT_OK && intent != null ? intent.getData() : null;
            if (uri == null) emit("deepseek-export", "cancel", null);
            else {
                emit("deepseek-export", "reading", null);
                network.execute(() -> prepareDeepSeekExport(owner, uri));
            }
        } else if (request == CAMERA) {
            File captured = cameraFile;
            cameraFile = null;
            if (captured == null) return;
            if (result != RESULT_OK) { captured.delete(); emit("picker", "cancel", null); return; }
            network.execute(() -> {
                try {
                    emit("picker", "ok", new JSONArray().put(importImage(captured, "拍照.jpg")));
                } catch (Exception error) { fail("picker", error); }
                finally { captured.delete(); }
            });
        } else if (request == PICK) {
            if (result != RESULT_OK || intent == null) {
                emit("picker", "cancel", null);
                return;
            }
            network.execute(() -> {
                JSONArray attachments = new JSONArray();
                try {
                    ClipData selected = intent.getClipData();
                    if (selected != null) {
                        for (int i = 0; i < selected.getItemCount(); i++) attachments.put(importUri(selected.getItemAt(i).getUri()));
                    } else if (intent.getData() != null) attachments.put(importUri(intent.getData()));
                    emit("picker", "ok", attachments);
                } catch (Exception error) {
                    if (attachments.length() > 0) emit("picker", "ok", attachments);
                    fail("picker", error);
                }
            });
        }
    }

    private void launchDeepSeekPicker(Bridge owner) {
        if (deepSeekPickerOwner != null) return;
        try {
            deepSeekPickerOwner = owner;
            Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
            startActivityForResult(picker, PICK_DEEPSEEK_EXPORT);
        } catch (RuntimeException error) {
            deepSeekPickerOwner = null;
            fail("deepseek-export", new Api.Failure(400, "设备没有可用的文件选择器。"));
        }
    }

    private void prepareDeepSeekExport(Bridge owner, Uri uri) {
        File prepared = null;
        try {
            prepared = File.createTempFile("deepseek-import-", ".json", getCacheDir());
            try (InputStream input = getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IllegalArgumentException("文件无法读取");
                DeepSeekExport.prepare(input, prepared, getCacheDir());
            }
            File result = prepared;
            runOnUiThread(() -> {
                if (bridge != owner || isFinishing()) {
                    result.delete();
                    return;
                }
                String token = UUID.randomUUID().toString();
                synchronized (deepSeekExportLock) {
                    clearDeepSeekExport();
                    deepSeekExport = result;
                    deepSeekExportToken = token;
                }
                emit("deepseek-export", "ok", JSONObject.quote(token));
            });
        } catch (Exception error) {
            if (prepared != null) prepared.delete();
            Api.Failure failure = error instanceof Api.Failure ? (Api.Failure) error : null;
            String message = failure == null ? "DeepSeek 导出文件无法读取，请重新导出后再试。"
                : failure.status == 413 ? "导出文件太大，超出了单次导入上限。" : failure.getMessage();
            runOnUiThread(() -> {
                if (bridge == owner) fail("deepseek-export", new Api.Failure(400, message));
            });
        }
    }

    private WebResourceResponse openDeepSeekExport(String token) throws Exception {
        synchronized (deepSeekExportLock) {
            if (!token.equals(deepSeekExportToken)) return empty();
            FileInputStream in;
            try { in = new FileInputStream(deepSeekExport); }
            finally { clearDeepSeekExport(); }
            return new WebResourceResponse("application/json", "UTF-8", 200, "OK",
                java.util.Collections.singletonMap("Cache-Control", "no-store"), in);
        }
    }

    private void clearDeepSeekExport() {
        if (deepSeekExport != null) deepSeekExport.delete();
        deepSeekExport = null;
        deepSeekExportToken = null;
    }

    private JSONObject importUri(Uri uri) throws Exception {
        String name = "附件";
        try (Cursor cursor = getContentResolver().query(uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst() && cursor.getString(0) != null) name = cursor.getString(0);
        }
        name = name.replaceAll("[\\p{Cntrl}]", "_");
        if (name.length() > 200) name = name.substring(name.length() - 200);
        String type = getContentResolver().getType(uri);
        String ext = name.toLowerCase(Locale.ROOT).replaceFirst("^.*\\.", "");
        boolean image = type != null && type.startsWith("image/");
        boolean plain = ext.matches("txt|md|csv|json|xml|log|html|js|ts|py|java|kt|c|cpp|h|yaml|yml");
        boolean parse = ext.matches("pdf|docx?|pptx?");
        boolean convert = ext.matches("xlsx?|epub|mobi");
        if (!image && !plain && !parse && !convert) throw new Api.Failure(400, "不支持此文件格式");
        String purpose = parse ? "text_recognition" : "user_data";
        long cap = image ? Long.MAX_VALUE : Api.documentFileLimit(purpose);
        String id = UUID.randomUUID().toString();
        File file = attachmentFile(id);
        try {
            try (InputStream input = getContentResolver().openInputStream(uri);
                 FileOutputStream out = new FileOutputStream(file)) {
                if (input == null) throw new Api.Failure(400, "无法打开文件");
                Api.copy(input, out, cap);
            }
            if (image) {
                JSONObject info = importImage(file, name);
                file.delete();
                return info;
            }
            int pages = "pdf".equals(ext) ? pdfPages(file) : 0;
            return Api.object("id", id, "name", name, "mime", type == null ? "application/octet-stream" : type,
                "size", file.length(), "pages", pages, "purpose", purpose, "plain", plain);
        } catch (Exception error) { file.delete(); throw error; }
    }

    private static int pdfPages(File file) {
        try (PdfRenderer reader = new PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY))) {
            return reader.getPageCount();
        } catch (Exception ignored) { return 0; }
    }

    private JSONObject importImage(File input, String name) throws Exception {
        String id = UUID.randomUUID().toString();
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(input.getPath(), options);
        if (options.outWidth <= 0 || options.outHeight <= 0) throw new Api.Failure(400, "无法读取此图片");
        options.inJustDecodeBounds = false;
        options.inSampleSize = 1;
        while (Math.max(options.outWidth, options.outHeight) / options.inSampleSize > 2300) options.inSampleSize *= 2;
        Bitmap bitmap = BitmapFactory.decodeFile(input.getPath(), options);
        if (bitmap == null) throw new Api.Failure(400, "无法读取此图片");
        File file = attachmentFile(id);
        try (FileOutputStream out = new FileOutputStream(file)) {
            if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 86, out)) throw new Api.Failure(400, "无法保存图片");
        } finally { bitmap.recycle(); }
        JSONObject info = Api.object("id", id, "name", name, "mime", "image/jpeg", "size", file.length());
        try (FileOutputStream out = new FileOutputStream(new File(attachmentDir, id + ".image"))) {
            out.write(info.toString().getBytes(StandardCharsets.UTF_8));
        }
        return info;
    }
}
