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
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) { setStatus(`Update check failed (${res.status})`); return; }
      const rel = await res.json();
      const latest = parseInt(String(rel.tag_name).replace(/\D/g, ''), 10);
      const asset = (rel.assets || []).find((a) => a.name.endsWith('.apk'));
      if (asset && latest > parseInt(info.build, 10)) {
        setUpdate({ version: latest, url: asset.browser_download_url });
        setStatus(`Version ${latest} available`);
      } else {
        setUpdate(null);
        setStatus('You have the latest version');
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
