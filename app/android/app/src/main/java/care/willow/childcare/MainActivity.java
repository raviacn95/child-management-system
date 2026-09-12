package care.willow.childcare;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private String lastHandledToken = "";
    private boolean clearedCache = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prepareLiveWebView();
        handleReturnIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleReturnIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        prepareLiveWebView();
        handleReturnIntent(getIntent());
    }

    private void prepareLiveWebView() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        WebView web = getBridge().getWebView();
        WebSettings settings = web.getSettings();
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (!clearedCache) {
            web.clearCache(true);
            clearedCache = true;
        }
    }

    private void handleReturnIntent(Intent intent) {
        if (intent == null || getBridge() == null || getBridge().getWebView() == null) return;
        Uri data = intent.getData();
        if (data == null || !"willow".equals(data.getScheme())) return;
        String token = data.getQueryParameter("token");
        if (token == null || !token.matches("[a-fA-F0-9]{16,64}")) return;
        if (token.equals(lastHandledToken)) return;
        lastHandledToken = token;
        final String js = "window.location.hash='#/return?token=" + token + "';";
        getBridge().getWebView().post(() -> getBridge().eval(js, null));
    }
}
