import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const REPO = 'rehmanytml-hue/IESTUDY-PRO';

// Checks GitHub for a newer release when the Android app opens (needs internet; silently skipped offline).
export function useUpdateCheck() {
  const [update, setUpdate] = useState(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        const info = await CapApp.getInfo();
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
        if (!res.ok) return;
        const rel = await res.json();
        const latest = parseInt(String(rel.tag_name).replace(/\D/g, ''), 10);
        const asset = (rel.assets || []).find((a) => a.name.endsWith('.apk'));
        if (asset && latest > parseInt(info.build, 10)) {
          setUpdate({ version: latest, url: asset.browser_download_url });
        }
      } catch (e) { /* offline or rate limited: ignore */ }
    })();
  }, []);
  return {
    update,
    dismiss: () => setUpdate(null),
    install: () => Browser.open({ url: update.url }),
  };
}
