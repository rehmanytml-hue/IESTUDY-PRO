import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const REPO = 'rehmanytml-hue/IESTUDY-PRO';

// Checks GitHub for a newer release on launch and on demand.
export function useUpdateCheck() {
  const isNative = Capacitor.isNativePlatform();
  const [update, setUpdate] = useState(null);
  const [version, setVersion] = useState(null);
  const [status, setStatus] = useState('');

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

  return {
    isNative, update, version, status, check,
    dismiss: () => setUpdate(null),
    install: () => Browser.open({ url: update.url }),
  };
}
