import { useEffect, useState } from 'react';
import {
  Package, Users, RefreshCw, ChevronRight, BarChart3,
} from 'lucide-react';
import { BotiLogo } from './BotiLogo';
import { useApp } from '../store/useAppStore';
import { CONFIG } from '../config';
import { fetchPassengerRoutes } from '../api';
import { PasswordModal } from './PasswordModal';

export function RouteScreen() {
  const { driverName, openRoute, showToast, passengerRoutes, setPassengerRoutes } = useApp();
  const [loading, setLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{
    route: string;
    password: string;
  } | null>(null);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const routes = await fetchPassengerRoutes();
      setPassengerRoutes(routes);
    } catch {
      showToast('Помилка завантаження маршрутів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoutes(); }, []);

  const handleDeliveryRoute = (name: string, password: string) => {
    setPasswordModal({ route: name, password });
  };

  const handlePasswordSuccess = () => {
    if (passwordModal) {
      openRoute(passwordModal.route, 'delivery');
      showToast(`Відкрито ${passwordModal.route}`);
    }
    setPasswordModal(null);
  };

  const totalPassengers = passengerRoutes.reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-y-auto">
      {/* Dark header */}
      <div className="bg-dark px-5 pt-6 pb-5">
        <BotiLogo size="md" onDark />
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">{driverName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-xs text-white/40">Водій</p>
            <p className="text-base font-bold text-white">{driverName}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Delivery routes */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Package className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Посилки</h2>
          </div>
          <div className="space-y-2">
            {CONFIG.DELIVERY_ROUTES.map((route) => (
              <button
                key={route.name}
                onClick={() => handleDeliveryRoute(route.name, route.password)}
                className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-brand/40 transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="font-bold text-text">{route.name.replace(' марш.', '')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary/40" />
              </button>
            ))}
          </div>
        </section>

        {/* Passenger routes */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">Пасажири</h2>
            </div>
            <button onClick={loadRoutes} className="p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
              <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Unified card */}
          {passengerRoutes.length > 0 && (
            <button
              onClick={() => { openRoute('Зведений', 'passenger', true); showToast('Завантаження зведеного...'); }}
              className="w-full mb-3 p-5 bg-dark rounded-2xl cursor-pointer text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-brand" />
                    <span className="font-bold text-white text-sm uppercase tracking-wider">Зведений</span>
                  </div>
                  <div className="text-xs text-white/40">Усі маршрути</div>
                </div>
                <div className="text-4xl font-black text-white">{totalPassengers}</div>
              </div>
            </button>
          )}

          <div className="space-y-2">
            {loading && passengerRoutes.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw className="w-6 h-6 text-text-secondary animate-spin mx-auto mb-2" />
                <p className="text-text-secondary text-sm">Завантаження...</p>
              </div>
            ) : (
              passengerRoutes.map((route) => (
                <button
                  key={route.name}
                  onClick={() => { openRoute(route.name, 'passenger'); showToast(`Відкрито ${route.name}`); }}
                  className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-brand/40 transition-all cursor-pointer text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-bold text-text">{route.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-brand">{route.count}</span>
                    <ChevronRight className="w-5 h-5 text-text-secondary/40" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="h-4" />
      </div>

      {passwordModal && (
        <PasswordModal routeName={passwordModal.route} correctPassword={passwordModal.password}
          onSuccess={handlePasswordSuccess} onClose={() => setPasswordModal(null)} />
      )}
    </div>
  );
}
