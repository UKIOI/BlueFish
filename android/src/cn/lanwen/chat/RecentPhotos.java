package cn.lanwen.chat;

import android.Manifest;
import android.content.ContentUris;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Size;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

final class RecentPhotos {
    private static final int LIMIT = 12;
    private static final Uri IMAGES = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
    private static final String IMAGES_PERMISSION = Manifest.permission.READ_MEDIA_IMAGES;
    private static final String SELECTED_PERMISSION = Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED;
    private static final String STORAGE_PERMISSION = Manifest.permission.READ_EXTERNAL_STORAGE;
    private final Context context;
    private volatile Map<String, Uri> visible = Collections.emptyMap();

    RecentPhotos(Context context) { this.context = context; }

    static String[] permissions() {
        if (Build.VERSION.SDK_INT >= 34) return new String[] { IMAGES_PERMISSION, SELECTED_PERMISSION };
        return new String[] { Build.VERSION.SDK_INT >= 33 ? IMAGES_PERMISSION : STORAGE_PERMISSION };
    }

    String access() {
        if (context.checkSelfPermission(Build.VERSION.SDK_INT >= 33 ? IMAGES_PERMISSION : STORAGE_PERMISSION)
                == PackageManager.PERMISSION_GRANTED) return "full";
        if (Build.VERSION.SDK_INT >= 34 && context.checkSelfPermission(SELECTED_PERMISSION)
                == PackageManager.PERMISSION_GRANTED) return "limited";
        return "none";
    }

    synchronized JSONObject list() throws Exception {
        JSONArray photos = new JSONArray();
        Map<String, Uri> listed = new HashMap<>();
        String access = access();
        if (!"none".equals(access)) {
            String[] columns = { MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME };
            String order = MediaStore.Images.Media.DATE_ADDED + " DESC, " + MediaStore.Images.Media._ID + " DESC";
            try (Cursor cursor = context.getContentResolver().query(IMAGES, columns, null, null, order)) {
                while (cursor != null && photos.length() < LIMIT && cursor.moveToNext()) {
                    long mediaId = cursor.getLong(0);
                    // The bridge only accepts keys previously offered by this list.
                    String key = Long.toString(mediaId);
                    String name = cursor.getString(1);
                    listed.put(key, ContentUris.withAppendedId(IMAGES, mediaId));
                    photos.put(Api.object("id", key, "name", name == null || name.isEmpty() ? "照片" : name));
                }
            } catch (SecurityException revoked) {
                visible = Collections.emptyMap();
                return Api.object("access", "none", "photos", new JSONArray());
            }
        }
        visible = listed;
        return Api.object("access", access, "photos", photos);
    }

    Uri photo(String key) {
        return "none".equals(access()) ? null : visible.get(key);
    }

    WebResourceResponse thumbnail(String key) throws IOException {
        Uri photo = photo(key);
        if (photo == null) return null;
        Bitmap bitmap = Build.VERSION.SDK_INT >= 29
            ? context.getContentResolver().loadThumbnail(photo, new Size(240, 240), null)
            : MediaStore.Images.Thumbnails.getThumbnail(context.getContentResolver(), ContentUris.parseId(photo),
                MediaStore.Images.Thumbnails.MINI_KIND, null);
        if (bitmap == null) return null;
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 82, bytes)) return null;
            return new WebResourceResponse("image/jpeg", null, 200, "OK",
                Collections.singletonMap("Cache-Control", "no-store"), new ByteArrayInputStream(bytes.toByteArray()));
        } finally {
            bitmap.recycle();
        }
    }
}
