// ─────────────────────────────────────────────────────────────
// ЛОКАЛІЗАЦІЯ КОНТЕНТУ (Milestone 2)
// Назви/описи звуків і сцен — RU / UA. EN береться з самого об'єкта
// (поле title/description у soundData.js), тому тут лише ru/ua.
//
// ВАЖЛИВО: англійський title у SOUNDS лишається стабільним КЛЮЧЕМ
// (на ньому тримається getSoundIdByName, layers, timeline_events).
// Переклади зберігаємо окремо за id — мапа «назва → id» не ламається.
// ─────────────────────────────────────────────────────────────

// Звуки: id → { ru, ua }  (назва звуку)
export const SOUND_TITLES = {
  // ATMOSPHERE
  rain_heavy: { ru: 'Ливень', ua: 'Злива' },
  rain_light: { ru: 'Лёгкий дождь', ua: 'Легкий дощ' },
  wind_howling: { ru: 'Воющий ветер', ua: 'Виття вітру' },
  wind_gentle: { ru: 'Лёгкий бриз', ua: 'Легкий бриз' },
  thunder: { ru: 'Гром', ua: 'Грім' },
  ocean_waves: { ru: 'Океанские волны', ua: 'Океанські хвилі' },
  fire_crackling: { ru: 'Треск огня', ua: 'Тріск вогню' },
  clock_ticking: { ru: 'Тиканье часов', ua: 'Цокання годинника' },
  dripping_water: { ru: 'Капающая вода', ua: 'Крапання води' },
  creaking_wood: { ru: 'Скрип дерева', ua: 'Скрип дерева' },
  footsteps_slow: { ru: 'Медленные шаги', ua: 'Повільні кроки' },
  chains_rattling: { ru: 'Звон цепей', ua: 'Брязкіт ланцюгів' },
  fog_ambience: { ru: 'Туман', ua: 'Туман' },
  library_quiet: { ru: 'Тихая библиотека', ua: 'Тиха бібліотека' },
  train_moving: { ru: 'Едущий поезд', ua: 'Рух потяга' },
  church_bells: { ru: 'Церковные колокола', ua: 'Церковні дзвони' },
  arctic_wind: { ru: 'Арктический ветер', ua: 'Арктичний вітер' },
  jungle_ambient: { ru: 'Ночные джунгли', ua: 'Нічні джунглі' },
  desert_wind: { ru: 'Пустынный ветер', ua: 'Пустельний вітер' },
  underground: { ru: 'Глубоко под землёй', ua: 'Глибоко під землею' },

  // EVENTS
  door_open_creak: { ru: 'Скрип двери', ua: 'Скрип дверей' },
  door_slam: { ru: 'Хлопок двери', ua: 'Грюкіт дверей' },
  glass_break: { ru: 'Разбитое стекло', ua: 'Розбите скло' },
  explosion: { ru: 'Взрыв', ua: 'Вибух' },
  gunshot: { ru: 'Выстрел', ua: 'Постріл' },
  collapse: { ru: 'Обвал пещеры', ua: 'Обвал печери' },
  chase_music: { ru: 'Погоня', ua: 'Погоня' },
  combat_drums: { ru: 'Боевые барабаны', ua: 'Бойові барабани' },
  investigation: { ru: 'Расследование', ua: 'Розслідування' },
  discovery: { ru: 'Открытие', ua: 'Відкриття' },
  lock_pick: { ru: 'Взлом замка', ua: 'Зламування замка' },
  falling: { ru: 'Падение', ua: 'Падіння' },

  // CREATURES
  cultist_chant: { ru: 'Песнь культистов', ua: 'Спів культистів' },
  deep_one_gurgle: { ru: 'Глубоководный', ua: 'Глибоководний' },
  shoggoth_mass: { ru: 'Шоггот', ua: 'Шоґґот' },
  byakhee_screech: { ru: 'Визг бьякхи', ua: 'Вереск б’яккхі' },
  elder_thing: { ru: 'Присутствие Древних', ua: 'Присутність Прадавніх' },
  ghoul_snarl: { ru: 'Рык гуля', ua: 'Гарчання ґуля' },
  mi_go_buzz: { ru: 'Жужжание Ми-Го', ua: 'Дзижчання Мі-Ґо' },
  nightgaunt: { ru: 'Ночной мверзь', ua: 'Нічна потвора' },

  // HORROR
  whisper_voices: { ru: 'Шёпот', ua: 'Шепіт' },
  heavy_breathing: { ru: 'Тяжёлое дыхание', ua: 'Важке дихання' },
  heartbeat_slow: { ru: 'Медленное сердцебиение', ua: 'Повільне серцебиття' },
  heartbeat_fast: { ru: 'Бешеное сердцебиение', ua: 'Шалене серцебиття' },
  scratching: { ru: 'Царапанье', ua: 'Дряпання' },
  distant_scream: { ru: 'Далёкий крик', ua: 'Далекий крик' },
  eerie_music_box: { ru: 'Музыкальная шкатулка', ua: 'Музична скринька' },
  reverse_speech: { ru: 'Обратная речь', ua: 'Зворотна мова' },
  metal_scraping: { ru: 'Скрежет металла', ua: 'Скрегіт металу' },
  moaning: { ru: 'Стоны', ua: 'Стогін' },

  // MADNESS
  sanity_loss: { ru: 'Потеря рассудка', ua: 'Втрата глузду' },
  distortion: { ru: 'Искажение реальности', ua: 'Викривлення реальності' },
  tinnitus: { ru: 'Звон в ушах', ua: 'Дзвін у вухах' },
  laughter_mad: { ru: 'Безумный смех', ua: 'Божевільний сміх' },
  cosmic_drone: { ru: 'Космический гул', ua: 'Космічний гул' },
  multiple_voices: { ru: 'Множество голосов', ua: 'Безліч голосів' },

  // JUMP SCARES
  jump_slam: { ru: 'УДАР', ua: 'УДАР' },
  jump_scream: { ru: 'КРИК', ua: 'КРИК' },
  jump_shatter: { ru: 'ГРОХОТ', ua: 'ГУРКІТ' },
  jump_roar: { ru: 'РЁВ', ua: 'РЕВ' },
  jump_whisper: { ru: 'ШЁПОТ', ua: 'ШЕПІТ' },
  jump_bang: { ru: 'БАХ', ua: 'БАХ' },
};

