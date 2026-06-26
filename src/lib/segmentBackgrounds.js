// Фоновые изображения для сегментов колеса атмосферы.
// Ключ — id значения оси (location/action). Сгенерированы под тематику звуков.

export const SEGMENT_BG = {
  // Локации
  city: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/b6f28282e_generated_image.png',
  suburb: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/ec5eeecfe_generated_image.png',
  cafe: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/58df79bae_generated_image.png',
  forest: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/c5eb2abda_generated_image.png',
  dungeon: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/9944cf492_generated_image.png',
  sea: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/7e60d8a88_generated_image.png',
  temple: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/0da4c049f_generated_image.png',
  // Действия
  explore: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/ab852de1f_generated_image.png',
  combat: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/c04ddffb7_generated_image.png',
  dialogue: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/9a73c1cd3_generated_image.png',
  travel: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/146903270_generated_image.png',
  ritual: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/6a1d6879c_generated_image.png',
  rest: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/5c51d03b9_generated_image.png',
};

export function segmentBg(valueId) {
  return SEGMENT_BG[valueId] || null;
}