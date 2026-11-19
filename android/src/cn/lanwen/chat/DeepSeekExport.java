package cn.lanwen.chat;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.zip.CRC32;
import java.util.zip.CheckedInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipFile;

final class DeepSeekExport {
    private static final int ARCHIVE_LIMIT = 512 * 1024 * 1024;
    private static final int JSON_LIMIT = 48 * 1024 * 1024;
    private static final Pattern SESSION = Pattern.compile("chat_sessions/[^/]+\\.json");

    private DeepSeekExport() { }

    static void prepare(InputStream source, File destination, File cache) throws IOException {
        BufferedInputStream in = new BufferedInputStream(source);
        try (FileOutputStream out = new FileOutputStream(destination)) {
            in.mark(4);
            boolean zip = in.read() == 'P' && in.read() == 'K';
            in.reset();
            if (!zip) {
                copyJson(in, out);
                return;
            }
            File archive = File.createTempFile("deepseek-archive-", ".zip", cache);
            try {
                try (FileOutputStream archiveOut = new FileOutputStream(archive)) {
                    Api.copy(in, archiveOut, ARCHIVE_LIMIT);
                }
                try (ZipFile entries = new ZipFile(archive)) {
                    writeArchive(entries, out);
                }
            } finally {
                archive.delete();
            }
        }
    }

    private static void writeArchive(ZipFile zip, FileOutputStream out) throws IOException {
        ZipEntry legacy = zip.getEntry("conversations.json");
        ZipEntry manifest = zip.getEntry("manifest.json");
        if (legacy != null) {
            copyEntry(zip, legacy, out);
            return;
        }
        ZipEntry index = zip.getEntry("chat_session_index.json");
        if (manifest == null || index == null) {
            throw new Api.Failure(400, "压缩包中找不到 DeepSeek 对话记录。");
        }
        write(out, "{\"manifest\":");
        copyEntry(zip, manifest, out);
        write(out, ",\"index\":");
        copyEntry(zip, index, out);
        write(out, ",\"conversations\":[");
        Set<String> names = new HashSet<>();
        for (Enumeration<? extends ZipEntry> entries = zip.entries(); entries.hasMoreElements();) {
            ZipEntry entry = entries.nextElement();
            String name = entry.getName();
            if (!SESSION.matcher(name).matches()) continue;
            if (!names.add(name)) throw new Api.Failure(400, "DeepSeek 导出文件无法读取，请重新导出后再试。");
            if (names.size() > 1) out.write(',');
            copyEntry(zip, entry, out);
        }
        write(out, "]}");
    }

    private static void copyEntry(ZipFile zip, ZipEntry entry, FileOutputStream out) throws IOException {
        try (CheckedInputStream in = new CheckedInputStream(zip.getInputStream(entry), new CRC32())) {
            copyJson(in, out);
            if (in.getChecksum().getValue() != entry.getCrc()) throw new ZipException("DeepSeek export checksum mismatch");
        }
    }

    private static void copyJson(InputStream source, FileOutputStream out) throws IOException {
        BufferedInputStream in = source instanceof BufferedInputStream
            ? (BufferedInputStream) source : new BufferedInputStream(source);
        in.mark(3);
        if (!(in.read() == 0xef && in.read() == 0xbb && in.read() == 0xbf)) in.reset();
        Api.copy(in, out, (int) (JSON_LIMIT - out.getChannel().position()));
    }

    private static void write(FileOutputStream out, String text) throws IOException {
        out.write(text.getBytes(StandardCharsets.UTF_8));
    }
}
