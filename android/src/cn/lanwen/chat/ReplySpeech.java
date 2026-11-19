package cn.lanwen.chat;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import java.util.Locale;
import java.util.Set;

final class ReplySpeech {
    interface Listener { void finished(String id, boolean failed); }

    private final Context context;
    private final Listener listener;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private TextToSpeech engine;
    private boolean ready;
    private String id;
    private String pending;

    ReplySpeech(Context context, Listener listener) {
        this.context = context;
        this.listener = listener;
    }

    void speak(String nextId, String text) {
        stop();
        id = nextId;
        pending = text.trim();
        if (engine == null) {
            engine = new TextToSpeech(context, status -> ui.post(() -> initialize(status)));
        } else if (ready) {
            play();
        }
    }

    private void initialize(int status) {
        if (engine == null) return;
        if (status != TextToSpeech.SUCCESS) {
            closeEngine();
            finish(true);
            return;
        }
        ready = true;
        engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String utterance) {}
            @Override public void onDone(String utterance) { complete(utterance, false); }
            @Override public void onError(String utterance) { complete(utterance, true); }
        });
        if (id != null) play();
    }

    private void play() {
        String text = pending;
        pending = null;
        Locale preferred = text.matches("(?s).*\\p{IsHan}.*") ? Locale.SIMPLIFIED_CHINESE : Locale.ENGLISH;
        Voice voice = localVoice(preferred);
        if (voice == null || text.isEmpty() || engine.setVoice(voice) != TextToSpeech.SUCCESS) {
            finish(true);
            return;
        }
        int limit = Math.min(3600, TextToSpeech.getMaxSpeechInputLength());
        for (int start = 0; start < text.length();) {
            int end = Math.min(text.length(), start + limit);
            if (end < text.length()) {
                int paragraph = text.lastIndexOf('\n', end - 1);
                if (paragraph > start + limit / 2) end = paragraph + 1;
                else if (Character.isLowSurrogate(text.charAt(end))) end--;
            }
            int queued = engine.speak(text.substring(start, end), TextToSpeech.QUEUE_ADD, null,
                id + ":" + (end == text.length() ? "end" : start));
            if (queued != TextToSpeech.SUCCESS) {
                engine.stop();
                finish(true);
                return;
            }
            start = end;
        }
    }

    private Voice localVoice(Locale preferred) {
        Set<Voice> voices = engine.getVoices();
        if (voices == null) return null;
        Voice best = null;
        for (Voice voice : voices) {
            Set<String> features = voice.getFeatures();
            if (voice.isNetworkConnectionRequired() || (features != null && features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))
                    || !voice.getLocale().getLanguage().equals(preferred.getLanguage())) continue;
            if (voice.getLocale().equals(preferred)) return voice;
            if (best == null) best = voice;
        }
        return best;
    }

    private void complete(String utterance, boolean failed) {
        ui.post(() -> {
            if (id == null || !utterance.startsWith(id + ":")) return;
            if (failed) engine.stop();
            if (failed || utterance.endsWith(":end")) finish(failed);
        });
    }

    private void finish(boolean failed) {
        String finished = id;
        id = null;
        pending = null;
        if (finished != null) listener.finished(finished, failed);
    }

    void stop() {
        if (ready) engine.stop();
        finish(false);
    }

    private void closeEngine() {
        if (engine != null) engine.shutdown();
        engine = null;
        ready = false;
    }

    void close() {
        stop();
        closeEngine();
    }
}
