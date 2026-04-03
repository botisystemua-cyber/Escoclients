import { useState } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { createBooking } from '../lib/api';
import Modal from '../components/Modal';
import type { Flight, Screen } from '../types';

interface Props {
  flight: Flight;
  cliId: string;
  onNavigate: (screen: Screen) => void;
}

const ALL_SEATS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

const POINTS_CH = [
  { label: 'Цюрих — Parking Theater 11', value: 'Цюрих, Dorflistrasse 90, 8050 Zürich' },
  { label: 'Цуг — Bahnhofplatz', value: 'Цуг, Bahnhofplatz, 6300 Zug' },
  { label: 'Люцерн — Alpenquai', value: 'Люцерн, Tourist Bus Parking Landenberg, 6005 Luzern' },
  { label: 'Берн — Beundenfeld', value: 'Берн, Parkplatz 7c, Beundenfeld, 3014 Bern' },
  { label: 'Базель — SBB Station', value: 'Базель, Meret Oppenheim Strasse, 4053 Basel' },
  { label: 'Сен-Гален — Bahnhofplatz', value: 'Сен-Гален, Bahnhofplatz 8b, 9000 St. Gallen' },
  { label: 'Лозана — Avenue du Grey 43', value: 'Лозана, Avenue du Grey 43, 1004 Lausanne' },
  { label: 'Монтре — Route des Châtaigniers', value: 'Монтре, Route des Châtaigniers 7, 1816 Montreux' },
  { label: 'Женева — P+R Bout-du-Monde', value: 'Женева, Route de Vessy 12, 1206 Genève' },
  { label: 'Адресна доставка (інша адреса)', value: '' },
];

const POINTS_UA = [
  { label: 'Львів — ЖД вокзал', value: 'Львів, ЖД вокзал' },
  { label: 'Рудне — Нова Пошта #1', value: 'Рудне, Нова Пошта #1' },
  { label: 'Адресна доставка (інша адреса)', value: '' },
];

