import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

const REPO = 'rehmanytml-hue/IESTUDY-PRO';

// Checks GitHub for a newer release on launch and on demand.
export function useUpdateCheck() {
  const isNative = Capacitor.isNativePlatform();
  const [update, setUpdate] = useState(null);
  const [version, setVersion] = useState(null);
  const [status, setStatus] = useState('');
  // idle | downloading | installing | error
  const [dl, setDl] = useState({ state: 'idle', percent: 0, message: '' });

  const check = useCallback(async () => {
    if (!isNative) return;
    setStatus('Checking...');
    try {
      const info = await CapApp.getInfo();
      setVersion(info.build);
      // Plain release-download links (not the rate-limited API); native HTTP avoids CORS.
      const base = `https://github.com/${REPO}/releases/latest/download`;
      const res = await fetch(`${base}/version.json`, { cache: 'no-store' });
      if (!res.ok) { setStatus(`Update check failed (${res.status})`); return; }
      const latest = parseInt((await res.json()).build, 10);
      if (latest > parseInt(info.build, 10)) {
        setUpdate({ version: latest, url: `${base}/IEStudyPro.apk` });
        setStatus(`Version ${latest} available`);
      } else {
        setUpdate(null);
        setStatus("You're up to date");
      }
    } catch (e) {
      setStatus('Could not check. Are you online?');
    }
  }, [isNative]);

  useEffect(() => { check(); }, [check]);

  // Download the APK inside the app, then hand it to Android's installer.
  const install = useCallback(async () => {
    if (!update) return;
    const file = 'IEStudyPro-update.apk';
    let handle;
    try {
      setDl({ state: 'downloading', percent: 0, message: '' });
      try { await Filesystem.deleteFile({ path: file, directory: Directory.Cache }); } catch (e) { /* none yet */ }
      handle = await Filesystem.addListener('progress', (p) => {
        if (p.contentLength > 0) setDl({ state: 'downloading', percent: Math.round((p.bytes / p.contentLength) * 100), message: '' });
      });
      const res = await Filesystem.downloadFile({ url: update.url, path: file, directory: Directory.Cache, progress: true });
      setDl({ state: 'installing', percent: 100, message: '' });
      await FileOpener.open({ filePath: res.path, contentType: 'application/vnd.android.package-archive', openWithDefault: true });
      // Android now shows its own install screen. First time, it may ask to allow installs from this app.
      setDl({ state: 'idle', percent: 0, message: '' });
    } catch (e) {
      setDl({ state: 'error', percent: 0, message: String((e && e.message) || e) });
    } finally {
      if (handle) handle.remove();
    }
  }, [update]);

  return {
    isNative, update, version, status, check,
    dismiss: () => setUpdate(null),
    dl,
    install,
    openInBrowser: () => Browser.open({ url: update.url }),
  };
}