// Сцени: id → { ru: {title, description}, ua: {title, description} }
export const SCENE_CONTENT = {
  scene_mansion: {
    ru: { title: 'Заброшенный особняк', description: 'Ветхий викторианский особняк. Пылинки парят в лунном свете сквозь разбитые окна.' },
    ua: { title: 'Покинутий особняк', description: 'Старий вікторіанський особняк. Порошинки кружляють у місячному світлі крізь розбиті вікна.' },
  },
  scene_asylum: {
    ru: { title: 'Заброшенная лечебница', description: 'Длинные коридоры с облупившейся краской. Мерцающий свет отбрасывает пляшущие тени.' },
    ua: { title: 'Покинута лікарня', description: 'Довгі коридори з облупленою фарбою. Мерехтливе світло кидає танцюючі тіні.' },
  },
  scene_catacombs: {
    ru: { title: 'Катакомбы', description: 'Узкие проходы, высеченные в древнем камне. Воздух холодный и затхлый.' },
    ua: { title: 'Катакомби', description: 'Вузькі проходи, висічені в прадавньому камені. Повітря холодне й затхле.' },
  },
  scene_ritual: {
    ru: { title: 'Ритуал', description: 'Фигуры в капюшонах кружат вокруг светящегося знака. Их пение становится громче.' },
    ua: { title: 'Ритуал', description: 'Постаті в каптурах кружляють навколо сяйливого знака. Їхній спів дедалі гучніший.' },
  },
  scene_ship: {
    ru: { title: 'Корабль в море', description: 'Грузовой пароход качается в водах, окутанных туманом.' },
    ua: { title: 'Корабель у морі', description: 'Вантажний пароплав гойдається у водах, оповитих туманом.' },
  },
  scene_arctic: {
    ru: { title: 'Арктическая экспедиция', description: 'Бескрайняя белая пустошь. Ветер не стихает. Что-то наблюдает изо льда.' },
    ua: { title: 'Арктична експедиція', description: 'Безкрая біла пустка. Вітер не вщухає. Щось спостерігає з-під криги.' },
  },
  scene_church: {
    ru: { title: 'Осквернённая церковь', description: 'Опрокинутые скамьи. Изувеченные святые. Алтарь покрыт тёмными пятнами.' },
    ua: { title: 'Осквернена церква', description: 'Перекинуті лави. Спотворені святі. Вівтар укритий темними плямами.' },
  },
  scene_library: {
    ru: { title: 'Запретная библиотека', description: 'Древние тома вдоль стен. Некоторые из них словно дышат.' },
    ua: { title: 'Заборонена бібліотека', description: 'Прадавні томи вздовж стін. Деякі з них наче дихають.' },
  },
  scene_cemetery: {
    ru: { title: 'Полночное кладбище', description: 'Туман липнет к выветренным надгробиям. Земля кажется... мягкой.' },
    ua: { title: 'Опівнічний цвинтар', description: 'Туман липне до вивітрених надгробків. Земля здається... м’якою.' },
  },
  scene_chase: {
    ru: { title: 'Погоня', description: 'Оно нашло тебя. Беги.' },
    ua: { title: 'Погоня', description: 'Воно знайшло тебе. Тікай.' },
  },
};

// ── Хелпери ──────────────────────────────────────────────────

// Локалізована назва звуку. EN (lang='en' або немає перекладу) → fallbackTitle.
export function localizedSoundTitle(soundId, lang, fallbackTitle) {
  if (lang && lang !== 'en') {
    const tr = SOUND_TITLES[soundId];
    if (tr && tr[lang]) return tr[lang];
  }
  return fallbackTitle;
}

// Локалізована назва звуку за його англійською назвою (layer.sound_name).
// Потрібна для міток шарів/таймлайну, де є лише англ. назва.
import { getSoundIdByName } from './soundData';
export function localizedSoundTitleByName(name, lang) {
  if (lang && lang !== 'en') {
    const id = getSoundIdByName(name);
    if (id && SOUND_TITLES[id]?.[lang]) return SOUND_TITLES[id][lang];
  }
  return name;
}

// Локалізована назва сцени.
export function localizedSceneTitle(sceneId, lang, fallbackTitle) {
  if (lang && lang !== 'en') {
    const tr = SCENE_CONTENT[sceneId];
    if (tr && tr[lang]?.title) return tr[lang].title;
  }
  return fallbackTitle;
}

// Локалізований опис сцени.
export function localizedSceneDescription(sceneId, lang, fallbackDescription) {
  if (lang && lang !== 'en') {
    const tr = SCENE_CONTENT[sceneId];
    if (tr && tr[lang]?.description) return tr[lang].description;
  }
  return fallbackDescription;
}