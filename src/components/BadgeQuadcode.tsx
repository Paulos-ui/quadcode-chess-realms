import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function BadgeQuadcode() {
  return (
    <motion.a
      href="https://x.com/intent/tweet?text=%23QuadcodeHackathon"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full
                 bg-royal-950/80 backdrop-blur border border-gold-300/30 text-gold-100
                 shadow-[0_8px_32px_rgba(212,170,77,0.25)] hover:border-gold-300/60 transition
                 text-xs font-mono"
      aria-label="Made with Quadcode AI"
    >
      <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
      <span>
        Made with <span className="text-gold-200 font-semibold">Quadcode</span>
      </span>
    </motion.a>
  );
}
