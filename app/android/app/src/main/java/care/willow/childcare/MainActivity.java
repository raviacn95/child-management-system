package care.willow.childcare;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import java.util.List;
import java.util.Locale;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.net.URISyntaxException;

public class MainActivity extends BridgeActivity {
    private String lastHandledToken = "";
    private boolean clearedCache = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        routeAppIntents();
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
        leaveStaleShell(web);
    }

    private void leaveStaleShell(WebView web) {
        String url = web.getUrl();
        if (url == null || !url.contains("raviacn95.github.io/child-management-system")) return;
        if (!url.matches(".*[?&]v=(looks|framework|return|toppicks|moviesum|design).*")) return;
        String hash = "";
        int hashAt = url.indexOf('#');
        if (hashAt >= 0) hash = url.substring(hashAt);
        web.loadUrl("https://raviacn95.github.io/child-management-system/" + hash);
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

    private void routeAppIntents() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url != null && "intent".equalsIgnoreCase(url.getScheme())) {
                    openAppIntent(url.toString());
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    private void openAppIntent(String uri) {
        Intent intent;
        try {
            intent = Intent.parseUri(uri, Intent.URI_INTENT_SCHEME);
        } catch (URISyntaxException e) {
            return;
        }
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setComponent(null);
        intent.setSelector(null);
        String pkg = intent.getPackage();
        String fallback = intent.getStringExtra("browser_fallback_url");
        String appName = cleanAppName(intent.getStringExtra("app_name"));
        String activity = activityInPackage(intent.getStringExtra("activity"), pkg);
        if (pkg != null && intent.getData() == null && Intent.ACTION_MAIN.equals(intent.getAction())) {
            if (openInstalledApp(pkg, activity)) return;
            if (fallback != null && fallback.startsWith("https://")) {
                Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)).addCategory(Intent.CATEGORY_BROWSABLE);
                if (tryStart(web)) return;
            }
            Toast.makeText(this, "That app is not installed", Toast.LENGTH_SHORT).show();
            return;
        }
        if (activity != null && tryStart(explicitActivity(pkg, activity))) return;
        if (pkg == null) {
            Intent named = launcherNamed(appName);
            if (named != null) tryStart(named);
            else if (appName != null) Toast.makeText(this, "No installed app named " + appName, Toast.LENGTH_SHORT).show();
            return;
        }
        if (tryStart(intent)) return;
        // TV apps such as com.netflix.ninja accept title links without declaring BROWSABLE.
        if (pkg != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null
                && "https".equals(intent.getData().getScheme())) {
            intent.removeCategory(Intent.CATEGORY_BROWSABLE);
            if (tryStart(intent)) return;
        }
        if (pkg != null && (tryStart(launcherFor(pkg, Intent.CATEGORY_LEANBACK_LAUNCHER)) || tryStart(launcherFor(pkg, Intent.CATEGORY_LAUNCHER)))) {
            return;
        }
        if (fallback != null && fallback.startsWith("https://")) {
            Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)).addCategory(Intent.CATEGORY_BROWSABLE);
            if (tryStart(web)) return;
        }
        if (pkg == null) return;
        Uri play = Uri.parse("market://details?id=" + pkg);
        Uri amazon = Uri.parse("amzn://apps/android?p=" + pkg);
        boolean fireOs = "Amazon".equalsIgnoreCase(Build.MANUFACTURER);
        if (tryStart(new Intent(Intent.ACTION_VIEW, fireOs ? amazon : play))) return;
        tryStart(new Intent(Intent.ACTION_VIEW, fireOs ? play : amazon));
    }

    private boolean openInstalledApp(String pkg, String activity) {
        if (activity != null && tryStart(explicitActivity(pkg, activity))) return true;
        if (tryStart(launcherFor(pkg, Intent.CATEGORY_LEANBACK_LAUNCHER))) return true;
        Intent installed = getPackageManager().getLaunchIntentForPackage(pkg);
        if (installed != null) {
            installed.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (tryStart(installed)) return true;
        }
        return tryStart(launcherFor(pkg, Intent.CATEGORY_LAUNCHER));
    }

    private String activityInPackage(String activity, String pkg) {
        if (activity == null || pkg == null) return null;
        String cls = activity.trim();
        if (cls.length() > 200 || !cls.startsWith(pkg + ".")) return null;
        if (!cls.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+")) return null;
        return cls;
    }

    private static Intent explicitActivity(String pkg, String cls) {
        Intent launch = new Intent(Intent.ACTION_MAIN);
        launch.setClassName(pkg, cls);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return launch;
    }

    private String cleanAppName(String wanted) {
        if (wanted == null) return null;
        String trimmed = wanted.trim();
        if (trimmed.isEmpty() || trimmed.length() > 30 || trimmed.indexOf('\n') >= 0 || trimmed.indexOf('\r') >= 0) return null;
        return trimmed;
    }

    /** Opens the launcher activity whose label matches the name the user typed. */
    private Intent launcherNamed(String wanted) {
        if (wanted == null) return null;
        String needle = wanted.toLowerCase(Locale.ROOT);
        PackageManager pm = getPackageManager();
        String[] categories = { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER };
        for (String category : categories) {
            List<ResolveInfo> apps = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category), 0);
            for (ResolveInfo info : apps) {
                if (info.activityInfo == null) continue;
                CharSequence label = info.loadLabel(pm);
                if (label == null || !label.toString().trim().toLowerCase(Locale.ROOT).equals(needle)) continue;
                Intent launch = new Intent(Intent.ACTION_MAIN).addCategory(category);
                launch.setClassName(info.activityInfo.packageName, info.activityInfo.name);
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                return launch;
            }
        }
        return null;
    }

    private static Intent launcherFor(String pkg, String category) {
        return new Intent(Intent.ACTION_MAIN).addCategory(category).setPackage(pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    private boolean tryStart(Intent intent) {
        try {
            startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }
}
