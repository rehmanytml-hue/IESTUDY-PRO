import React, { useEffect, useState } from 'react';

// Opening animation: stopwatch draws itself, hand sweeps, name fades in, then the screen fades out.
export default function Splash() {
  const [phase, setPhase] = useState('show'); // show -> hide -> gone
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hide'), 2300);
    const t2 = setTimeout(() => setPhase('gone'), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (phase === 'gone') return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-emerald-600 text-white"
      style={{ opacity: phase === 'hide' ? 0 : 1, transition: 'opacity 0.6s ease', pointerEvents: phase === 'hide' ? 'none' : 'auto' }}
    >
      <svg viewBox="0 0 108 108" width="160" height="160" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <circle className="sp-ring" cx="54" cy="58" r="20" pathLength="100" />
        <path className="sp-top" d="M48 31h12M54 31v7" />
        <path className="sp-btn" d="M69 42l4-4" />
        <g className="sp-hand" style={{ transformOrigin: '54px 58px' }}>
          <path d="M54 58V43" />
        </g>
        <circle cx="54" cy="58" r="2.4" fill="#fff" stroke="none" />
      </svg>
      <div className="sp-title mt-6 text-3xl font-black tracking-tight">
        IE<span className="opacity-80">StudyPro</span>
      </div>
      <div className="sp-sub mt-1 text-sm font-medium text-emerald-100">Time study &amp; target estimation</div>
      <style>{`
        .sp-ring { stroke-dasharray: 100; stroke-dashoffset: 100; animation: spDraw 0.9s ease-out 0.1s forwards; }
        .sp-top, .sp-btn { opacity: 0; animation: spIn 0.3s ease-out 0.8s forwards; }
        .sp-hand { opacity: 0; animation: spIn 0.2s ease-out 0.9s forwards, spSweep 1.2s cubic-bezier(.5,0,.2,1) 0.9s forwards; }
        .sp-title { opacity: 0; transform: translateY(10px); animation: spUp 0.5s ease-out 1.2s forwards; }
        .sp-sub { opacity: 0; animation: spIn 0.5s ease-out 1.5s forwards; }
        @keyframes spDraw { to { stroke-dashoffset: 0; } }
        @keyframes spIn { to { opacity: 1; } }
        @keyframes spSweep { from { transform: rotate(-360deg); } to { transform: rotate(0deg); } }
        @keyframes spUp { to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .sp-ring, .sp-top, .sp-btn, .sp-hand, .sp-title, .sp-sub { animation: none; opacity: 1; stroke-dashoffset: 0; transform: none; }
        }
      `}</style>
    </div>
  );
}
