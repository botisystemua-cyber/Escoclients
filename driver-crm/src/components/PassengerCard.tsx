import { useState } from 'react';
import {
  Phone, MapPin, ChevronDown, ChevronUp, RotateCw, CheckCircle2, XCircle, Undo2,
  Users, Calendar, Clock, Car, FileText, ArrowRight, Repeat, MessageSquare,
} from 'lucide-react';
import type { Passenger, ItemStatus } from '../types';
import { useApp } from '../store/useAppStore';
import { updatePassengerStatus } from '../api';

interface Props { passenger: Passenger; index: number; onTransfer?: () => void; }

const leftBorder: Record<ItemStatus, string> = {
  pending: 'border-l-amber-400', 'in-progress': 'border-l-blue-500',
  completed: 'border-l-emerald-500', cancelled: 'border-l-red-400',
};
const stLabel: Record<ItemStatus, { t: string; c: string }> = {
  pending: { t: 'Очікує', c: 'text-amber-700 bg-amber-50' },
  'in-progress': { t: 'В роботі', c: 'text-blue-700 bg-blue-50' },
  completed: { t: 'Готово', c: 'text-emerald-700 bg-emerald-50' },
  cancelled: { t: 'Скасов.', c: 'text-red-700 bg-red-50' },
};

export function PassengerCard({ passenger, index, onTransfer }: Props) {
  const { getStatus, setStatus, driverName, currentSheet, isUnifiedView, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = getStatus(passenger._statusKey);
  const canUndo = status === 'completed' || status === 'cancelled';
  const routeName = isUnifiedView && passenger._sourceRoute ? passenger._sourceRoute : currentSheet;
  const sl = stLabel[status];

  const doStatus = async (ns: ItemStatus) => {
    setStatus(passenger._statusKey, ns);
    try { await updatePassengerStatus(driverName, routeName, passenger, ns); showToast(stLabel[ns].t + '!'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doCancel = async () => {
    if (!cancelReason.trim()) { showToast('Введи причину'); return; }
    setStatus(passenger._statusKey, 'cancelled'); setShowCancel(false);
    try { await updatePassengerStatus(driverName, routeName, passenger, 'cancelled', cancelReason); showToast('Скасовано'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doUndo = async () => {
    if (!canUndo) return; const prev = status; setStatus(passenger._statusKey, 'pending');
    try { await updatePassengerStatus(driverName, routeName, passenger, 'pending', 'Відміна'); showToast('Відмінено'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); setStatus(passenger._statusKey, prev); }
  };
  const nav = (addr: string) => {
    if (addr) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`, '_blank');
    else showToast('Немає адреси');
  };

  return (
    <div className={`bg-card rounded-2xl ${leftBorder[status]} border-l-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden`}>
      <div className="px-4 pt-3.5 pb-3">
        {/* === ROW 1: index + name/route + status === */}
        <div className="flex items-start gap-3 mb-1.5">
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            {isUnifiedView && passenger._sourceRoute && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-600 bg-blue-50 mb-0.5">{passenger._sourceRoute}</span>
            )}
            {/* NAME — primary, bold */}
            <p className="font-bold text-text text-[15px] leading-snug truncate">{passenger.name}</p>
            {/* Route — secondary */}
            <div className="flex items-center gap-1 text-xs text-secondary mt-0.5">
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{passenger.from}</span>
              <ArrowRight className="w-3 h-3 shrink-0 text-brand" />
              <span className="truncate">{passenger.to}</span>
            </div>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${sl.c}`}>{sl.t}</span>
        </div>

        {/* === ROW 2: params — neutral chips, money highlighted === */}
        <div className="flex flex-wrap items-center gap-1.5 ml-10 mb-2.5">
          {passenger.payment && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50">
              <FileText className="w-3 h-3" />€{passenger.payment}
            </span>
          )}
          {passenger.seats && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Users className="w-3 h-3" />{passenger.seats} місць
            </span>
          )}
          {passenger.date && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Calendar className="w-3 h-3" />{passenger.date}
            </span>
          )}
          {passenger.timing && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Clock className="w-3 h-3" />{passenger.timing}
            </span>
          )}
        </div>

        {/* === Note highlight === */}
        {passenger.note?.trim() && (
          <div className="ml-10 mb-2.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-highlight text-amber-800 text-xs leading-snug">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span className="line-clamp-2">{passenger.note}</span>
          </div>
        )}

        {/* === Phone === */}
        <div className="ml-10 mb-3 text-sm font-semibold text-text flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-brand" />{passenger.phone}
        </div>

        {/* === ACTIONS === */}
        <div className="flex items-center gap-2 ml-10">
          <button onClick={() => doStatus(status === 'pending' ? 'in-progress' : 'completed')}
            className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl cursor-pointer active:scale-[0.97] transition-transform shadow-sm shadow-brand/20 text-center">
            {status === 'pending' ? 'В роботу' : status === 'in-progress' ? 'Завершити' : 'Готово ✓'}
          </button>
          <IconBtn icon={Phone} onClick={() => { window.location.href = `tel:${passenger.phone}`; }} />
          <IconBtn icon={Car} onClick={() => nav(passenger.from)} />
          <IconBtn icon={MapPin} onClick={() => nav(passenger.to)} />
          <IconBtn icon={expanded ? ChevronUp : ChevronDown} onClick={() => setExpanded(!expanded)} />
        </div>

        {/* === Extra actions === */}
        <div className="flex items-center gap-1 mt-2 ml-10">
          <MiniBtn icon={RotateCw} c="text-blue-500" onClick={() => doStatus('in-progress')} />
          <MiniBtn icon={CheckCircle2} c="text-emerald-500" onClick={() => doStatus('completed')} />
          <MiniBtn icon={XCircle} c="text-red-400" onClick={() => { setShowCancel(true); setExpanded(true); }} />
          <MiniBtn icon={Undo2} c="text-muted" onClick={doUndo} disabled={!canUndo} />
          {onTransfer && (
            <button onClick={onTransfer}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer active:scale-95 transition-all">
              <Repeat className="w-3 h-3" />Перенести
            </button>
          )}
        </div>
      </div>

      {/* EXPANDED */}
      {expanded && (
        <div className="border-t border-border bg-bg px-4 py-3 space-y-1.5">
          <D l="ПІБ" v={passenger.name} /><D l="ІД" v={passenger.id} /><D l="Дата" v={passenger.date} />
          <D l="Маршрут" v={`${passenger.from} → ${passenger.to}`} /><D l="Місць" v={passenger.seats?.toString()} />
          <D l="Вага" v={passenger.weight} /><D l="Автомобіль" v={passenger.vehicle} />
          {passenger._sourceRoute && <D l="Маршрут. лист" v={passenger._sourceRoute} />}
          {passenger.note?.trim() && <D l="Примітка" v={passenger.note} />}
        </div>
      )}

      {/* CANCEL */}
      {showCancel && (
        <div className="border-t border-red-100 bg-red-50/50 px-4 py-3">
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Причина скасування..." autoFocus
            className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-text text-sm resize-none h-16 focus:outline-none focus:border-red-400" />
          <button onClick={doCancel} className="w-full mt-2 py-2.5 bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-[0.98]">Підтвердити</button>
        </div>
      )}
    </div>
  );
}

function IconBtn({ icon: I, onClick }: { icon: typeof Phone; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-secondary hover:text-brand hover:bg-gray-100 cursor-pointer active:scale-90 transition-all">
      <I className="w-4 h-4" />
    </button>
  );
}

function MiniBtn({ icon: I, c, onClick, disabled }: { icon: typeof RotateCw; c: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-all ${c} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}>
      <I className="w-3.5 h-3.5" />
    </button>
  );
}

function D({ l, v }: { l: string; v?: string }) {
  if (!v) return null;
  return <div className="flex gap-2 text-xs"><span className="text-muted font-medium shrink-0 w-[90px]">{l}</span><span className="text-text break-words">{v}</span></div>;
}
