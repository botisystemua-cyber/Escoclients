import { useState, useEffect, useCallback } from 'react';
import { Bus, Package, Loader2, RefreshCw, X, Archive } from 'lucide-react';
import { getMyOrders, getMyBookings, cancelBooking, cancelOrder } from '../lib/api';
import type { ParcelOrder, BookingOrder } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import type { OrderStatus } from '../types';

interface Props {
  cliId: string;
}

const parcelStatusMap: Record<string, OrderStatus> = {
  'Нове': 'processing',
  'Нова заявка': 'processing',
  'Прийнято': 'confirmed',
  'В обробці': 'processing',
  'В дорозі': 'transit',
  'Доставлено': 'done',
  'Скасовано': 'cancelled',
  'Скасовано клієнтом': 'cancelled',
};

const bookingStatusMap: Record<string, OrderStatus> = {
  'Очікує підтвердження': 'pending',
  'Підтверджено': 'confirmed',
  'В дорозі': 'transit',
  'Виконано': 'done',
  'Скасовано клієнтом': 'cancelled',
  'Скасовано': 'cancelled',
};

const canCancel = (status: string) =>
  !['Скасовано', 'Скасовано клієнтом', 'Виконано', 'Доставлено', 'В дорозі'].includes(status);

export default function OrdersScreen({ cliId }: Props) {
  const [tab, setTab] = useState<'trips' | 'parcels'>('trips');
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [orders, setOrders] = useState<ParcelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ type: 'booking' | 'order'; id: string } | null>(null);

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

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setCancelling(confirmCancel.id);
    try {
      if (confirmCancel.type === 'booking') {
        await cancelBooking(cliId, confirmCancel.id);
      } else {
        await cancelOrder(cliId, confirmCancel.id);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка скасування');
    } finally {
      setCancelling(null);
      setConfirmCancel(null);
    }
  };

  const activeBookings = bookings.filter(b => !['Скасовано', 'Скасовано клієнтом', 'Виконано'].includes(b.status));
  const archivedBookings = bookings.filter(b => ['Скасовано', 'Скасовано клієнтом', 'Виконано'].includes(b.status));
  const activeOrders = orders.filter(o => !['Скасовано', 'Скасовано клієнтом', 'Доставлено'].includes(o.status));
  const archivedOrders = orders.filter(o => ['Скасовано', 'Скасовано клієнтом', 'Доставлено'].includes(o.status));

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
          >Поїздки</button>
          <button
            onClick={() => setTab('parcels')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'parcels' ? 'bg-white text-navy' : 'bg-white/10 text-blue-200/60'
            }`}
          >Посилки</button>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-4 md:px-10 md:mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={load} className="text-accent text-sm font-semibold">Спробувати знову</button>
          </div>
        ) : tab === 'trips' ? (
          <>
            {activeBookings.length === 0 && archivedBookings.length === 0 ? (
              <EmptyState icon={<Bus size={36} className="text-gray-300" />} text="Поїздок поки немає" />
            ) : (
              <>
                {activeBookings.length > 0 && (
                  <div className="space-y-3 mb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                    {activeBookings.map(b => (
                      <BookingCard key={b.booking_id} booking={b}
                        onCancel={() => setConfirmCancel({ type: 'booking', id: b.booking_id })}
                        cancelling={cancelling === b.booking_id} />
                    ))}
                  </div>
                )}
                {archivedBookings.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
                      <Archive size={12} /> Архів
                    </p>
                    <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                      {archivedBookings.map(b => (
                        <BookingCard key={b.booking_id} booking={b} archived />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {activeOrders.length === 0 && archivedOrders.length === 0 ? (
              <EmptyState icon={<Package size={36} className="text-gray-300" />} text="Посилок поки немає" />
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <div className="space-y-3 mb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                    {activeOrders.map(o => (
                      <OrderCard key={o.order_id} order={o}
                        onCancel={() => setConfirmCancel({ type: 'order', id: o.order_id })}
                        cancelling={cancelling === o.order_id} />
                    ))}
                  </div>
                )}
                {archivedOrders.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
                      <Archive size={12} /> Архів
                    </p>
                    <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                      {archivedOrders.map(o => (
                        <OrderCard key={o.order_id} order={o} archived />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-navy mb-2">Скасувати заявку?</h3>
            <p className="text-sm text-gray-500 mb-4">Менеджер отримає сповіщення про скасування. Цю дію не можна відмінити.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600"
              >Ні</button>
              <button
                onClick={handleCancel}
                disabled={!!cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b, onCancel, cancelling, archived }: {
  booking: BookingOrder; onCancel?: () => void; cancelling?: boolean; archived?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${archived ? 'opacity-60' : ''}`}>
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
      {b.seat && b.seat !== 'Вільна розсадка' && (
        <p className="text-xs text-gray-400 mb-1">Місце: {b.seat}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <StatusBadge status={bookingStatusMap[b.status] || 'processing'} />
        {!archived && canCancel(b.status) && onCancel && (
          <button onClick={onCancel} disabled={cancelling}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
            <X size={12} /> Скасувати
          </button>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order: o, onCancel, cancelling, archived }: {
  order: ParcelOrder; onCancel?: () => void; cancelling?: boolean; archived?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${archived ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-accent" />
          <span className="font-bold text-navy text-sm">{o.direction}</span>
        </div>
        <span className="text-xs text-gray-400">{o.date_created}</span>
      </div>
      {o.description && <p className="text-xs text-gray-500 mb-1">{o.description}</p>}
      {o.weight && <p className="text-xs text-gray-400 mb-1">{o.weight} кг</p>}
      {(o.addr_sender || o.addr_recipient) && (
        <p className="text-xs text-gray-400 mb-1">{o.addr_sender} → {o.addr_recipient}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <StatusBadge status={parcelStatusMap[o.status] || 'processing'} />
        {!archived && canCancel(o.status) && onCancel && (
          <button onClick={onCancel} disabled={cancelling}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
            <X size={12} /> Скасувати
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
