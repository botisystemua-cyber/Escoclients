import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, RefreshCw, Package, Users, BarChart3,
  Plus, Settings, ListFilter,
} from 'lucide-react';
import { useApp } from '../store/useAppStore';
import { fetchDeliveries, fetchPassengers, fetchPassengerRoutes, transferPassenger } from '../api';
import { DeliveryCard } from './DeliveryCard';
import { PassengerCard } from './PassengerCard';
import { TransferModal } from './TransferModal';
import { AddLeadModal } from './AddLeadModal';
import { ColumnEditor } from './ColumnEditor';
import type { Delivery, Passenger, ItemStatus, StatusFilter } from '../types';

export function ListScreen() {
  const {
    currentSheet, currentRouteType, isUnifiedView, goBack, showToast,
    statusFilter, setStatusFilter, getStatus, setStatus,
    routeFilter, setRouteFilter, passengerRoutes, setPassengerRoutes,
  } = useApp();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [allRoutePassengers, setAllRoutePassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferTarget, setTransferTarget] = useState<Passenger | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);

  const isDelivery = currentRouteType === 'delivery';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isUnifiedView) {
        let routes = passengerRoutes;
        if (routes.length === 0) {
          routes = await fetchPassengerRoutes();
          setPassengerRoutes(routes);
        }
        const results = await Promise.all(
          routes.map(async (route) => {
            const pax = await fetchPassengers(route.name);
            return pax.map((p) => ({ ...p, _sourceRoute: route.name }));
          })
        );
        const all = results.flat();
        all.forEach((p, idx) => {
          p._statusKey = `pas_${p.rowNum}_${p._sourceRoute}_${idx}`;
          if (p.driverStatus && p.driverStatus !== 'pending') setStatus(p._statusKey, p.driverStatus as ItemStatus);
        });
        setAllRoutePassengers(all);
        setPassengerRoutes(routes.map((r) => ({ ...r, count: all.filter((p) => p._sourceRoute === r.name).length })));
        showToast(`${all.length} пасажирів`);
      } else if (isDelivery) {
        const items = await fetchDeliveries(currentSheet);
        items.forEach((d, idx) => {
          d._statusKey = `del_${d.internalNumber}_${idx}`;
          const apiStatus = d.status || d.driverStatus;
          if (apiStatus && apiStatus !== 'pending') setStatus(d._statusKey, apiStatus as ItemStatus);
        });
        setDeliveries(items);
        showToast(`${items.length} записів`);
      } else {
        const items = await fetchPassengers(currentSheet);
        items.forEach((p, idx) => {
          p._statusKey = `pas_${p.rowNum}_${idx}`;
          if (p.driverStatus && p.driverStatus !== 'pending') setStatus(p._statusKey, p.driverStatus as ItemStatus);
        });
        setPassengers(items);
        showToast(`${items.length} записів`);
      }
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
    finally { setLoading(false); }
  }, [currentSheet, currentRouteType, isUnifiedView]);

  useEffect(() => { loadData(); }, [loadData]);

  const getItems = (): (Delivery | Passenger)[] => {
    let items: (Delivery | Passenger)[];
    if (isUnifiedView) {
      items = routeFilter === 'all' ? allRoutePassengers : allRoutePassengers.filter((p) => p._sourceRoute === routeFilter);
    } else if (isDelivery) { items = deliveries; }
    else { items = passengers; }
    if (statusFilter !== 'all') items = items.filter((item) => getStatus(item._statusKey) === statusFilter);
    return items;
  };

  const items = getItems();

  const allItems = isUnifiedView
    ? (routeFilter === 'all' ? allRoutePassengers : allRoutePassengers.filter((p) => (p as Passenger)._sourceRoute === routeFilter))
    : isDelivery ? deliveries : passengers;
  const stats = {
    total: allItems.length,
    inProgress: allItems.filter((i) => getStatus(i._statusKey) === 'in-progress').length,
    completed: allItems.filter((i) => getStatus(i._statusKey) === 'completed').length,
    cancelled: allItems.filter((i) => getStatus(i._statusKey) === 'cancelled').length,
  };

  const routeTabs = isUnifiedView
    ? [{ name: 'all', label: 'Усі', count: allRoutePassengers.length }, ...passengerRoutes.map((r) => ({ name: r.name, label: r.name, count: r.count }))]
    : [];

  const handleTransfer = async (targetRoute: string) => {
    if (!transferTarget) return;
    showToast('Переносимо...');
    try {
      await transferPassenger(transferTarget, transferTarget._sourceRoute || currentSheet, targetRoute);
      showToast(`Перенесено до ${targetRoute}`);
      setTransferTarget(null);
      loadData();
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
  };

  const HeaderIcon = isUnifiedView ? BarChart3 : isDelivery ? Package : Users;
  const headerTitle = isUnifiedView ? 'Зведений' : isDelivery ? 'Посилки' : 'Пасажири';

  const filters: { key: StatusFilter; label: string; count: number; activeColor: string }[] = [
    { key: 'all', label: 'Усі', count: stats.total, activeColor: 'bg-dark text-white' },
    { key: 'in-progress', label: 'В роботі', count: stats.inProgress, activeColor: 'bg-blue-500 text-white' },
    { key: 'completed', label: 'Готово', count: stats.completed, activeColor: 'bg-green-500 text-white' },
    { key: 'cancelled', label: 'Скас.', count: stats.cancelled, activeColor: 'bg-red-500 text-white' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg max-h-dvh overflow-hidden">
      {/* Dark header */}
      <div className="bg-dark px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <HeaderIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{headerTitle}</div>
              <div className="text-[10px] text-white/40">
                {isUnifiedView && routeFilter !== 'all' ? routeFilter : currentSheet}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadData()}
              className="p-2 rounded-xl bg-white/10 text-white/70 active:scale-95 transition-all cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={goBack}
              className="p-2 rounded-xl bg-white/10 text-white/70 active:scale-95 transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {filters.map((f) => {
            const isActive = statusFilter === f.key;
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer active:scale-95 ${
                  isActive ? f.activeColor : 'bg-white/8 text-white/50'
                }`}>
                <div className="text-sm font-black">{f.count}</div>
                <div className="text-[9px] font-semibold">{f.label}</div>
              </button>
            );
          })}
        </div>

        {/* Route tabs (unified) */}
        {isUnifiedView && routeTabs.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
            {routeTabs.map((tab) => (
              <button key={tab.name} onClick={() => setRouteFilter(tab.name)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  routeFilter === tab.name ? 'bg-brand text-white' : 'bg-white/8 text-white/40'
                }`}>
                {tab.label} <span className="font-black">{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 pb-20 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Завантаження...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ListFilter className="w-12 h-12 text-border mb-3" strokeWidth={1} />
            <p className="text-text-secondary text-sm">Нічого не знайдено</p>
          </div>
        ) : isDelivery ? (
          (items as Delivery[]).map((delivery) => (
            <DeliveryCard key={delivery._statusKey} delivery={delivery} globalIndex={deliveries.indexOf(delivery)} />
          ))
        ) : (
          (items as Passenger[]).map((passenger, idx) => (
            <PassengerCard key={passenger._statusKey} passenger={passenger} index={idx}
              onTransfer={isUnifiedView ? () => setTransferTarget(passenger) : undefined} />
          ))
        )}
      </div>

      {/* Bottom nav — dark */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark flex justify-around items-center py-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-40">
        <NavBtn icon={isDelivery ? Package : Users} label={isDelivery ? 'Посилки' : 'Пасажири'} active
          onClick={() => { document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        <NavBtn icon={RefreshCw} label="Оновити" onClick={() => loadData()} />
        {/* Green accent button */}
        <button onClick={() => setShowAddLead(true)}
          className="w-12 h-12 -mt-5 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30 cursor-pointer active:scale-90 transition-transform">
          <Plus className="w-6 h-6 text-white" />
        </button>
        {isDelivery && <NavBtn icon={Settings} label="Колонки" onClick={() => setShowColumnEditor(true)} />}
        {!isDelivery && <NavBtn icon={ListFilter} label="Фільтр" onClick={() => {}} />}
      </div>

      {transferTarget && (
        <TransferModal passenger={transferTarget} routes={passengerRoutes}
          onTransfer={handleTransfer} onClose={() => setTransferTarget(null)} />
      )}
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onAdded={loadData} />}
      {showColumnEditor && <ColumnEditor onClose={() => setShowColumnEditor(false)} />}
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: {
  icon: typeof Package; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer transition-colors ${
        active ? 'text-brand' : 'text-white/40'
      }`}>
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}
