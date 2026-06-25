import React from 'react';
import Pad from './Pad';

// Одна "дека" — сетка 3x3 пэдов (9 слотов).
export default function PadPage({ sounds, onRemoveCustom }) {
  const slots = Array.from({ length: 9 }, (_, i) => sounds[i] || null);
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
      {slots.map((sound, i) => (
        <Pad key={sound ? sound.id : `empty-${i}`} sound={sound} index={i} onRemoveCustom={onRemoveCustom} />
      ))}
    </div>
  );
}