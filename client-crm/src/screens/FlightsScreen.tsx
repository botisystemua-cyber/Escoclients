import { useState } from 'react';
import { Calendar, Users, Loader2, RefreshCw, Bus, ArrowRight } from 'lucide-react';
import type { Screen, Flight } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
  onSelectFlight: (flight: Flight) => void;
  flights: Flight[];
  flightsLoading: boolean;
  flightsError: string;
  onRefresh: (silent?: boolean) => Promise<void>;
}

export default function FlightsScreen({ onNavigate, onSelectFlight, flights, flightsLoading, flightsError, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh(false);
    setRefreshing(false);
  };

  const handleBook = (flight: Flight) => {
    onSelectFlight(flight);
    onNavigate('booking');
  };

  // Sort flights by date
  const sorted = [...flights].sort((a, b) => {
    const parseDate = (d: string) => {
      const months: Record<string, number> = {
        'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3, 'травня': 4, 'червня': 5,
        'липня': 6, 'серпня': 7, 'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11,
      };
      const parts = d.match(/(\d+)\s+(\S+)/);
      if (!parts) return 0;
      const month = months[parts[2]] ?? 0;
      return month * 31 + parseInt(parts[1]);
    };
    return parseDate(a.date) - parseDate(b.date);
  });

  // Group by direction
  const uaEu = sorted.filter(f => f.direction === 'UA → EU');
  const euUa = sorted.filter(f => f.direction === 'EU → UA');

  const isLoading = flightsLoading && flights.length === 0;

  const seatColor = (seats: number) => {
    if (seats <= 2) return 'text-red-500 bg-red-50';
    if (seats <= 4) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const renderFlightCard = (flight: Flight) => (
    <button
      key={flight.cal_id}
      onClick={() => handleBook(flight)}
      className="w-full bg-white rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all text-left md:hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Date circle */}
          <div className="w-12 h-12 bg-navy rounded-xl flex flex-col items-center justify-center shrink-0">
            <span className="text-white font-bold text-base leading-none">
              {flight.date.match(/\d+/)?.[0]}
            </span>
            <span className="text-blue-300/70 text-[9px] leading-none mt-0.5">
              {flight.date.match(/[а-яА-Я]+/)?.[0]?.slice(0, 3)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-navy text-sm truncate">
              {flight.from_city} <ArrowRight size={12} className="inline text-gray-400" /> {flight.to_city}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Bus size={12} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{flight.auto_name}</span>
            </div>
          </div>
        </div>
        {/* Seats badge */}
        <div className={`shrink-0 ml-3 px-3 py-1.5 rounded-xl text-xs font-bold ${seatColor(flight.free_seats)}`}>
          <Users size={12} className="inline -mt-0.5 mr-1" />
          {flight.free_seats}
        </div>
      </div>
    </button>
  );

  const renderGroup = (title: string, items: Flight[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">{title}</p>
        <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
          {items.map(renderFlightCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">Рейси</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-blue-200/60 hover:text-white transition-colors p-1"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-blue-200/60 text-xs">Оберіть рейс для бронювання</p>
      </div>

      {/* Content */}
      <div className="px-4 -mt-3 pb-6 md:px-10 md:mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : flightsError && flights.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-red-400 text-sm mb-3">{flightsError}</p>
            <button onClick={handleRefresh} className="text-accent text-sm font-semibold">Спробувати ще</button>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Наразі немає доступних рейсів</p>
          </div>
        ) : (
          <div className="space-y-5">
            {renderGroup('Україна → Європа', uaEu)}
            {renderGroup('Європа → Україна', euUa)}
            {/* If no direction grouping matches, show all */}
            {uaEu.length === 0 && euUa.length === 0 && (
              <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
                {sorted.map(renderFlightCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
