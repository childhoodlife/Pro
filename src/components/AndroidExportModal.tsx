import React, { useState } from 'react';
import { X, Smartphone, Download, Copy, Check, Code, ExternalLink } from 'lucide-react';
import { Translations } from '../utils/translations';
import { sound } from '../utils/audio';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidExportModalProps {
  t: Translations;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ t, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'compose' | 'manifest'>('pwa');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (code: string, key: string) => {
    sound.playPenClick();
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const composeCodeSnippet = `package com.oldschool.pengames

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    PenGamesWebView()
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PenGamesWebView() {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.cacheMode = WebSettings.LOAD_DEFAULT
                // Loads the offline bundled assets or the hosted game app
                loadUrl("file:///android_asset/index.html")
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}`;

  const manifestXmlSnippet = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.oldschool.pengames">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Old School Pen Games"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="unspecified"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-amber-100 font-handwriting">
                {t.androidExport.title}
              </h2>
              <p className="text-[11px] text-stone-400">
                {t.androidExport.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPenClick();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'pwa'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            1. Install on Android (PWA)
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'compose'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            2. MainActivity.kt (Compose)
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'manifest'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            3. AndroidManifest.xml
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-300">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200/90 leading-relaxed">
                <div className="font-semibold text-amber-300 text-sm mb-1">
                  Immediate 1-Tap Android App Installation
                </div>
                You can install Old School Pen Games directly onto any Android phone or tablet without needing Google Play! It creates a native Android home screen icon, runs full-screen with offline caching, and gives haptic feedback.
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-center font-medium">
                  ✓ {t.androidExport.installed}
                </div>
              ) : isInstallable ? (
                <button
                  onClick={() => {
                    sound.playPenClick();
                    install();
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.androidExport.installPWA}</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 text-stone-400 leading-relaxed">
                  <div className="font-semibold text-stone-200 mb-1">How to Install on Chrome / Android Browser:</div>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Tap the <strong>three dots menu (⋮)</strong> in Chrome browser.</li>
                    <li>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>The app icon will appear on your phone home screen ready to play anytime offline!</li>
                  </ol>
                </div>
              )}

              <div className="pt-2 border-t border-stone-800">
                <h4 className="font-semibold text-stone-200 text-sm mb-2">{t.androidExport.buildApkSteps}</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-400">
                  <li>Open Android Studio and choose <strong>"New Project &gt; Empty Activity"</strong> (Jetpack Compose).</li>
                  <li>Run <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-300">npm run build</code> in this web project.</li>
                  <li>Copy the contents of <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-300">dist/</code> into your Android Studio <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-300">app/src/main/assets/</code> directory.</li>
                  <li>Copy the <code className="text-amber-300">MainActivity.kt</code> and <code className="text-amber-300">AndroidManifest.xml</code> from the tabs above.</li>
                  <li>Click <strong>"Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)"</strong> to generate your signed installable APK!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-stone-400">app/src/main/java/.../MainActivity.kt</span>
                <button
                  onClick={() => handleCopy(composeCodeSnippet, 'compose')}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                >
                  {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'compose' ? t.androidExport.copied : t.androidExport.copyCode}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 font-mono text-[11px] overflow-x-auto text-amber-200/90 leading-relaxed">
                {composeCodeSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-stone-400">app/src/main/AndroidManifest.xml</span>
                <button
                  onClick={() => handleCopy(manifestXmlSnippet, 'manifest')}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'manifest' ? t.androidExport.copied : t.androidExport.copyCode}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 font-mono text-[11px] overflow-x-auto text-amber-200/90 leading-relaxed">
                {manifestXmlSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/40 text-right">
          <button
            onClick={() => {
              sound.playPenClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
