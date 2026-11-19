package cn.lanwen.chat;

import android.util.Base64;
import android.util.Base64OutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONObject;

final class Api {
    static final String DEEPSEEK = "https://api.deepseek.com";
    private static final int MAX_CONTEXT_DOCUMENTS = 20;
    interface Event { void send(String type, JSONObject payload); }

    static final class Failure extends IOException {
        final int status;
        Failure(int status, String message) { super(message); this.status = status; }
    }
    static final class Call {
        volatile HttpURLConnection current;
        volatile boolean stopped;
        synchronized void attach(HttpURLConnection next) throws IOException {
            if (stopped) throw new IOException("请求已停止");
            current = next;
        }
        void close() {
            HttpURLConnection active;
            synchronized (this) { stopped = true; active = current; }
            if (active != null) active.disconnect();
        }
    }
    static final class Account {
        final boolean trial;
        final String origin, token, tag;
        Account(boolean trial, String origin, String token) throws Exception {
            this.trial = trial;
            this.origin = origin;
            this.token = token;
            byte[] value = MessageDigest.getInstance("SHA-256").digest((origin + "\n" + token).getBytes(StandardCharsets.UTF_8));
            this.tag = Base64.encodeToString(value, Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING).substring(0, 18);
        }
    }

    private final MainActivity host;
    Api(MainActivity host) { this.host = host; }

