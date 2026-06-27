import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Swords, SlidersHorizontal, Layers, AlertTriangle, Clock, LogIn, Ghost,
} from 'lucide-react';
import FeatureBlock from '@/components/landing/FeatureBlock';

// Публичный лендинг: за 30 секунд объясняет, что это саундборд для
// ведущих TTRPG (Call of Cthulhu, D&D), и ведёт в живое демо без аккаунта.
export default function Landing() {
  return (
    <div className="min-h-screen bg-obsidian parchment-texture text-parchment overflow-x-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Ghost size={20} className="text-brass-glow" />
          <span className="font-heading tracking-[0.2em] text-sm text-parchment uppercase">Keeper</span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-[12px] font-heading tracking-wider text-brass-dim hover:text-brass transition-colors uppercase"
        >
          <LogIn size={14} /> Войти
        </Link>
      </header>

      {/* Hero */}
      <section className="px-5 pt-10 pb-8 max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brass/30 bg-brass/5 px-3 py-1 text-[10px] font-mono tracking-[0.25em] text-brass-dim uppercase mb-6">
          <Swords size={12} className="text-brass" /> Для Game Masters &amp; Keepers
        </span>

        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-parchment">
          Управляй атмосферой стола
          <span className="block text-brass-glow">в реальном времени</span>
        </h1>

        <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-parchment-dim font-body max-w-xl mx-auto">
          Soundboard и звуковой пульт для ведущих Call of Cthulhu, D&D и хоррор-настолок.
          Дождь, гром, шёпот, jump scare и тревожный дрон — слоями, одним касанием,
          прямо во время игры.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/demo"
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-brass/20 border border-brass/50 px-6 py-3.5 text-sm font-heading tracking-wide text-brass-glow hover:bg-brass/30 transition-colors"
          >
            <Play size={16} className="fill-brass-glow" />
            Открыть демо-сцену
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-white/15 px-6 py-3.5 text-sm font-heading tracking-wide text-parchment-dim hover:text-parchment hover:border-white/30 transition-colors"
          >
            Создать свою сцену
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-brass-dim/70 font-mono tracking-wide">
          Демо работает без регистрации · ничего не нужно скачивать
        </p>
      </section>

      {/* Feature blocks */}
      <section className="px-5 pb-10 max-w-3xl mx-auto grid sm:grid-cols-2 gap-3">
        <FeatureBlock icon={Swords} title="Сделано для ведущих">
          Не очередной музыкальный плеер, а пульт мастера: всё под рукой, крупные кнопки,
          ничего не отвлекает от игры за столом.
        </FeatureBlock>
        <FeatureBlock icon={SlidersHorizontal} title="Контроль в реальном времени">
          Запускай и глуши звуки на лету, складывай слои, держи общую громкость и
          мгновенный «Stop All» всегда под пальцем.
        </FeatureBlock>
        <FeatureBlock icon={Layers} title="Сцены и эмбиенс">
          Собирай готовые наборы под локацию и настроение — особняк, склеп, ритуал —
          и переключайся между ними за секунду.
        </FeatureBlock>
        <FeatureBlock icon={AlertTriangle} title="Jump scare по кнопке">
          Резкий крик, удар двери, рык твари — одноразовые триггеры для нужного
          момента, когда игроки совсем расслабились.
        </FeatureBlock>
      </section>

      {/* Timed events teaser */}
      <section className="px-5 pb-14 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-brass/15 bg-gradient-to-br from-graphite/60 to-burgundy/10 p-6 flex items-start gap-4">
          <Clock size={22} className="text-brass-glow shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading tracking-wide text-parchment text-sm mb-1">
              Эмбиенс, события и таймлайн
            </h3>
            <p className="text-[13px] leading-relaxed text-parchment-dim font-body">
              Фоновая атмосфера держит сцену, а ты добавляешь события точечно. Открой демо
              «Haunted Mansion» и услышишь, как дождь, гром и шёпот складываются в живую сцену.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-[max(env(safe-area-inset-bottom),2.5rem)] max-w-3xl mx-auto text-center">
        <Link
          to="/demo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brass/20 border border-brass/50 px-8 py-4 text-base font-heading tracking-wide text-brass-glow hover:bg-brass/30 transition-colors"
        >
          <Play size={18} className="fill-brass-glow" />
          Попробовать прямо сейчас
        </Link>
      </section>
    </div>
  );
}