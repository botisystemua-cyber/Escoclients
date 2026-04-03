import { Bus, Package, User, MessageCircle, Tag, Flame } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
  userName: string | null;
}

const PROMOS = [
  '🔥 Знижка -20% на першу поїздку для нових клієнтів!',
  '📦 Безкоштовна доставка посилок від 15 кг до точки видачі',
  '🎁 Приведи друга — отримай 10 CHF бонусу на рахунок',
  '⚡ Гаряча пропозиція: Цюрих — Львів від 50 CHF',
  '🧳 Тариф "Максимум" — багаж 30 кг + адресна доставка',
];

export default function HomeScreen({ onNavigate, userName }: Props) {
  const displayName = userName ? userName.split(' ')[0] : 'Клієнт';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-navy px-5 pt-8 pb-6 rounded-b-3xl md:rounded-none md:px-10 md:pt-10 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm md:text-base font-bold tracking-wide mb-1"><span className="text-amber-400">Esco</span><span className="text-white">Express</span></p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Привіт, {displayName}! 👋</h1>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center border border-white/10"
          >
            <User size={24} className="text-white" />
          </button>
        </div>

        {/* Marquee — running promo line */}
        <div className="mt-4 overflow-hidden rounded-xl bg-white/10 backdrop-blur border border-white/10">
          <div className="flex items-center gap-2 px-3 py-2">
            <Flame size={14} className="text-amber-400 shrink-0 animate-pulse" />
            <div className="overflow-hidden flex-1">
              <div className="flex whitespace-nowrap animate-marquee">
                {[...PROMOS, ...PROMOS].map((text, i) => (
                  <span key={i} className="text-xs text-blue-100 font-medium mx-6">{text}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Action Cards */}
      <div className="px-4 mt-5 space-y-4 pb-4 md:px-10 md:mt-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          <button
            onClick={() => onNavigate('flights')}
            className="bg-white border-2 border-navy/80 rounded-2xl p-7 text-left active:scale-[0.97] transition-transform flex flex-col justify-between min-h-[260px] md:min-h-[220px] md:p-6 md:hover:shadow-lg md:hover:border-accent md:transition-all"
          >
            <div className="w-16 h-16 md:w-16 md:h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Bus size={34} className="text-accent md:hidden" />
              <Bus size={34} className="text-accent hidden md:block" />
            </div>
            <div className="mt-auto pt-5 md:pt-4">
              <p className="text-navy font-extrabold text-lg md:text-lg leading-tight">Забронювати поїздку</p>
              <p className="text-gray-400 text-sm md:text-sm mt-2 md:mt-1">Пасажирські рейси</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('parcels')}
            className="bg-white border-2 border-navy/80 rounded-2xl p-7 text-left active:scale-[0.97] transition-transform flex flex-col justify-between min-h-[260px] md:min-h-[220px] md:p-6 md:hover:shadow-lg md:hover:border-accent md:transition-all"
          >
            <div className="w-16 h-16 md:w-16 md:h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Package size={34} className="text-accent" />
            </div>
            <div className="mt-auto pt-5 md:pt-4">
              <p className="text-navy font-extrabold text-lg md:text-lg leading-tight">Відправити посилку</p>
              <p className="text-gray-400 text-sm md:text-sm mt-2 md:mt-1">Україна ⇄ Європа</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="bg-white border-2 border-navy/80 rounded-2xl px-4 py-4 active:scale-[0.97] transition-transform flex items-center gap-3 min-h-[90px] md:flex-col md:items-start md:p-6 md:min-h-[220px] md:justify-between md:hover:shadow-lg md:hover:border-accent md:transition-all"
          >
            <div className="w-11 h-11 md:w-16 md:h-16 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <MessageCircle size={22} className="text-accent md:hidden" />
              <MessageCircle size={34} className="text-accent hidden md:block" />
            </div>
            <div className="text-left min-w-0 md:mt-auto md:pt-4">
              <p className="text-navy font-bold text-xs sm:text-sm md:font-extrabold md:text-lg leading-tight">Чат з менеджером</p>
              <div className="flex items-center gap-1 mt-1 md:mt-1.5">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-status-confirmed rounded-full" />
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">Онлайн</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('tariffs')}
            className="bg-white border-2 border-navy/80 rounded-2xl px-4 py-4 active:scale-[0.97] transition-transform flex items-center gap-3 min-h-[90px] md:flex-col md:items-start md:p-6 md:min-h-[220px] md:justify-between md:hover:shadow-lg md:hover:border-accent md:transition-all"
          >
            <div className="w-11 h-11 md:w-16 md:h-16 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Tag size={22} className="text-accent md:hidden" />
              <Tag size={34} className="text-accent hidden md:block" />
            </div>
            <div className="text-left min-w-0 md:mt-auto md:pt-4">
              <p className="text-navy font-bold text-xs sm:text-sm md:font-extrabold md:text-lg leading-tight">Тарифи та ціни</p>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1 md:mt-1.5">від 5€/кг</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
