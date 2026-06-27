// ─────────────────────────────────────────────────────────────
// "Haunted Mansion" — публичная демо-сцена БЕЗ регистрации.
// Каждый звук маппится на встроенный синтез-граф audioEngine (см.
// _buildSoundGraph в lib/audioEngine.js), поэтому всё играет мгновенно,
// офлайн, без Google Диска и без аккаунта. Это и есть "30-секундная магия".
//
// kind: 'loop'   — тумблер play/stop, показывает активное состояние;
//       'oneshot'— одноразовый триггер (можно жать повторно);
//       'cut'    — особая кнопка Silence Cut (stop all).
// ─────────────────────────────────────────────────────────────

export const HAUNTED_MANSION = {
  id: 'demo_haunted_mansion',
  title: 'Haunted Mansion',
  subtitle: 'A decaying estate. The storm closes in. Something is already inside.',
  sounds: [
    { id: 'rain_heavy',      label: 'Rain Loop',      icon: 'CloudRain',     kind: 'loop',    volume: 0.55, accent: 'sky' },
    { id: 'thunder',         label: 'Thunder',        icon: 'CloudLightning',kind: 'loop',    volume: 0.6,  accent: 'sky' },
    { id: 'fire_crackling',  label: 'Fireplace',      icon: 'Flame',         kind: 'loop',    volume: 0.5,  accent: 'amber' },
    { id: 'wind_howling',    label: 'Wind',           icon: 'Wind',          kind: 'loop',    volume: 0.5,  accent: 'slate' },
    { id: 'door_open_creak', label: 'Old Door',       icon: 'DoorOpen',      kind: 'oneshot', volume: 0.9,  accent: 'amber' },
    { id: 'footsteps_slow',  label: 'Footsteps',      icon: 'Footprints',    kind: 'loop',    volume: 0.55, accent: 'slate' },
    { id: 'whisper_voices',  label: 'Whisper',        icon: 'Ear',           kind: 'loop',    volume: 0.6,  accent: 'violet' },
    { id: 'distant_scream',  label: 'Distant Scream', icon: 'Megaphone',     kind: 'oneshot', volume: 0.85, accent: 'rose' },
    { id: 'cosmic_drone',    label: 'Piano Drone',    icon: 'Music',         kind: 'loop',    volume: 0.5,  accent: 'violet' },
    { id: 'heartbeat_slow',  label: 'Heartbeat',      icon: 'HeartPulse',    kind: 'loop',    volume: 0.7,  accent: 'rose' },
    { id: 'ghoul_snarl',     label: 'Monster Growl',  icon: 'Skull',         kind: 'loop',    volume: 0.6,  accent: 'rose' },
    { id: '__cut__',         label: 'Silence Cut',    icon: 'Square',        kind: 'cut',     volume: 1,    accent: 'cut' },
  ],
};

// Цветовые акценты кнопок — статические классы (Tailwind purge-safe).
export const ACCENTS = {
  sky:    { idle: 'border-sky-500/25 text-sky-300/80',       active: 'bg-sky-500/20 border-sky-400/70 text-sky-200 shadow-[0_0_25px_-5px] shadow-sky-500/50' },
  amber:  { idle: 'border-amber-500/25 text-amber-300/80',   active: 'bg-amber-500/20 border-amber-400/70 text-amber-200 shadow-[0_0_25px_-5px] shadow-amber-500/50' },
  slate:  { idle: 'border-slate-400/25 text-slate-300/80',   active: 'bg-slate-400/20 border-slate-300/70 text-slate-100 shadow-[0_0_25px_-5px] shadow-slate-400/50' },
  violet: { idle: 'border-violet-500/25 text-violet-300/80', active: 'bg-violet-500/20 border-violet-400/70 text-violet-200 shadow-[0_0_25px_-5px] shadow-violet-500/50' },
  rose:   { idle: 'border-rose-500/25 text-rose-300/80',     active: 'bg-rose-500/20 border-rose-400/70 text-rose-200 shadow-[0_0_25px_-5px] shadow-rose-500/50' },
  cut:    { idle: 'border-rose-600/40 text-rose-300', active: 'bg-rose-600/30 border-rose-500/70 text-rose-100' },
};