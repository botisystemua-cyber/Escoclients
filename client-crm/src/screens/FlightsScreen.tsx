import { useState, useEffect } from 'react';
import { Bus, Calendar, Users, Loader2, RefreshCw } from 'lucide-react';
import type { Screen, Flight } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
  onSelectFlight: (flight: Flight) => void;
  flights: Flight[];
  flightsLoading: boolean;
  flightsError: string;
  onRefresh: (silent?: boolean) => Promise<void>;
}

type DirFilter = 'all' | 'ua-eu' | 'eu-ua';

function sortByDate(a: Flight, b: Flight): number {
  const da = new Date(a.raw_date).getTime() || 0;
  const db = new Date(b.raw_date).getTime() || 0;
  return da - db;
}

export default function FlightsScreen({ onNavigate, onSelectFlight, flights, flightsLoading, flightsError, onRefresh }: Props) {
  const [dir, setDir] = useState<DirFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (flights.length > 0) onRefresh(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh(false);
    setRefreshing(false);
  };

  const handleBook = (flight: Flight) => {
    onSelectFlight(flight);
    onNavigate('booking');
  };

  // Filter by direction
  const filtered = flights.filter(f => {
    if (dir === 'all') return true;
    if (dir === 'ua-eu') return f.direction === 'UA → EU';
    return f.direction === 'EU → UA';
  });

  // Group by auto_name (city), sort each group by date
  const groups = new Map<string, Flight[]>();
  for (const f of filtered) {
    const key = f.auto_name || 'Інше';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  for (const arr of groups.values()) {
    arr.sort(sortByDate);
  }

  // Sort group keys alphabetically (Женева, Цюріх)
  const sortedKeys = [...groups.keys()].sort();

  const isLoading = flightsLoading && flights.length === 0;

  const dirTabs: { id: DirFilter; label: string }[] = [
    { id: 'all', label: 'Всі' },
    { id: 'ua-eu', label: 'Україна → Європа' },
    { id: 'eu-ua', label: 'Європа → Україна' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">Поїздки</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-blue-200/60 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Direction filter tabs */}
        <div className="flex gap-2">
          {dirTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setDir(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                dir === t.id
                  ? 'bg-accent text-white'
                  : 'bg-white/10 text-blue-200/70 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 pb-6 md:px-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : flightsError && flights.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <p className="text-red-400 text-sm mb-2">{flightsError}</p>
            <button onClick={handleRefresh} className="text-accent text-sm font-semibold">Спробувати ще</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Немає доступних рейсів</p>
          </div>
        ) : (
          sortedKeys.map(cityName => {
            const cityFlights = groups.get(cityName)!;
            return (
              <div key={cityName} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Bus size={18} className="text-accent" />
                  <h2 className="text-lg font-bold text-navy">{cityName}</h2>
                  <span className="text-xs text-gray-400 ml-1">({cityFlights.length} рейсів)</span>
                </div>
                <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                  {cityFlights.map(flight => (
                    <button
                      key={flight.cal_id}
                      onClick={() => handleBook(flight)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.97] transition-transform md:hover:shadow-md flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{flight.from_city} → {flight.to_city}</p>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar size={13} className="text-accent" />
                          <span className="text-sm font-bold text-navy">{flight.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-status-confirmed" />
                          <span className="text-xs font-semibold text-status-confirmed">{flight.free_seats} вільних</span>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shrink-0">
                        Обрати
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
