import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  collection, query, orderBy, onSnapshot, deleteDoc, doc,
} from 'firebase/firestore';
import { Trash2, LogOut, FolderOpen, Cloud, CloudOff } from 'lucide-react';
import { auth, db, firebaseConfigured } from './firebase';

export function useUser() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!firebaseConfigured);
  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);
  return { user, ready };
}

const card = 'bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50';
const input = 'w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('in');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'in') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.code === 'auth/network-request-failed'
        ? 'You are offline. Connect once to sign in; after that the app works offline.'
        : err.message.replace('Firebase: ', ''));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className={`${card} max-w-md mx-auto space-y-4`}>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white">
        {mode === 'in' ? 'Sign in' : 'Create account'}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Sign in to save studies and open them on any device. Studies saved offline sync when you reconnect.
      </p>
      <input id="auth-email" type="email" required placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} className={input} />
      <input id="auth-password" type="password" required minLength={6} placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      {error && <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>}
      <button disabled={busy} className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50">
        {mode === 'in' ? 'Sign in' : 'Create account'}
      </button>
      <button type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
        className="w-full text-sm font-bold text-emerald-600 dark:text-emerald-400">
        {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}

export default function History({ user, onOpen }) {
  const [studies, setStudies] = useState([]);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    if (!user || !db) return undefined;
    const q = query(collection(db, 'users', user.uid, 'studies'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      setStudies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPendingSync(snap.metadata.hasPendingWrites);
    });
  }, [user]);

  if (!firebaseConfigured) {
    return (
      <div className={`${card} max-w-xl mx-auto text-slate-600 dark:text-slate-300`}>
        <h2 className="text-xl font-black mb-2">Cloud sync is not set up</h2>
        <p className="text-sm">Add your Firebase keys to a <code>.env</code> file (see <code>.env.example</code>) and rebuild the app.</p>
      </div>
    );
  }
  if (!user) return <SignIn />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div className="min-w-0">
          <div className="font-black text-slate-800 dark:text-white">Saved studies</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-xs font-bold ${pendingSync ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {pendingSync ? <CloudOff size={14} /> : <Cloud size={14} />}
            {pendingSync ? 'Waiting to sync' : 'Synced'}
          </span>
          <button onClick={() => signOut(auth)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {studies.length === 0 && (
        <div className={`${card} text-center text-slate-500 dark:text-slate-400`}>
          No saved studies yet. Record cycles, open the Report and press Save Study.
        </div>
      )}

      {studies.map((s) => (
        <div key={s.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 dark:text-white truncate">{s.config?.machineType || 'Standard Operation'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : 'Just now'} · {s.cycles?.length || 0} cycles · SMV {Number(s.smv || 0).toFixed(3)} min · {s.targetPerHour} pcs/h
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onOpen(s)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2">
              <FolderOpen size={16} /> Open
            </button>
            <button aria-label="Delete study" onClick={() => deleteDoc(doc(db, 'users', user.uid, 'studies', s.id))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-rose-600">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
