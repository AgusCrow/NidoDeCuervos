#!/usr/bin/env bash
set -e

DIR="/mnt/e/Servidor/RPG/mobile_build"
cd "$DIR"

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
  echo "Error: android.jar not found at $ANDROID_JAR"
  exit 1
fi

rm -rf gen bin
mkdir -p gen bin/classes res/values res/drawable src/com/elgremio/rpg

# Copy icon
if [ -f "/mnt/e/Servidor/RPG/frontend/public/icons/icon-512.png" ]; then
  cp "/mnt/e/Servidor/RPG/frontend/public/icons/icon-512.png" res/drawable/icon.png
elif [ -f "/mnt/e/Servidor/RPG/desktop/icon.png" ]; then
  cp "/mnt/e/Servidor/RPG/desktop/icon.png" res/drawable/icon.png
fi

# 1. Write AndroidManifest.xml
cat << 'EOF' > AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.elgremio.rpg"
    android:versionCode="2"
    android:versionName="1.1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.NFC" />

    <application
        android:label="El Gremio RPG"
        android:icon="@drawable/icon"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name="com.elgremio.rpg.MainActivity"
            android:label="El Gremio RPG"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:screenOrientation="portrait"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 2. Write strings.xml
cat << 'EOF' > res/values/strings.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">El Gremio RPG</string>
</resources>
EOF

# 3. Write MainActivity.java
cat << 'EOF' > src/com/elgremio/rpg/MainActivity.java
package com.elgremio.rpg;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        try {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        } catch (Exception e) {}

        String ua = settings.getUserAgentString();
        settings.setUserAgentString(ua + " ElGremioApp/1.1 (Android; Mobile; Standalone)");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl("http://192.168.0.200:8083");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

echo "[1/6] Generating R.java with aapt..."
aapt package -m -J gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

echo "[2/6] Compiling Java classes with javac..."
javac --release 8 -cp "$ANDROID_JAR" -d bin/classes gen/com/elgremio/rpg/R.java src/com/elgremio/rpg/MainActivity.java

echo "[3/6] Converting to Dalvik DEX with dalvik-exchange..."
/usr/bin/dalvik-exchange --dex --output=bin/classes.dex bin/classes

echo "[4/6] Creating unaligned APK package with aapt..."
aapt package -f -M AndroidManifest.xml -S res -I "$ANDROID_JAR" -F bin/unaligned.apk
(cd bin && aapt add unaligned.apk classes.dex)

echo "[5/6] 4-byte Aligning APK with zipalign..."
zipalign -f -v 4 bin/unaligned.apk bin/aligned.apk

echo "[6/6] Signing APK with apksigner..."
if [ ! -f "elgremio.keystore" ]; then
  keytool -genkeypair -v -keystore elgremio.keystore -storepass elgremio123 -keypass elgremio123 -alias elgremio -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=El Gremio RPG, OU=Gaming, O=Nido de Cuervos, L=Buenos Aires, C=AR"
fi

FINAL_OUT="/mnt/e/Servidor/RPG/frontend/public/downloads/ElGremioRPG.apk"
mkdir -p "$(dirname "$FINAL_OUT")"
apksigner sign --ks elgremio.keystore --ks-pass pass:elgremio123 --ks-key-alias elgremio --key-pass pass:elgremio123 --out "$FINAL_OUT" bin/aligned.apk

echo "Verifying signed APK..."
apksigner verify --verbose "$FINAL_OUT"

# Also copy to dist if dist/downloads exists
if [ -d "/mnt/e/Servidor/RPG/frontend/dist/downloads" ]; then
  cp "$FINAL_OUT" "/mnt/e/Servidor/RPG/frontend/dist/downloads/ElGremioRPG.apk"
fi

echo "APK BUILD SUCCESSFUL: $FINAL_OUT"
ls -la "$FINAL_OUT"