    static String trialOrigin(String value) throws Exception {
        URI uri = new URI(value.trim());
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
            || uri.getQuery() != null || uri.getFragment() != null || (!uri.getPath().isEmpty() && !"/".equals(uri.getPath()))) {
            throw new Failure(400, "请输入试用服务的 HTTPS 地址");
        }
        return new URI("https", null, uri.getHost(), uri.getPort(), null, null, null).toString();
    }

    JSONObject json(String address, String token, JSONObject payload, Call call) throws Exception {
        HttpURLConnection conn = connect(address, token, false, call);
        try {
            if (payload != null) {
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                write(conn, payload.toString().getBytes(StandardCharsets.UTF_8));
            }
            check(conn);
            return new JSONObject(read(conn.getInputStream(), 1024 * 1024));
        } finally { conn.disconnect(); }
    }

    void chat(Account account, JSONObject payload, Call call, Event event) throws Exception {
        JSONArray history = payload.getJSONArray("messages");
        int files = 0;
        boolean hasImages = false;
        for (int i = 0; i < history.length(); i++) {
            JSONArray content = history.getJSONObject(i).optJSONArray("content");
            if (content == null) continue;
            for (int k = 0; k < content.length(); k++) {
                JSONObject block = content.optJSONObject(k);
                if (block == null || !"_attachment".equals(block.optString("type"))) continue;
                if (!host.attachmentFile(block.getString("id")).isFile()) throw new Failure(400, "附件文件已不可用，请重新选择");
                if ("image/jpeg".equals(block.optString("mime"))) hasImages = true;
                else files++;
            }
        }
        if (files > MAX_CONTEXT_DOCUMENTS) {
            throw new Failure(413, "每次请求最多引用 20 份文件（含历史），请减少附件或新建对话");
        }
        for (int i = 0; i < history.length(); i++) {
            JSONArray content = history.getJSONObject(i).optJSONArray("content");
            if (content == null) continue;
            for (int k = 0; k < content.length(); k++) {
                JSONObject block = content.optJSONObject(k);
                if (block != null && "_attachment".equals(block.optString("type")) && !"image/jpeg".equals(block.optString("mime"))) {
                    content.put(k, document(account, block, call, event));
                }
            }
        }
        if (files > 0) event.send("attachments_ready", new JSONObject());
        String address = account.origin + (account.trial ? "/v1/chat" : "/anthropic/v1/messages");
        HttpURLConnection conn = connect(address, account.token, !account.trial, call);
        try {
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            conn.setRequestProperty("Accept", "text/event-stream");
            if (account.trial) conn.setRequestProperty("X-Request-Id", UUID.randomUUID().toString());
            conn.setDoOutput(true);
            conn.setChunkedStreamingMode(32 * 1024);
            try (OutputStream out = conn.getOutputStream()) {
                writeChat(out, payload, history, event);
            }
            if (hasImages) event.send("attachments_ready", new JSONObject());
            check(conn);
            boolean finished = false;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                StringBuilder data = new StringBuilder();
                while (!call.stopped && (line = reader.readLine()) != null) {
                    if (line.startsWith("data:")) {
                        if (data.length() > 0) data.append('\n');
                        data.append(line.substring(5).trim());
                    } else if (line.isEmpty() && data.length() != 0) {
                        JSONObject body = new JSONObject(data.toString());
                        String type = body.optString("type");
                        event.send("sse", body);
                        if ("message_stop".equals(type) || "error".equals(type)) finished = true;
                        data.setLength(0);
                    }
                }
            }
            if (!finished && !call.stopped) throw new IOException("连接中断，已保留收到的内容");
        } finally { conn.disconnect(); }
    }

    // Keep large base64 strings out of the in-memory JSON tree.
    private void writeChat(OutputStream out, JSONObject payload, JSONArray history, Event event) throws Exception {
        payload.remove("messages");
        writeArrayField(out, payload, "messages");
        for (int i = 0; i < history.length(); i++) {
            if (i > 0) out.write(',');
            JSONObject message = history.getJSONObject(i);
            JSONArray content = message.optJSONArray("content");
            if (content == null) {
                writeText(out, message.toString());
                continue;
            }
            message.remove("content");
            writeArrayField(out, message, "content");
            for (int k = 0; k < content.length(); k++) {
                if (k > 0) out.write(',');
                JSONObject block = content.getJSONObject(k);
                if ("_attachment".equals(block.optString("type"))) {
                    event.send("reading_image", object("name", block.optString("name", "图片")));
                    writeText(out, "{\"type\":\"image\",\"source\":{\"type\":\"base64\",\"media_type\":\"image/jpeg\",\"data\":\"");
                    writeBase64(out, host.attachmentFile(block.getString("id")));
                    writeText(out, "\"}}");
                } else {
                    writeText(out, block.toString());
                }
            }
            writeText(out, "]}");
        }
        writeText(out, "]}");
    }

    private static void writeArrayField(OutputStream out, JSONObject object, String name) throws IOException {
        String json = object.toString();
        writeText(out, json.substring(0, json.length() - 1));
        if (object.length() != 0) out.write(',');
        writeText(out, JSONObject.quote(name) + ":[");
    }

    private static void writeText(OutputStream out, String text) throws IOException {
        out.write(text.getBytes(StandardCharsets.UTF_8));
    }

    private static void writeBase64(OutputStream out, File file) throws IOException {
        try (InputStream in = new FileInputStream(file);
             Base64OutputStream encoded = new Base64OutputStream(out, Base64.NO_WRAP | Base64.NO_CLOSE)) {
            copy(in, encoded, Long.MAX_VALUE);
        }
    }

    private JSONObject document(Account account, JSONObject block, Call call, Event event) throws Exception {
        String id = block.getString("id");
        File file = host.attachmentFile(id);
        if (!file.isFile()) throw new Failure(400, "附件文件已不可用，请重新选择");
        String purpose = block.optString("purpose", "text_recognition");
        if (!"user_data".equals(purpose) && !"rich_layout_recognition".equals(purpose)) purpose = "text_recognition";
        String storageKey = account.tag + ":" + id + ":" + purpose;
        String fileId = host.fileIds.getString(storageKey, "");
        if (fileId.isEmpty()) {
            boolean parsing = !"user_data".equals(purpose);
            event.send("uploading", object("name", block.optString("name", "附件"), "parsing", parsing));
            JSONObject result;
            if (account.trial) {
                result = uploadTrialFile(account, file, block.optString("name", "document"), purpose, call);
            } else {
                result = upload(file, block.optString("name", "document"), purpose, account.token, call);
            }
            fileId = result.getString("id");
            host.fileIds.edit().putString(storageKey, fileId).apply();
            if (parsing) {
                event.send("parsed", object("name", block.optString("name"), "pages", block.optInt("pages")));
            }
        }
        return object("type", "document", "source", object("type", "file", "file_id", fileId));
    }

    private JSONObject uploadTrialFile(Account account, File file, String name, String purpose, Call call) throws Exception {
        HttpURLConnection conn = connect(account.origin + "/v1/files", account.token, false, call);
        try {
            conn.setReadTimeout(11 * 60 * 1000);
            conn.setDoOutput(true);
            conn.setFixedLengthStreamingMode(file.length());
            conn.setRequestProperty("Content-Type", "application/octet-stream");
            conn.setRequestProperty("X-File-Name", URLEncoder.encode(name, "UTF-8").replace("+", "%20"));
            conn.setRequestProperty("X-File-Purpose", purpose);
            try (OutputStream out = conn.getOutputStream(); InputStream in = new FileInputStream(file)) {
                copy(in, out, documentFileLimit(purpose));
            }
            check(conn);
            return new JSONObject(read(conn.getInputStream(), 1024 * 1024));
        } finally { conn.disconnect(); }
    }

    static int documentFileLimit(String purpose) {
        return ("user_data".equals(purpose) ? 32 : 100) * 1024 * 1024;
    }

    private JSONObject upload(File file, String name, String purpose, String token, Call call) throws Exception {
        String boundary = "lanwen" + UUID.randomUUID().toString().replace("-", "");
        HttpURLConnection conn = connect(DEEPSEEK + "/anthropic/v1/files", token, true, call);
        try {
            conn.setDoOutput(true);
            conn.setChunkedStreamingMode(32 * 1024);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            String filename = name.replaceAll("[\\r\\n\"\\\\/]", "_");
            try (OutputStream out = conn.getOutputStream(); FileInputStream in = new FileInputStream(file)) {
                out.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"purpose\"\r\n\r\n" + purpose
                    + "\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename
                    + "\"\r\nContent-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                copy(in, out, documentFileLimit(purpose));
                out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            }
            check(conn);
            return new JSONObject(read(conn.getInputStream(), 1024 * 1024));
        } finally { conn.disconnect(); }
    }

    private static HttpURLConnection connect(String address, String token, boolean anthropic, Call call) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(address).openConnection();
        call.attach(conn);
        conn.setConnectTimeout(18000);
        conn.setReadTimeout(150000);
        conn.setInstanceFollowRedirects(false);
        conn.setRequestProperty("User-Agent", "LanwenAndroid/0.1");
        if (anthropic) {
            conn.setRequestProperty("x-api-key", token);
            conn.setRequestProperty("anthropic-version", "2023-06-01");
            conn.setRequestProperty("anthropic-beta", "files-api-2025-04-14");
        } else if (!token.isEmpty()) {
            conn.setRequestProperty("Authorization", "Bearer " + token);
        }
        return conn;
    }

    private static void write(HttpURLConnection conn, byte[] data) throws IOException {
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setFixedLengthStreamingMode(data.length);
        try (OutputStream out = conn.getOutputStream()) { out.write(data); }
    }

    private static void check(HttpURLConnection conn) throws Exception {
        int status = conn.getResponseCode();
        if (status >= 200 && status < 300) return;
        if (status == 401) throw new Failure(401, "凭证无效，请重新配置");
        String detail = "";
        try {
            InputStream input = conn.getErrorStream();
            JSONObject body = input == null ? new JSONObject() : new JSONObject(read(input, 32768));
            JSONObject error = body.optJSONObject("error");
            detail = error == null ? body.optString("message") : error.optString("message");
        } catch (Exception ignored) { }
        if (status == 402 && detail.isEmpty()) detail = "可用余额不足";
        if (status == 429 && detail.isEmpty()) detail = "请求过于频繁";
        if (detail.isEmpty()) detail = "服务请求失败（HTTP " + status + "）";
        throw new Failure(status, detail.length() > 320 ? detail.substring(0, 320) : detail);
    }

    static JSONObject object(Object... pairs) throws Exception {
        JSONObject result = new JSONObject();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }

    static String read(InputStream input, int cap) throws IOException {
        return new String(bytes(input, cap), StandardCharsets.UTF_8);
    }
    static byte[] bytes(InputStream input, int cap) throws IOException {
        try (InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            copy(in, out, cap);
            return out.toByteArray();
        }
    }
    static void copy(InputStream input, OutputStream output, long cap) throws IOException {
        byte[] buffer = new byte[32 * 1024];
        long total = 0;
        int read;
        while ((read = input.read(buffer)) != -1) {
            total += read;
            if (total > cap) throw new Failure(413, "文件超过当前大小上限");
            output.write(buffer, 0, read);
        }
    }
}
