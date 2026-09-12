package care.willow.childcare;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private String lastHandledToken = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
        handleReturnIntent(getIntent());
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
