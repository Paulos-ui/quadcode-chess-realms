import { motion } from 'framer-motion';
import { Sparkles, Swords, ChevronDown } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import { FAMOUS_GAMES } from '../data/famousGames';
import type { FamousGame } from '../types';

interface Props {
  onPickGame: (g: FamousGame) => void;
  onJumpToBrowser: () => void;
  onJumpToBattle: () => void;
}

export function Hero({ onPickGame, onJumpToBrowser, onJumpToBattle }: Props) {
  return (
    <section className="relative aurora-bg grain overflow-hidden">
      <ParticleBackground />

      {/* top nav */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">♟️</span>
          <span className="font-display font-bold tracking-widest text-gold-200 text-sm">JCR</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gold-100/70 font-medium">
          <a href="#famous" className="hover:text-gold-200 transition">Famous</a>
          <a href="#create" className="hover:text-gold-200 transition">Create</a>
          <a href="#battle" className="hover:text-gold-200 transition">Battle</a>
          <a href="https://github.com/Paulos-ui/quadcode-chess-realms" target="_blank" rel="noreferrer" className="hover:text-gold-200 transition">GitHub</a>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-14 lg:pt-24 pb-24 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-300/30 bg-gold-300/5 text-xs uppercase tracking-widest text-gold-200 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Building for Superteam
          </div>

          <h1 className="font-display text-[clamp(2.6rem,7vw,5.4rem)] leading-[1.02] font-extrabold tracking-tight">
            <span className="gold-shimmer">Jayking's</span>
            <br />
            <span className="text-gold-100/95">Chess Realms</span>
            <span className="ml-3 text-3xl md:text-4xl align-top">
              ♟️
              <span className="ml-1 align-middle">🇬🇧</span>
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gold-100/70 max-w-2xl leading-relaxed">
            From the board to the big screen turn legendary chess battles into cinematic AI experiences with custom lore, dramatic soundtracks, and animated victory clips.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onJumpToBrowser} className="btn-gold px-6 py-3 rounded-xl font-semibold tracking-wide inline-flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Enter the Realms
            </button>
            <button onClick={onJumpToBattle} className="btn-ghost px-6 py-3 rounded-xl font-semibold tracking-wide">
              Mini Battle Arena
            </button>
          </div>
        </motion.div>

        {/* Three big cards */}
        <div className="mt-14 lg:mt-20 grid md:grid-cols-3 gap-5">
          {[
            { title: 'Famous Legends', desc: 'Replay history\'s most cinematic games — Anderssen\'s sacrifices, Fischer\'s combinations, Kasparov\'s last stand against silicon.', icon: '👑', anchor: '#famous', cta: 'Explore', onClick: onJumpToBrowser },
            { title: 'Create Your Own', desc: 'Paste any PGN and the realm generates lore, music, and a cinematic clip just for it.', icon: '✨', anchor: '#create', cta: 'Paste PGN', onClick: onJumpToBrowser },
            { title: 'Mini Battle Arena', desc: 'Step into any position and play it out against a quick AI opponent. Practice the moves of legends.', icon: '⚔️', anchor: '#battle', cta: 'Fight', onClick: onJumpToBattle },
          ].map((card, i) => (
            <motion.button
              key={card.title}
              onClick={card.onClick}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.1 }}
              className="group text-left parchment rounded-2xl p-6 lg:p-7 hover:-translate-y-1 transition-transform"
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="font-display text-xl text-gold-100">{card.title}</h3>
              <p className="text-sm text-gold-100/60 mt-2 leading-relaxed">{card.desc}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-gold-300 text-sm font-semibold tracking-widest uppercase">
                {card.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick select 4 famous */}
        <div id="famous" className="mt-16 lg:mt-24">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold-200/70">Quick Select</div>
              <h2 className="font-display text-3xl md:text-4xl text-gold-100">Four games. Four legends.</h2>
            </div>
            <button
              onClick={onJumpToBrowser}
              className="hidden sm:inline-flex btn-ghost px-4 py-2 rounded-lg text-sm items-center gap-2"
            >
              Browse all <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FAMOUS_GAMES.map((g, i) => (
              <motion.button
                key={g.id}
                onClick={() => onPickGame(g)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.07 }}
                className="parchment text-left rounded-xl p-5 hover:border-gold-300/50 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gold-200/70">{g.year}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-gold-300/30 text-gold-200/80">{g.result}</span>
                </div>
                <div className="font-display text-lg text-gold-100 leading-tight group-hover:text-gold-50 transition">
                  {g.title} {g.flag && <span>{g.flag}</span>}
                </div>
                <div className="text-xs text-gold-100/55 mt-1">{g.subtitle}</div>
                <p className="text-xs text-gold-100/50 mt-3 clamp-2 leading-relaxed">{g.blurb}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-royal-obsidian pointer-events-none" />
    </section>
  );
}
