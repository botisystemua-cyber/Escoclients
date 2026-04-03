import { useState, useEffect, useCallback } from 'react';
import { Bus, Package, Loader2, RefreshCw, X, Archive, Eye, EyeOff } from 'lucide-react';
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

type Tab = 'all' | 'trips' | 'parcels';

function loadArchivedIds(): string[] {
  try { return JSON.parse(localStorage.getItem('boti_archived') || '[]'); } catch { return []; }
}
function saveArchivedIds(ids: string[]) {
  localStorage.setItem('boti_archived', JSON.stringify(ids));
}

export default function OrdersScreen({ cliId }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [orders, setOrders] = useState<ParcelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ type: 'booking' | 'order'; id: string } | null>(null);
  const [archivedIds, setArchivedIds] = useState<string[]>(loadArchivedIds);
  const [showArchive, setShowArchive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, o] = await Promise.all([getMyBookings(cliId), getMyOrders(cliId)]);
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
      if (confirmCancel.type === 'booking') await cancelBooking(cliId, confirmCancel.id);
      else await cancelOrder(cliId, confirmCancel.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка скасування');
    } finally {
      setCancelling(null);
      setConfirmCancel(null);
    }
  };

  const archiveItem = (id: string) => {
    const next = [...archivedIds, id];
    setArchivedIds(next);
    saveArchivedIds(next);
  };

  const unarchiveItem = (id: string) => {
    const next = archivedIds.filter(x => x !== id);
    setArchivedIds(next);
    saveArchivedIds(next);
  };

  // Filter by tab
  const visibleBookings = tab === 'parcels' ? [] : bookings;
  const visibleOrders = tab === 'trips' ? [] : orders;

  // Split active / archived
  const activeBookings = visibleBookings.filter(b => !archivedIds.includes(b.booking_id));
  const archivedBookings = visibleBookings.filter(b => archivedIds.includes(b.booking_id));
  const activeOrders = visibleOrders.filter(o => !archivedIds.includes(o.order_id));
  const archivedOrders = visibleOrders.filter(o => archivedIds.includes(o.order_id));

  const archiveCount = archivedBookings.length + archivedOrders.length;

  const tabCls = (t: Tab) =>
    `flex-1 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? 'bg-white text-navy' : 'bg-white/10 text-blue-200/60'}`;

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">Мої замовлення</h1>
          <button onClick={load} className="text-blue-200/60 hover:text-white transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-2 md:max-w-sm">
          <button onClick={() => setTab('all')} className={tabCls('all')}>Всі</button>
          <button onClick={() => setTab('trips')} className={tabCls('trips')}>Пасажири</button>
          <button onClick={() => setTab('parcels')} className={tabCls('parcels')}>Посилки</button>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-4 md:px-10 md:mt-4">
        {/* Archive toggle */}
        {archiveCount > 0 && (
          <button onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition mb-3 ml-1">
            {showArchive ? <EyeOff size={13} /> : <Eye size={13} />}
            {showArchive ? 'Сховати архів' : `Показати архів (${archiveCount})`}
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={load} className="text-accent text-sm font-semibold">Спробувати знову</button>
          </div>
        ) : activeBookings.length === 0 && activeOrders.length === 0 && !showArchive ? (
          <EmptyState
            icon={tab === 'parcels' ? <Package size={36} className="text-gray-300" /> : <Bus size={36} className="text-gray-300" />}
            text={tab === 'parcels' ? 'Посилок поки немає' : tab === 'trips' ? 'Поїздок поки немає' : 'Замовлень поки немає'}
          />
        ) : (
          <>
            {/* Active items */}
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
              {activeBookings.map(b => (
                <BookingCard key={b.booking_id} booking={b}
                  onCancel={canCancel(b.status) ? () => setConfirmCancel({ type: 'booking', id: b.booking_id }) : undefined}
                  onArchive={() => archiveItem(b.booking_id)}
                  cancelling={cancelling === b.booking_id} />
              ))}
              {activeOrders.map(o => (
                <OrderCard key={o.order_id} order={o}
                  onCancel={canCancel(o.status) ? () => setConfirmCancel({ type: 'order', id: o.order_id }) : undefined}
                  onArchive={() => archiveItem(o.order_id)}
                  cancelling={cancelling === o.order_id} />
              ))}
            </div>

            {/* Archived items */}
            {showArchive && archiveCount > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2 flex items-center gap-1.5">
                  <Archive size={12} /> Архів
                </p>
                <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                  {archivedBookings.map(b => (
                    <BookingCard key={b.booking_id} booking={b} archived
                      onUnarchive={() => unarchiveItem(b.booking_id)} />
                  ))}
                  {archivedOrders.map(o => (
                    <OrderCard key={o.order_id} order={o} archived
                      onUnarchive={() => unarchiveItem(o.order_id)} />
                  ))}
                </div>
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
              <button onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">Ні</button>
              <button onClick={handleCancel} disabled={!!cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-60 flex items-center justify-center gap-1.5">
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

function BookingCard({ booking: b, onCancel, onArchive, onUnarchive, cancelling, archived }: {
  booking: BookingOrder; onCancel?: () => void; onArchive?: () => void; onUnarchive?: () => void; cancelling?: boolean; archived?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${archived ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bus size={18} className="text-accent" />
          <span className="font-bold text-navy text-sm">{b.city || b.direction}</span>
        </div>
        <span className="text-xs text-gray-400">{b.date_trip || b.date_created}</span>
      </div>
      <p className="text-xs text-gray-500 mb-1">{b.pax_name} {b.seats ? `· ${b.seats} місць` : ''}</p>
      {b.addr_from && <p className="text-xs text-gray-400 mb-1">{b.addr_from} → {b.addr_to}</p>}
      {b.seat && b.seat !== 'Вільна розсадка' && (
        <p className="text-xs text-gray-400 mb-1">Місце: {b.seat}</p>
      )}
      <StatusBadge status={bookingStatusMap[b.status] || 'processing'} />
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
        {!archived && onCancel && (
          <button onClick={onCancel} disabled={cancelling}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
            <X size={12} /> Скасувати
          </button>
        )}
        {!archived && onArchive && (
          <button onClick={onArchive}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 ml-auto">
            <Archive size={12} /> В архів
          </button>
        )}
        {archived && onUnarchive && (
          <button onClick={onUnarchive}
            className="px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition flex items-center gap-1">
            <Eye size={12} /> Повернути
          </button>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order: o, onCancel, onArchive, onUnarchive, cancelling, archived }: {
  order: ParcelOrder; onCancel?: () => void; onArchive?: () => void; onUnarchive?: () => void; cancelling?: boolean; archived?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${archived ? 'opacity-50' : ''}`}>
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
      <StatusBadge status={parcelStatusMap[o.status] || 'processing'} />
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
        {!archived && onCancel && (
          <button onClick={onCancel} disabled={cancelling}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
            <X size={12} /> Скасувати
          </button>
        )}
        {!archived && onArchive && (
          <button onClick={onArchive}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 ml-auto">
            <Archive size={12} /> В архів
          </button>
        )}
        {archived && onUnarchive && (
          <button onClick={onUnarchive}
            className="px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition flex items-center gap-1">
            <Eye size={12} /> Повернути
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
