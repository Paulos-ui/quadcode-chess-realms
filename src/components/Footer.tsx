import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-gold-300/10 bg-royal-950/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid md:grid-cols-3 gap-8 items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">♟️</span>
            <span className="font-display text-lg text-gold-100">Jayking's Chess Realms</span>
          </div>
          <p className="text-sm text-gold-100/60 leading-relaxed max-w-xs">
            From the board to the big screen — every legendary game given the cinematic treatment by AI.
          </p>
        </div>

        <div className="text-sm text-gold-100/70 space-y-1.5">
          <div className="font-display text-gold-200 text-xs uppercase tracking-widest mb-2">Realm</div>
          <a href="#famous" className="block hover:text-gold-200 transition">Famous Legends</a>
          <a href="#create" className="block hover:text-gold-200 transition">Create Your Own</a>
          <a href="#battle" className="block hover:text-gold-200 transition">Mini Battle Arena</a>
        </div>

        <div className="text-sm text-gold-100/70 space-y-1.5">
          <div className="font-display text-gold-200 text-xs uppercase tracking-widest mb-2">Credits</div>
          <p>Game replays: chess.js</p>
          <p>Music: Tone.js procedural orchestra</p>
          <p>Lore + commentary: AI text models</p>
        </div>
      </div>

      <div className="border-t border-gold-300/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-gold-200/60">
          <div className="inline-flex items-center gap-2">
            Built for <span className="text-gold-200 font-semibold">Superteam</span> •{' '}
            <span className="text-gold-200 font-semibold">Jayking</span> ♟️ •{' '}
            <span className="text-gold-300">London, UK</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 fill-red-500 text-red-500" /> in London
            <span className="ml-1">🇬🇧</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