export default function BookingScreen({ flight, cliId, onNavigate }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', from: '', to: '', seats: 1, note: '' });
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const [customFrom, setCustomFrom] = useState(false);
  const [customTo, setCustomTo] = useState(false);
  const [seatMode, setSeatMode] = useState<'free' | 'pick'>('free');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const isUaToEu = flight.direction === 'UA → EU';

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
          {/* From — pickup point */}
          <div className="relative">
            <button type="button" onClick={() => { setShowFromList(!showFromList); setShowToList(false); }}
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.from ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm text-left flex items-center justify-between`}>
              <span className={form.from ? 'text-gray-900' : 'text-gray-400'}>{form.from || 'Посадка / відправка *'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showFromList && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-52 overflow-y-auto animate-fade-in">
                {(isUaToEu ? POINTS_UA : POINTS_CH).map(p => (
                  <button key={p.label} type="button" onClick={() => {
                    if (p.value) { update('from', p.value); setCustomFrom(false); }
                    else { update('from', ''); setCustomFrom(true); }
                    setShowFromList(false);
                  }} className="w-full px-4 py-2.5 text-left text-xs hover:bg-accent/5 transition-colors text-gray-700">{p.label}</button>
                ))}
              </div>
            )}
          </div>
          {customFrom && (
            <input placeholder="Вкажіть адресу посадки *" value={form.from} onChange={e => update('from', e.target.value)} className={inputCls('from')} />
          )}

          {/* To — dropoff point */}
          <div className="relative">
            <button type="button" onClick={() => { setShowToList(!showToList); setShowFromList(false); }}
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.to ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm text-left flex items-center justify-between`}>
              <span className={form.to ? 'text-gray-900' : 'text-gray-400'}>{form.to || 'Висадка / прибуття *'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showToList && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-52 overflow-y-auto animate-fade-in">
                {(isUaToEu ? POINTS_CH : POINTS_UA).map(p => (
                  <button key={p.label} type="button" onClick={() => {
                    if (p.value) { update('to', p.value); setCustomTo(false); }
                    else { update('to', ''); setCustomTo(true); }
                    setShowToList(false);
                  }} className="w-full px-4 py-2.5 text-left text-xs hover:bg-accent/5 transition-colors text-gray-700">{p.label}</button>
                ))}
              </div>
            )}
          </div>
          {customTo && (
            <input placeholder="Вкажіть адресу прибуття *" value={form.to} onChange={e => update('to', e.target.value)} className={inputCls('to')} />
          )}

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
              {/* Mercedes Sprinter 907 — top-down view, van moves UP */}
              <div className="relative w-full max-w-[260px] h-[370px]">
                <svg viewBox="0 0 260 370" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>

                  {/* === Main body — Sprinter 907 boxy shape === */}
                  {/* Rear section (bottom) — slightly narrower, squared off */}
                  <path d="
                    M38 50
                    Q38 18 70 12 L190 12 Q222 18 222 50
                    L225 80 L225 310 Q225 340 195 345 L65 345 Q35 340 35 310
                    L35 80 Z
                  " fill="url(#bodyGrad)" stroke="#334155" strokeWidth="2" />

                  {/* Roof rail left */}
                  <line x1="38" y1="100" x2="38" y2="330" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                  {/* Roof rail right */}
                  <line x1="222" y1="100" x2="222" y2="330" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

                  {/* === Front (top) — Sprinter 907 nose === */}
                  {/* Front bumper */}
                  <path d="M55 14 L205 14 Q218 14 220 22 L220 30 L40 30 L40 22 Q42 14 55 14Z" fill="#334155" stroke="#475569" strokeWidth="1" />
                  {/* Mercedes grille — center bar */}
                  <rect x="105" y="14" width="50" height="8" rx="2" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" />
                  {/* Mercedes star */}
                  <circle cx="130" cy="18" r="4" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.5" />

                  {/* Headlights — Sprinter 907 angular LED style */}
                  <path d="M46 16 L80 16 Q85 16 85 21 L85 28 L42 28 L42 21 Q42 16 46 16Z" fill="#fbbf24" opacity="0.5" stroke="#f59e0b" strokeWidth="0.5" />
                  <path d="M175 16 L214 16 Q218 16 218 21 L218 28 L175 28 Z" fill="#fbbf24" opacity="0.5" stroke="#f59e0b" strokeWidth="0.5" />
                  {/* DRL strips */}
                  <line x1="48" y1="24" x2="82" y2="24" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                  <line x1="178" y1="24" x2="215" y2="24" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

                  {/* Windshield — large Sprinter 907 style */}
                  <path d="M52 34 L208 34 Q218 34 220 44 L222 82 Q222 90 214 90 L46 90 Q38 90 38 82 L40 44 Q42 34 52 34Z" fill="url(#glassGrad)" stroke="#60a5fa" strokeWidth="1" />
                  {/* A-pillar left */}
                  <line x1="44" y1="36" x2="40" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  {/* A-pillar right */}
                  <line x1="216" y1="36" x2="220" y2="88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                  {/* Windshield center divider */}
                  <line x1="130" y1="36" x2="130" y2="88" stroke="#334155" strokeWidth="1.5" opacity="0.5" />

                  {/* Side mirrors — Sprinter 907 rectangular */}
                  <rect x="2" y="46" width="12" height="22" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />
                  <rect x="4" y="50" width="8" height="14" rx="2" fill="#60a5fa" opacity="0.2" />
                  <rect x="246" y="46" width="12" height="22" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />
                  <rect x="248" y="50" width="8" height="14" rx="2" fill="#60a5fa" opacity="0.2" />

                  {/* Cabin divider */}
                  <line x1="40" y1="132" x2="220" y2="132" stroke="#475569" strokeWidth="1.5" />

                  {/* Sliding door left — characteristic Sprinter rail */}
                  <line x1="36" y1="145" x2="36" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                  <rect x="33" y="195" width="6" height="20" rx="3" fill="#475569" /> {/* door handle */}
                  {/* Sliding door right */}
                  <line x1="224" y1="145" x2="224" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                  <rect x="221" y="195" width="6" height="20" rx="3" fill="#475569" />

                  {/* Rear window — split doors */}
                  <path d="M75 305 L128 305 L128 330 Q128 336 122 336 L81 336 Q75 336 75 330Z" fill="#93c5fd" opacity="0.15" stroke="#60a5fa" strokeWidth="0.5" />
                  <path d="M132 305 L185 305 L185 330 Q185 336 179 336 L138 336 Q132 336 132 330Z" fill="#93c5fd" opacity="0.15" stroke="#60a5fa" strokeWidth="0.5" />
                  {/* Rear door split line */}
                  <line x1="130" y1="290" x2="130" y2="340" stroke="#475569" strokeWidth="1" />
                  {/* Rear door hinges */}
                  <circle cx="62" cy="300" r="2" fill="#475569" />
                  <circle cx="62" cy="330" r="2" fill="#475569" />
                  <circle cx="198" cy="300" r="2" fill="#475569" />
                  <circle cx="198" cy="330" r="2" fill="#475569" />

                  {/* Rear bumper */}
                  <path d="M60 340 L200 340 Q210 340 210 346 L210 350 Q210 355 200 355 L60 355 Q50 355 50 350 L50 346 Q50 340 60 340Z" fill="#334155" stroke="#475569" strokeWidth="0.5" />

                  {/* Tail lights — vertical Sprinter style */}
                  <rect x="40" y="310" width="10" height="30" rx="3" fill="#ef4444" opacity="0.6" stroke="#dc2626" strokeWidth="0.5" />
                  <rect x="40" y="335" width="10" height="8" rx="2" fill="#fbbf24" opacity="0.4" /> {/* indicator */}
                  <rect x="210" y="310" width="10" height="30" rx="3" fill="#ef4444" opacity="0.6" stroke="#dc2626" strokeWidth="0.5" />
                  <rect x="210" y="335" width="10" height="8" rx="2" fill="#fbbf24" opacity="0.4" />

                  {/* Steering wheel */}
                  <circle cx="75" cy="70" r="13" fill="none" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="75" cy="70" r="3" fill="#94a3b8" />
                  {/* Wheel spokes */}
                  <line x1="75" y1="58" x2="75" y2="62" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="75" y1="78" x2="75" y2="82" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="63" y1="70" x2="67" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="83" y1="70" x2="87" y2="70" stroke="#94a3b8" strokeWidth="1.5" />

                  {/* Side step indicators */}
                  <rect x="30" y="135" width="6" height="3" rx="1" fill="#475569" opacity="0.5" />
                  <rect x="224" y="135" width="6" height="3" rx="1" fill="#475569" opacity="0.5" />
                </svg>

                {/* === Row 1 (front): В1 | ПАС | В2 — non-selectable === */}
                {/* Driver В1 — left */}
                <div className="absolute top-[46px] left-[28px] w-[56px] h-[40px] bg-gray-700/80 rounded-lg flex items-center justify-center border border-gray-600">
                  <span className="text-[10px] text-gray-400 font-bold">В1</span>
                </div>
                {/* Passenger ПАС — center */}
                <div className="absolute top-[46px] left-[100px] w-[56px] h-[40px] bg-gray-600/80 rounded-lg flex items-center justify-center border border-gray-500">
                  <span className="text-[9px] text-gray-400">ПАС</span>
                </div>
                {/* Reserve driver В2 — right */}
                <div className="absolute top-[46px] right-[30px] w-[56px] h-[40px] bg-gray-700/80 rounded-lg flex items-center justify-center border border-gray-600">
                  <span className="text-[10px] text-gray-400 font-bold">В2</span>
                </div>

                {/* === Row 2 (middle): A1, A2, A3 === */}
                {['A1', 'A2', 'A3'].map((seat, i) => {
                  const isOccupied = occupiedList.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  const leftPos = 28 + i * 72;
                  return (
                    <button key={seat} type="button" onClick={() => toggleSeat(seat)}
                      disabled={isOccupied}
                      className={`absolute top-[152px] w-[56px] h-[48px] rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center justify-center gap-0.5
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

                {/* === Row 3 (back): B1, B2, B3 === */}
                {['B1', 'B2', 'B3'].map((seat, i) => {
                  const isOccupied = occupiedList.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  const leftPos = 28 + i * 72;
                  return (
                    <button key={seat} type="button" onClick={() => toggleSeat(seat)}
                      disabled={isOccupied}
                      className={`absolute top-[220px] w-[56px] h-[48px] rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center justify-center gap-0.5
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
