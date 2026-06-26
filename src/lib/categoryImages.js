// ИИ-арт фоны для пэдов — по одному изображению на категорию звука.
// Используются и встроенными звуками, и импортированными с Google Диска
// (у тех категория угадывается при импорте).

const CATEGORY_IMAGES = {
  atmosphere: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/2d207ce56_generated_image.png',
  events: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/ec0612767_generated_image.png',
  creatures: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/86c86bc17_generated_image.png',
  horror: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/aae7054ef_generated_image.png',
  madness: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/a87c16cea_generated_image.png',
  jumpscare: 'https://media.base44.com/images/public/6a3a3e4938bb6ef1d26caa1e/762e5f314_generated_image.png',
};

// Фон по категории звука. Фолбэк — atmosphere.
export function getCategoryImage(category) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.atmosphere;
}