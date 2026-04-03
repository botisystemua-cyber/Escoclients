import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, CreditCard, Star, Loader2, Bus, Package, CalendarCheck } from 'lucide-react';
import { getProfile } from '../lib/api';
import type { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  phone: string | null;
  userName: string | null;
  cliId: string | null;
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  const clamped = Math.min(Math.max(rating, 0), max);
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.25;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        if (i < full) return <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />;
        if (i === full && half) return (
          <span key={i} className="relative inline-block w-[18px] h-[18px]">
            <Star size={18} className="text-gray-200 fill-gray-200 absolute" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
            </span>
          </span>
        );
        return <Star key={i} size={18} className="text-gray-200 fill-gray-200" />;
      })}
    </div>
  );
}

export default function ProfileScreen({ onNavigate, onLogout, phone, userName, cliId }: Props) {
  const [profile, setProfile] = useState<{
    rating_driver: number; rating_manager: number; internal_rating: number;
    trips_count: number; packages_count: number; bookings_count: number;
    debt_chf: number; debt_eur: number; debt_uah: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cliId) { setLoading(false); return; }
    getProfile(cliId)
      .then(p => setProfile(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cliId]);

  const avgRating = profile
    ? (() => {
        const ratings = [profile.rating_driver, profile.rating_manager, profile.internal_rating].filter(r => r > 0);
        return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      })()
    : 0;

  const hasDebt = profile && (profile.debt_chf > 0 || profile.debt_eur > 0 || profile.debt_uah > 0);

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-8 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-8">
        <button onClick={() => onNavigate('home')} className="text-blue-200/60 flex items-center gap-1 mb-4 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-accent/30">
            {userName ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{userName ?? 'Клієнт'}</h1>
            <p className="text-blue-200/60 text-sm">{phone ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-3 md:max-w-2xl md:mx-auto md:mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Rating */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Мій рейтинг</p>
              <div className="flex items-center gap-3">
                <Stars rating={avgRating} />
                <span className="text-lg font-bold text-navy">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                <span className="text-xs text-gray-400">/ 5</span>
              </div>
              {profile && avgRating > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  {profile.rating_driver > 0 && (
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] text-gray-500">Від водія: <span className="font-semibold text-navy">{profile.rating_driver.toFixed(1)}</span></span>
                    </div>
                  )}
                  {profile.rating_manager > 0 && (
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] text-gray-500">Від менеджера: <span className="font-semibold text-navy">{profile.rating_manager.toFixed(1)}</span></span>
                    </div>
                  )}
                </div>
              )}
              {avgRating === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">Рейтинг формується після завершення поїздок</p>
              )}
            </div>

            {/* Stats */}
            {profile && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-3">Статистика</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-1">
                      <Bus size={18} className="text-accent" />
                    </div>
                    <p className="text-lg font-bold text-navy">{profile.trips_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Поїздок</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-1">
                      <Package size={18} className="text-accent" />
                    </div>
                    <p className="text-lg font-bold text-navy">{profile.packages_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Посилок</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-1">
                      <CalendarCheck size={18} className="text-accent" />
                    </div>
                    <p className="text-lg font-bold text-navy">{profile.bookings_count || 0}</p>
                    <p className="text-[10px] text-gray-400">Бронювань</p>
                  </div>
                </div>
              </div>
            )}

            {/* Debts */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${hasDebt ? 'bg-red-50' : 'bg-green-50'} rounded-xl flex items-center justify-center`}>
                  <CreditCard size={20} className={hasDebt ? 'text-red-500' : 'text-status-confirmed'} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Мої борги</p>
                  {hasDebt ? (
                    <div className="flex gap-3 mt-0.5">
                      {profile!.debt_chf > 0 && <span className="text-sm font-bold text-red-500">{profile!.debt_chf} CHF</span>}
                      {profile!.debt_eur > 0 && <span className="text-sm font-bold text-red-500">{profile!.debt_eur} EUR</span>}
                      {profile!.debt_uah > 0 && <span className="text-sm font-bold text-red-500">{profile!.debt_uah} UAH</span>}
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-status-confirmed">Немає заборгованості</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut size={20} className="text-status-cancelled" />
              </div>
              <span className="text-sm font-semibold text-status-cancelled">Вийти з акаунту</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
