// Фон пэда по смыслу звука — чтобы за 1 секунду понять, что это.
// Приоритет: location → weather → mood → старая category (фолбэк).
// Картинки подобраны под значения осей sceneAxes (где мы / какая погода).
import { padAxes } from '@/lib/sceneAxes';
import { getCategoryImage } from '@/lib/categoryImages';

// Фоны по локации (ось location).
const LOCATION_BG = {
  city:      'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/7c4eb1535_generated_image.png',
  suburb:    'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/9d157e52a_generated_image.png',
  cafe:      'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/023fdd762_generated_image.png',
  forest:    'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/c97d5e621_generated_image.png',
  dungeon:   'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/e56da948e_generated_image.png',
  sea:       'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/699702abc_generated_image.png',
  ship_deck: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/699702abc_generated_image.png',
  temple:    'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/1128c0214_generated_image.png',
  asylum:    'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/19895a691_generated_image.png',
  library:   'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/20cac6313_generated_image.png',
  university:'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/20cac6313_generated_image.png',
  ruins:     'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/10f4e8729_generated_image.png',
};

// Фоны по погоде (ось weather) — используются, если локация не задана.
const WEATHER_BG = {
  rain:       'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/03228d98c_generated_image.png',
  storm:      'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/b3f2f3aab_generated_image.png',
  night:      'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/eed991410_generated_image.png',
  fog:        'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/15005c05a_generated_image.png',
  snow:       'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/d79660c5e_generated_image.png',
  cosmic:     'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/eb0f8f8e8_generated_image.png',
  underwater: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/699702abc_generated_image.png',
};

// Фоны по настроению (ось mood) — последний осмысленный фолбэк перед категорией.
const MOOD_BG = {
  horror:  'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/eed991410_generated_image.png',
  mystery: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/15005c05a_generated_image.png',
};

// Подобрать фон пэду по его осям. override — ручные правки (override.axes).
// width — целевая ширина для CDN-ресайза (как в getCategoryImage).
export function getPadBackground(pad, override, width = 320) {
  const axes = padAxes(pad, override);
  const pick = (map, ids) => ids?.map((id) => map[id]).find(Boolean) || null;

  const base =
    pick(LOCATION_BG, axes.location) ||
    pick(WEATHER_BG, axes.weather) ||
    pick(MOOD_BG, axes.mood);

  // Если по осям ничего не нашли — старый фон по категории.
  if (!base) return getCategoryImage(pad?.category, width);
  return `${base}?width=${width}&format=webp`;
}