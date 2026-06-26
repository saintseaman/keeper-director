import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─────────────────────────────────────────────────────────────
// smartTagSounds — «умная» разметка звуков по осям сцены.
// Стратегия: сначала ИИ классифицирует по НАЗВАНИЮ файла. Если по какой-то
// оси модель не уверена (вернула пусто), а у звука есть прослушиваемый URL,
// делаем второй проход — ИИ СЛУШАЕТ само аудио (file_urls) и дозаполняет оси.
//
// Вход:  { sounds: [{ id, title, url }] }
// Выход: { results: [{ id, axes: { location:[ids], action:[ids], weather:[ids], mood:[ids] } }] }
//
// Допустимые id значений по осям — фиксированный словарь (см. SCENE_AXES во
// фронте). Модель обязана выбирать только из них.
// ─────────────────────────────────────────────────────────────

const AXIS_VALUES = {
  location: ['city', 'suburb', 'cafe', 'forest', 'dungeon', 'sea', 'temple', 'asylum', 'library', 'university', 'ruins', 'ship_deck'],
  action: ['explore', 'combat', 'dialogue', 'travel', 'ritual', 'rest', 'investigate', 'research', 'sanity', 'summon'],
  weather: ['rain', 'sunny', 'storm', 'night', 'fog', 'underwater', 'cosmic', 'snow'],
  mood: ['calm', 'tense', 'horror', 'mystery'],
};

const AXIS_HINTS = {
  location: 'Где происходит действие (можно несколько): city=город, suburb=пригород/дом, cafe=кафе/таверна, forest=лес/болото, dungeon=подземелье/пещера/подвал, sea=море/океан, temple=храм/церковь, asylum=лечебница, library=библиотека, university=университет, ruins=руины/древний город, ship_deck=корабль.',
  action: 'Что происходит: explore=исследование/фон, combat=бой/погоня, dialogue=диалог, travel=путешествие/дорога, ritual=ритуал/призыв, rest=отдых/лагерь, investigate=расследование, research=изучение тайн/оккультизм, sanity=безумие/паника, summon=пробуждение древнего.',
  weather: 'Погода/среда: rain=дождь, sunny=солнечно, storm=гроза, night=ночь/тьма, fog=туман/ветер, underwater=под водой/глубина, cosmic=космос/пустота, snow=снег/лёд.',
  mood: 'Настроение: calm=спокойно, tense=напряжённо/опасно, horror=ужас/крик/шёпот, mystery=тайна/загадка.',
};

function buildSchema() {
  const props = {};
  for (const [axis, vals] of Object.entries(AXIS_VALUES)) {
    props[axis] = { type: 'array', items: { type: 'string', enum: vals } };
  }
  return { type: 'object', properties: props };
}

function buildPrompt(title, axisIds) {
  const lines = axisIds.map((a) => `- ${a}: ${AXIS_HINTS[a]} Допустимые значения: [${AXIS_VALUES[a].join(', ')}]`);
  return [
    'Ты размечаешь звук для настольной ролевой игры в стиле лавкрафтовского хоррора.',
    `Название звука: "${title}".`,
    'Определи, к каким значениям каждой оси он относится. Выбирай ТОЛЬКО из допустимых значений.',
    'ВАЖНО: указывай ВСЕ подходящие значения, а не одно. Звук часто уместен сразу в нескольких контекстах — например дождь подходит и forest, и city; шёпот подходит и horror, и mystery. Не ограничивайся одним тегом, если по смыслу подходит несколько.',
    'Если по оси однозначно ничего не подходит — верни пустой массив для неё.',
    'Оси:',
    ...lines,
  ].join('\n');
}

// Чистим/валидируем ответ модели: только допустимые id, без дублей.
function sanitize(axesObj) {
  const out = {};
  for (const [axis, vals] of Object.entries(AXIS_VALUES)) {
    const got = Array.isArray(axesObj?.[axis]) ? axesObj[axis] : [];
    const filtered = Array.from(new Set(got.filter((v) => vals.includes(v))));
    if (filtered.length) out[axis] = filtered;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sounds } = await req.json();
    if (!Array.isArray(sounds) || sounds.length === 0) {
      return Response.json({ error: 'No sounds provided' }, { status: 400 });
    }

    const allAxes = Object.keys(AXIS_VALUES);
    const results = [];

    for (const s of sounds) {
      const title = s.title || '';
      let axes = {};

      // Проход 1 — по названию.
      try {
        const byName = await base44.integrations.Core.InvokeLLM({
          prompt: buildPrompt(title, allAxes),
          response_json_schema: buildSchema(),
        });
        axes = sanitize(byName);
      } catch {
        axes = {};
      }

      // Проход 2 — слушаем само аудио и ДОПОЛНЯЕМ теги по всем осям.
      // Звук может содержать детали, которых нет в названии (например капли
      // дождя, шёпот, гул) — добавляем их к тому, что найдено по названию.
      if (s.url) {
        try {
          const prompt = [
            'Прослушай этот аудиофайл и определи его атмосферу для настольной ролевой игры в стиле лавкрафтовского хоррора.',
            `Название файла: "${title}".`,
            'По каждой оси укажи ВСЕ подходящие значения, которые ты СЛЫШИШЬ в звуке (а не одно). Выбирай исключительно из допустимых значений. Если по оси ничего не подходит — пустой массив.',
            ...allAxes.map((a) => `- ${a}: ${AXIS_HINTS[a]} Допустимые значения: [${AXIS_VALUES[a].join(', ')}]`),
          ].join('\n');
          const byAudio = await base44.integrations.Core.InvokeLLM({
            prompt,
            file_urls: [s.url],
            response_json_schema: buildSchema(),
          });
          const cleaned = sanitize(byAudio);
          // Сливаем теги от названия и от прослушивания, без дублей.
          for (const a of allAxes) {
            const merged = Array.from(new Set([...(axes[a] || []), ...(cleaned[a] || [])]));
            if (merged.length) axes[a] = merged;
          }
        } catch {
          // молча оставляем то, что есть по названию
        }
      }

      results.push({ id: s.id, axes });
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});