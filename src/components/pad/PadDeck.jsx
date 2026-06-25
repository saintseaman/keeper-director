import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PadPage from './PadPage';

// Пейджер дек: 5 страниц, свайп влево/вправо как рабочие столы iPhone.
// pages — массив массивов звуков (по <=9 на страницу).
export default function PadDeck({ pages, onRemoveCustom }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(0);
  const startX = useRef(null);
  const total = pages.length;

  const go = (next) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (clamped === page) return;
    setDir(clamped > page ? 1 : -1);
    setPage(clamped);
  };

  const onStart = (x) => { startX.current = x; };
  const onEnd = (x) => {
    if (startX.current == null) return;
    const dx = x - startX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? page + 1 : page - 1);
    startX.current = null;
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseUp={(e) => onEnd(e.clientX)}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={page}
            custom={dir}
            initial={{ x: dir >= 0 ? '100%' : '-100%', opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir >= 0 ? '-100%' : '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-0"
          >
            <PadPage sounds={pages[page]} onRemoveCustom={onRemoveCustom} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Точки-индикаторы страниц (как dock на iPhone) */}
      <div className="flex items-center justify-center gap-2 pt-4">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${i === page ? 'w-6 bg-orange-400' : 'w-2 bg-white/20 hover:bg-white/40'}`}
            aria-label={`Deck ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}