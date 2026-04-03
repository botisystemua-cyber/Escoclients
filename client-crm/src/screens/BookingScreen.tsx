import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createBooking } from '../lib/api';
import Modal from '../components/Modal';
import type { Flight, Screen } from '../types';

interface Props {
  flight: Flight;
  cliId: string;
  onNavigate: (screen: Screen) => void;
}

const ALL_SEATS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

export default function BookingScreen({ flight, cliId, onNavigate }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', from: '', to: '', seats: 1, note: '' });
  const [seatMode, setSeatMode] = useState<'free' | 'pick'>('free');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Parse occupied seats from flight data
  const occupiedSeats = (flight.free_list ? [] : []).concat(
    // Occupied list contains seat names that are taken
  );
  const occupiedList = flight.free_list
    ? ALL_SEATS.filter(s => !flight.free_list.split(',').map(x => x.trim()).includes(s))
    : [];

  const update = (k: string, v: string | number) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: false }));
    setError('');
  };

  const toggleSeat = (seat: string) => {
    if (occupiedList.includes(seat)) return;
    setSelectedSeats(prev =>
      prev.includes(seat)
        ? prev.filter(s => s !== seat)
        : prev.length < form.seats ? [...prev, seat] : prev
    );
  };

  const seatSurcharge = seatMode === 'pick' ? 30 * form.seats : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: Record<string, boolean> = {};
    if (!form.name) errs.name = true;
    if (!form.phone) errs.phone = true;
    if (!form.from) errs.from = true;
    if (!form.to) errs.to = true;
    if (seatMode === 'pick' && selectedSeats.length < form.seats) {
      setError(`Оберіть ${form.seats} місць на схемі`);
      return;
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await createBooking(cliId, {
        date_trip: flight.date,
        direction: flight.direction,
        city: flight.city,
        addr_from: form.from,
        addr_to: form.to,
        seats: String(form.seats),
        pax_name: form.name,
        pax_phone: form.phone,
        auto_id: flight.cal_id,
        rte_id: '',
        cal_id: flight.cal_id,
        seat: seatMode === 'pick' ? selectedSeats.join(', ') : 'Вільна розсадка',
        note: form.note,
        seat_surcharge: String(seatSurcharge),
      });
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка бронювання');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 border ${errors[field] ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition`;

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <button onClick={() => onNavigate('flights')} className="text-blue-200/60 flex items-center gap-1 mb-3 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-lg font-bold text-white">
          {flight.from_city} → {flight.to_city}
        </h1>
        <p className="text-blue-200/60 text-xs mt-1">{flight.auto_name} · {flight.date} · Вільних: {flight.free_seats}</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-3 pb-6 space-y-3 md:max-w-2xl md:mx-auto md:mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <input placeholder="ПІБ пасажира *" value={form.name} onChange={e => update('name', e.target.value)} className={inputCls('name')} />
          <input placeholder="Телефон *" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls('phone')} />
          <input placeholder="Адреса відправки *" value={form.from} onChange={e => update('from', e.target.value)} className={inputCls('from')} />
          <input placeholder="Адреса прибуття *" value={form.to} onChange={e => update('to', e.target.value)} className={inputCls('to')} />

          <div>
            <p className="text-xs text-gray-500 mb-2">Кількість місць</p>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <button key={n} type="button"
                  onClick={() => { update('seats', n); setSelectedSeats(prev => prev.slice(0, n)); }}
                  className={`w-12 h-10 rounded-xl font-bold text-sm transition ${form.seats === n ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'}`}
                >{n}</button>
              ))}
            </div>
          </div>

          <textarea placeholder="Примітка" value={form.note} onChange={e => update('note', e.target.value)} rows={2}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition resize-none" />
        </div>

        {/* Seat selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-navy mb-3">Вибір місця</p>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => { setSeatMode('free'); setSelectedSeats([]); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${seatMode === 'free' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'}`}>
              Вільна розсадка
            </button>
            <button type="button" onClick={() => setSeatMode('pick')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${seatMode === 'pick' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'}`}>
              Обрати місце +30&euro;
            </button>
          </div>

          {seatMode === 'pick' && (
            <div className="flex flex-col items-center">
              {/* Sprinter layout — horizontal, front on right */}
              <div className="relative w-full max-w-[340px] h-[220px]">
                <svg viewBox="0 0 340 220" className="absolute inset-0 w-full h-full">
                  {/* Van body */}
                  <rect x="8" y="10" width="324" height="200" rx="30" ry="30" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  {/* Windshield (front-right) */}
                  <path d="M280 30 Q320 30 322 60 L322 160 Q320 190 280 190 L270 190 L270 30Z" fill="#93c5fd" opacity="0.25" stroke="#60a5fa" strokeWidth="1" />
                  {/* Rear window (left) */}
                  <path d="M50 55 Q38 55 38 70 L38 150 Q38 165 50 165 L58 165 L58 55Z" fill="#93c5fd" opacity="0.15" stroke="#60a5fa" strokeWidth="1" />
                  {/* Side mirrors */}
                  <ellipse cx="300" cy="8" rx="8" ry="10" fill="#334155" stroke="#475569" strokeWidth="1" />
                  <ellipse cx="300" cy="212" rx="8" ry="10" fill="#334155" stroke="#475569" strokeWidth="1" />
                  {/* Headlights */}
                  <circle cx="332" cy="50" r="6" fill="#fbbf24" opacity="0.6" />
                  <circle cx="332" cy="170" r="6" fill="#fbbf24" opacity="0.6" />
                  {/* Tail lights */}
                  <rect x="8" y="50" width="5" height="16" rx="2.5" fill="#ef4444" opacity="0.7" />
                  <rect x="8" y="154" width="5" height="16" rx="2.5" fill="#ef4444" opacity="0.7" />
                  {/* Cabin divider */}
                  <line x1="232" y1="25" x2="232" y2="195" stroke="#475569" strokeWidth="1" />
                  {/* Door lines */}
                  <line x1="70" y1="10" x2="160" y2="10" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />
                  <line x1="70" y1="210" x2="160" y2="210" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />
                  {/* Row labels */}
                  <text x="24" y="116" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">ЗАД</text>
                  <text x="310" y="116" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">ПЕРЕД</text>
                </svg>

                {/* Driver V1 — front right, top row */}
                <div className="absolute right-[22px] top-[24px] w-[52px] h-[42px] bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                  <span className="text-[10px] text-gray-400 font-bold">В1</span>
                </div>

                {/* Front passenger — front right, bottom row */}
                <div className="absolute right-[22px] bottom-[30px] w-[52px] h-[42px] bg-gray-600 rounded-lg flex items-center justify-center border border-gray-500">
                  <span className="text-[9px] text-gray-400">ПАС</span>
                </div>

                {/* Seat grid: 3 columns (rows from front→back) × 2 rows (top=B, bottom=A) */}
                {/* Top row: B1, B2, B3 (left side of van) */}
                {['B1', 'B2', 'B3'].map((seat, i) => {
                  const isOccupied = occupiedList.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  const leftPos = 42 + i * 62;
                  return (
                    <button key={seat} type="button" onClick={() => toggleSeat(seat)}
                      disabled={isOccupied}
                      className={`absolute top-[24px] w-[54px] h-[42px] rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center justify-center
                        ${isOccupied
                          ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-105'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:border-accent hover:bg-accent/10'
                        }`}
                      style={{ left: `${leftPos}px` }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M7 18v-1.2c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8V18h1v-1.2c0-1.5-1.3-2.8-2.8-2.8H8.8C7.3 14 6 15.3 6 16.8V18h1zm5-14c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                      </svg>
                      <span className="text-[10px]">{seat}</span>
                    </button>
                  );
                })}

                {/* Bottom row: A1, A2, A3 (right side of van) */}
                {['A1', 'A2', 'A3'].map((seat, i) => {
                  const isOccupied = occupiedList.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  const leftPos = 42 + i * 62;
                  return (
                    <button key={seat} type="button" onClick={() => toggleSeat(seat)}
                      disabled={isOccupied}
                      className={`absolute bottom-[30px] w-[54px] h-[42px] rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center justify-center
                        ${isOccupied
                          ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-105'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:border-accent hover:bg-accent/10'
                        }`}
                      style={{ left: `${leftPos}px` }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M7 18v-1.2c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8V18h1v-1.2c0-1.5-1.3-2.8-2.8-2.8H8.8C7.3 14 6 15.3 6 16.8V18h1zm5-14c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                      </svg>
                      <span className="text-[10px]">{seat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-300" />
                  <span className="text-gray-500">Вільне</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-accent border-2 border-accent" />
                  <span className="text-gray-500">Обране</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
                  <span className="text-gray-500">Зайняте</span>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <p className="mt-3 text-sm font-semibold text-navy">
                  Обрано: {selectedSeats.join(', ')} · +{seatSurcharge}&euro;
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs pl-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-accent text-white font-bold rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-accent/30 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> Бронювання...</>
          ) : (
            seatSurcharge > 0 ? `Забронювати (+${seatSurcharge}€)` : 'Забронювати'
          )}
        </button>
      </form>

      {showModal && (
        <Modal
          title="Заявку прийнято!"
          subtitle="Менеджер зв'яжеться з вами найближчим часом"
          onClose={() => { setShowModal(false); onNavigate('flights'); }}
        />
      )}
    </div>
  );
}
