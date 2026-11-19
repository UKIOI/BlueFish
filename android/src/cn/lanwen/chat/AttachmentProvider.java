package cn.lanwen.chat;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

public final class AttachmentProvider extends ContentProvider {
    static final String AUTHORITY = "cn.lanwen.chat.attachments";

    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri uri) { return isUpdate(uri) ? AppUpdate.APK_TYPE : "image/jpeg"; }
    @Override public Cursor query(Uri uri, String[] p, String s, String[] a, String order) {
        if (!isUpdate(uri)) return null;
        String[] columns = p == null ? new String[] {OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : p;
        MatrixCursor cursor = new MatrixCursor(columns);
        Object[] row = new Object[columns.length];
        for (int index = 0; index < columns.length; index++) {
            if (OpenableColumns.DISPLAY_NAME.equals(columns[index])) row[index] = "BlueFish.apk";
            if (OpenableColumns.SIZE.equals(columns[index])) row[index] = AppUpdate.cachedApk(getContext().getCacheDir()).length();
        }
        cursor.addRow(row);
        return cursor;
    }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String s, String[] args) { return 0; }
    @Override public int delete(Uri uri, String s, String[] args) { return 0; }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (isUpdate(uri)) {
            if (!"r".equals(mode)) throw new FileNotFoundException();
            return ParcelFileDescriptor.open(AppUpdate.cachedApk(getContext().getCacheDir()), ParcelFileDescriptor.MODE_READ_ONLY);
        }
        String name = uri.getLastPathSegment();
        if (uri.getPathSegments().size() != 1 || name == null || !name.matches("[a-f0-9-]{36}\\.jpg")) {
            throw new FileNotFoundException();
        }
        File file = new File(new File(getContext().getCacheDir(), "camera"), name);
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.parseMode(mode));
    }

    private static boolean isUpdate(Uri uri) { return AppUpdate.INSTALL_PATH.equals(uri.getEncodedPath()); }
}
