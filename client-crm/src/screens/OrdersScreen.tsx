import { useState, useEffect, useCallback } from 'react';
import { Bus, Package, Loader2, RefreshCw } from 'lucide-react';
import { getMyOrders, getMyBookings } from '../lib/api';
import type { ParcelOrder, BookingOrder } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../types';

interface Props {
  cliId: string;
}

const parcelStatusMap: Record<string, OrderStatus> = {
  'Нове': 'processing',
  'Прийнято': 'confirmed',
  'В дорозі': 'transit',
  'Доставлено': 'done',
  'Скасовано': 'cancelled',
};

const bookingStatusMap: Record<string, OrderStatus> = {
  'Очікує підтвердження': 'pending',
  'Підтверджено': 'confirmed',
  'В дорозі': 'transit',
  'Виконано': 'done',
  'Скасовано клієнтом': 'cancelled',
  'Скасовано': 'cancelled',
};

export default function OrdersScreen({ cliId }: Props) {
  const [tab, setTab] = useState<'trips' | 'parcels'>('trips');
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [orders, setOrders] = useState<ParcelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, o] = await Promise.all([
        getMyBookings(cliId),
        getMyOrders(cliId),
      ]);
      setBookings(b);
      setOrders(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [cliId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">Мої замовлення</h1>
          <button onClick={load} className="text-blue-200/60 hover:text-white transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-2 md:max-w-xs">
          <button
            onClick={() => setTab('trips')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'trips' ? 'bg-white text-navy' : 'bg-white/10 text-blue-200/60'
            }`}
          >
            Поїздки
          </button>
          <button
            onClick={() => setTab('parcels')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'parcels' ? 'bg-white text-navy' : 'bg-white/10 text-blue-200/60'
            }`}
          >
            Посилки
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-4 space-y-3 md:px-10 md:mt-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:space-y-0">
        {loading ? (
          <div className="flex items-center justify-center py-16 md:col-span-full">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-16 md:col-span-full">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={load} className="text-accent text-sm font-semibold">Спробувати знову</button>
          </div>
        ) : tab === 'trips' ? (
          bookings.length === 0 ? (
            <EmptyState icon={<Bus size={36} className="text-gray-300" />} text="Поїздок поки немає" />
          ) : (
            bookings.map(b => (
              <div key={b.booking_id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bus size={18} className="text-accent" />
                    <span className="font-bold text-navy text-sm">{b.city || b.direction}</span>
                  </div>
                  <span className="text-xs text-gray-400">{b.date_trip || b.date_created}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {b.pax_name} {b.seats ? `· ${b.seats} місць` : ''}
                </p>
                {b.addr_from && <p className="text-xs text-gray-400 mb-1">{b.addr_from} → {b.addr_to}</p>}
                <StatusBadge status={bookingStatusMap[b.status] || 'processing'} />
              </div>
            ))
          )
        ) : (
          orders.length === 0 ? (
            <EmptyState icon={<Package size={36} className="text-gray-300" />} text="Посилок поки немає" />
          ) : (
            orders.map(o => (
              <div key={o.order_id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-accent" />
                    <span className="font-bold text-navy text-sm">{o.direction}</span>
                  </div>
                  <span className="text-xs text-gray-400">{o.date_created}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{o.description}</p>
                {o.weight && <p className="text-xs text-gray-400 mb-1">{o.weight} кг</p>}
                <p className="text-xs text-gray-400 mb-2">{o.addr_sender} → {o.addr_recipient}</p>
                <StatusBadge status={parcelStatusMap[o.status] || 'processing'} />
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:col-span-full">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
