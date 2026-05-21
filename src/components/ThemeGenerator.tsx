import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import type { BoardTheme, ThemeName } from '../types';
import { THEMES, THEME_ROTATION } from '../lib/theme-engine';

interface Props {
  current: BoardTheme;
  onChange: (t: ThemeName) => void;
}

export function ThemeGenerator({ current, onChange }: Props) {
  return (
    <div className="parchment rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2">
          <Palette className="w-4 h-4 text-gold-300" />
          <h3 className="font-display text-base text-gold-100">Board Realm</h3>
        </div>
        <span className="text-[10px] font-mono uppercase text-gold-200/60">{current.label}</span>
      </div>
      <p className="text-[12px] text-gold-100/55 mb-3 leading-relaxed">{current.description}</p>
      <div className="grid grid-cols-4 gap-2">
        {THEME_ROTATION.map((name) => {
          const t = THEMES[name];
          const active = current.name === name;
          return (
            <motion.button
              key={name}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(name)}
              className={[
                'aspect-square rounded-lg overflow-hidden border-2 transition',
                active ? 'border-gold-300 shadow-gold' : 'border-gold-300/15 hover:border-gold-300/40',
              ].join(' ')}
              aria-label={`Switch to ${t.label}`}
            >
              <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                <div style={{ background: t.light }} />
                <div style={{ background: t.dark }} />
                <div style={{ background: t.dark }} />
                <div style={{ background: t.light }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
