import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, LogIn, LogOut, History, Crown, ChevronDown } from 'lucide-react';
import type { Profile } from '../lib/supabase';

interface Props {
  profile: Profile | null;
  isLoggedIn: boolean;
  authEnabled: boolean;
  onSignInClick: () => void;
  onProfileClick: () => void;
  onHistoryClick: () => void;
  onLogOut: () => void;
}

export function UserMenu({
  profile,
  isLoggedIn,
  authEnabled,
  onSignInClick,
  onProfileClick,
  onHistoryClick,
  onLogOut,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!authEnabled) return null; // hide entirely when Supabase isn't configured

  if (!isLoggedIn) {
    return (
      <button
        onClick={onSignInClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-royal-900/70 backdrop-blur border border-gold-300/20 text-gold-200 hover:border-gold-300/60 hover:text-gold-100 transition text-xs font-mono uppercase tracking-widest"
      >
        <LogIn className="w-3.5 h-3.5" />
        Sign in
      </button>
    );
  }

  const displayName = profile?.display_name ?? 'Player';
  const initial = displayName[0]?.toUpperCase() ?? 'P';

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-royal-900/70 backdrop-blur border border-gold-300/20 text-gold-200 hover:border-gold-300/60 transition"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-royal-950 font-display text-sm flex items-center justify-center">
          {initial}
        </span>
        <span className="text-xs font-mono uppercase tracking-widest truncate max-w-[120px]">
          {displayName}
        </span>
        <ChevronDown className={`w-3 h-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 parchment rounded-xl p-1.5 z-50"
          >
            <div className="px-3 py-2.5 border-b border-gold-300/10 mb-1.5">
              <div className="font-display text-sm text-gold-100 inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-gold-300" />
                {displayName}
              </div>
            </div>
            <MenuItem
              icon={<History className="w-4 h-4" />}
              label="Your games"
              onClick={() => {
                setOpen(false);
                onHistoryClick();
              }}
            />
            <MenuItem
              icon={<UserIcon className="w-4 h-4" />}
              label="Profile"
              onClick={() => {
                setOpen(false);
                onProfileClick();
              }}
            />
            <div className="h-px bg-gold-300/10 my-1" />
            <MenuItem
              icon={<LogOut className="w-4 h-4" />}
              label="Log out"
              danger
              onClick={() => {
                setOpen(false);
                onLogOut();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
        danger
          ? 'text-red-300/80 hover:bg-red-500/10 hover:text-red-200'
          : 'text-gold-100/80 hover:bg-gold-300/10 hover:text-gold-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
