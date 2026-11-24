import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { MachineIcon } from './machineIcons';

// Group + icon for each machine id.
const CHIP = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100';
const GROUPS = [
  { id: 'lock', label: 'Lockstitch', chip: CHIP },
  { id: 'overlock', label: 'Overlock', chip: CHIP },
  { id: 'chain', label: 'Chainstitch & Flatlock', chip: CHIP },
  { id: 'auto', label: 'Automatic', chip: CHIP },
  { id: 'bh', label: 'Buttonhole', chip: CHIP },
  { id: 'fasten', label: 'Buttons & Fastening', chip: CHIP },
  { id: 'other', label: 'Bartack & Other', chip: CHIP },
];

const META = {
  snls: ['lock', 'snls'], dnls: ['lock', 'dnls'],
  '3th_ol': ['overlock', 'ol3'], '4th_ol': ['overlock', 'ol4'],
  '5th_ol': ['overlock', 'ol5'], '6th_ol': ['overlock', 'ol6'],
  flat_lock: ['chain', 'flat'], foa: ['chain', 'foa'], sncs: ['chain', 'ch1'],
  dncs: ['chain', 'ch2'], '3ncs': ['chain', 'ch3'], '4ncs': ['chain', 'ch4'],
  kansai: ['chain', 'kansai'],
  auto_welt: ['auto', 'welt'], auto_jstitch: ['auto', 'jst'],
  bh_lock: ['bh', 'bhl'], bh_chain: ['bh', 'bhc'],
  ba_lock: ['fasten', 'bal'], ba_top: ['fasten', 'bat'],
  snap: ['fasten', 'snap'], eyelet: ['fasten', 'eyelet'],
  bartack: ['other', 'bar'], other: ['other', 'other'],
};

export function machineMeta(machine) {
  const [groupId, icon] = (machine && META[machine.id]) || ['other', 'other'];
  const Icon = ({ size }) => <MachineIcon name={icon} size={size} />;
  return { Icon, group: GROUPS.find((g) => g.id === groupId) };
}

export default function MachinePicker({ machines, value, onChange, dark }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = machines.find((m) => m.name === value);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    return GROUPS.map((g) => ({
      ...g,
      items: machines.filter((m) => machineMeta(m).group.id === g.id && m.name.toLowerCase().includes(term)),
    })).filter((g) => g.items.length);
  }, [machines, q]);

  const pick = (m) => { onChange(m.name); setOpen(false); setQ(''); };
  const sel = selected ? machineMeta(selected) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 p-3 pr-4 rounded-[24px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-500 text-left transition-colors"
      >
        <span className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${sel ? sel.group.chip : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
          {sel ? <sel.Icon size={46} /> : <MachineIcon name="snls" size={46} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-slate-800 dark:text-white leading-tight text-lg">
            {selected ? selected.name : 'Select machine'}
          </span>
          <span className="block text-sm text-slate-500 dark:text-slate-400 truncate">
            {selected ? `${sel.group.label} · ${selected.allowance}% allowance` : `${machines.length} machines available`}
          </span>
        </span>
        <ChevronDown className="shrink-0 text-slate-500" />
      </button>

      {open && createPortal(
        <div className={dark ? 'dark' : ''}>
        <div className="fixed inset-0 z-[90] flex items-end md:items-center md:justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full md:max-w-lg max-h-[85vh] flex flex-col bg-slate-50 dark:bg-[#1a211d] rounded-t-[28px] md:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Select machine"
          >
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600 md:hidden" />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Select machine</h3>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pb-3">
              <label className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-200/70 dark:bg-slate-800">
                <Search size={18} className="text-slate-500" />
                <input
                  id="machine-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search machines"
                  className="flex-1 min-w-0 bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-500"
                />
              </label>
            </div>
            <div className="overflow-y-auto px-5 pb-8 space-y-5 custom-scrollbar">
              {grouped.length === 0 && <p className="text-center text-slate-500 py-8">No machine matches “{q}”.</p>}
              {grouped.map((g) => (
                <div key={g.id}>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">{g.label}</div>
                  <div className="space-y-2">
                    {g.items.map((m) => {
                      const { Icon } = machineMeta(m);
                      const on = m.name === value;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => pick(m)}
                          className={`w-full flex items-center gap-3 p-3 rounded-[20px] text-left transition-colors ${on ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          <span className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${g.chip}`}><Icon size={42} /></span>
                          <span className="flex-1 min-w-0 font-bold text-slate-800 dark:text-white">{m.name}</span>
                          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">{m.allowance}%</span>
                          {on && <Check size={20} className="shrink-0 text-emerald-700 dark:text-emerald-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}
    </>
  );
}
