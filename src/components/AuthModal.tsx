import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUp, logIn } from '../lib/auth';

interface Props {
  onClose: () => void;
  onAuthenticated: () => void;
}

type Mode = 'login' | 'signup';

export function AuthModal({ onClose, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === 'login' ? await logIn(email, password) : await signUp(email, password, displayName);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        return;
      }
      // signUp returns ok=true with error="Check your email…" when confirmation is on
      if (result.error) {
        setInfo(result.error);
        return;
      }
      onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="parchment rounded-2xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gold-200/60 hover:text-gold-100"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-royal-950/60 rounded-lg">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 py-2 text-sm rounded-md transition ${
              mode === 'login'
                ? 'bg-gold-300/15 text-gold-100 border border-gold-300/40'
                : 'text-gold-200/60 hover:text-gold-100'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 py-2 text-sm rounded-md transition ${
              mode === 'signup'
                ? 'bg-gold-300/15 text-gold-100 border border-gold-300/40'
                : 'text-gold-200/60 hover:text-gold-100'
            }`}
          >
            Sign up
          </button>
        </div>

        <h3 className="font-display text-xl text-gold-100 mb-1">
          {mode === 'login' ? 'Welcome back' : 'Claim your throne'}
        </h3>
        <p className="text-sm text-gold-100/60 mb-5">
          {mode === 'login'
            ? 'Log in to access your game history.'
            : 'Sign up to save your games and personalize your name.'}
        </p>

        <div className="space-y-3">
          {mode === 'signup' && (
            <Field icon={<UserIcon className="w-4 h-4" />} label="Display name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should we call you?"
                maxLength={32}
                className="w-full bg-transparent border-none outline-none text-gold-100 placeholder:text-gold-200/30"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />} label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent border-none outline-none text-gold-100 placeholder:text-gold-200/30"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              className="w-full bg-transparent border-none outline-none text-gold-100 placeholder:text-gold-200/30"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 text-sm text-red-300/90 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="mt-4 flex items-start gap-2 text-sm text-gold-200/90 bg-gold-300/10 border border-gold-300/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="btn-gold w-full mt-5 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <p className="text-[11px] text-gold-200/50 mt-4 font-mono leading-relaxed text-center">
          Optional. Skip this and you can still play — accounts unlock game history.
        </p>
      </motion.div>
    </motion.div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-gold-200/60 mb-1">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-royal-950/80 border border-gold-300/20 focus-within:border-gold-300/60 transition">
        <span className="text-gold-200/60">{icon}</span>
        {children}
      </div>
    </label>
  );
}
