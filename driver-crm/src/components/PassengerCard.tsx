import { useState } from 'react';
import {
  Phone, MapPin, ChevronDown, ChevronUp, RotateCw, CheckCircle2, XCircle, Undo2,
  Users, Calendar, Clock, Car, FileText, ArrowRight, Repeat,
} from 'lucide-react';
import type { Passenger, ItemStatus } from '../types';
import { useApp } from '../store/useAppStore';
import { updatePassengerStatus } from '../api';

interface Props { passenger: Passenger; index: number; onTransfer?: () => void; }

const borderColor: Record<ItemStatus, string> = {
  pending: 'border-l-amber-400', 'in-progress': 'border-l-blue-500',
  completed: 'border-l-emerald-500', cancelled: 'border-l-red-400',
};
const statusLabel: Record<ItemStatus, { t: string; c: string }> = {
  pending: { t: 'Очікує', c: 'text-amber-600 bg-amber-50' },
  'in-progress': { t: 'В роботі', c: 'text-blue-600 bg-blue-50' },
  completed: { t: 'Готово', c: 'text-emerald-600 bg-emerald-50' },
  cancelled: { t: 'Скасов.', c: 'text-red-600 bg-red-50' },
};

export function PassengerCard({ passenger, index, onTransfer }: Props) {
  const { getStatus, setStatus, driverName, currentSheet, isUnifiedView, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = getStatus(passenger._statusKey);
  const canUndo = status === 'completed' || status === 'cancelled';
  const routeName = isUnifiedView && passenger._sourceRoute ? passenger._sourceRoute : currentSheet;
  const sl = statusLabel[status];

  const doStatus = async (ns: ItemStatus) => {
    setStatus(passenger._statusKey, ns);
    try { await updatePassengerStatus(driverName, routeName, passenger, ns); showToast(statusLabel[ns].t + '!'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doCancel = async () => {
    if (!cancelReason.trim()) { showToast('Введи причину'); return; }
    setStatus(passenger._statusKey, 'cancelled'); setShowCancel(false);
    try { await updatePassengerStatus(driverName, routeName, passenger, 'cancelled', cancelReason); showToast('Скасовано'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doUndo = async () => {
    if (!canUndo) return;
    const prev = status; setStatus(passenger._statusKey, 'pending');
    try { await updatePassengerStatus(driverName, routeName, passenger, 'pending', 'Відміна'); showToast('Відмінено'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); setStatus(passenger._statusKey, prev); }
  };
  const nav = (addr: string) => {
    if (addr) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`, '_blank');
    else showToast('Немає адреси');
  };

  return (
    <div className={`bg-card rounded-2xl border border-border ${borderColor[status]} border-l-4 overflow-hidden shadow-sm`}>
      <div className="p-3.5">
        {/* Top row */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {isUnifiedView && passenger._sourceRoute && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-600 bg-blue-50 mb-0.5">{passenger._sourceRoute}</span>
            )}
            <div className="font-semibold text-text text-[13px] leading-snug truncate">{passenger.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
              <Car className="w-3 h-3 shrink-0" /><span className="truncate">{passenger.from}</span>
              <ArrowRight className="w-3 h-3 shrink-0 text-brand" /><span className="truncate">{passenger.to}</span>
            </div>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${sl.c}`}>{sl.t}</span>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <C icon={Phone} c="green">{passenger.phone}</C>
          {passenger.date && <C icon={Calendar} c="gray">{passenger.date}</C>}
          {passenger.timing && <C icon={Clock} c="gray">{passenger.timing}</C>}
          {passenger.seats && <C icon={Users} c="blue">{passenger.seats} місць</C>}
          {passenger.payment && <C icon={FileText} c="green" b>€{passenger.payment}</C>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-2">
          <Btn icon={Phone} label="Дзвонити" color="bg-green-50 text-green-700" onClick={() => { window.location.href = `tel:${passenger.phone}`; }} />
          <Btn icon={Car} label="Звідки" color="bg-blue-50 text-blue-700" onClick={() => nav(passenger.from)} />
          <Btn icon={MapPin} label="Куди" color="bg-blue-50 text-blue-700" onClick={() => nav(passenger.to)} />
        </div>
        <div className={`flex gap-2 mb-2`}>
          <Btn icon={expanded ? ChevronUp : ChevronDown} label={expanded ? 'Згорнути' : 'Деталі'} color="bg-gray-50 text-gray-600" onClick={() => setExpanded(!expanded)} />
          {onTransfer && <Btn icon={Repeat} label="Перенести" color="bg-amber-50 text-amber-700" onClick={onTransfer} />}
        </div>

        {/* Status */}
        <div className="flex gap-1.5">
          <SB icon={RotateCw} c="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => doStatus('in-progress')} />
          <SB icon={CheckCircle2} c="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => doStatus('completed')} />
          <SB icon={XCircle} c="border-red-200 text-red-500 hover:bg-red-50" onClick={() => { setShowCancel(true); setExpanded(true); }} />
          <SB icon={Undo2} c="border-gray-200 text-gray-400 hover:bg-gray-50" onClick={doUndo} disabled={!canUndo} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-gray-50/80 px-3.5 py-3 space-y-1.5">
          <D l="ПІБ" v={passenger.name} /><D l="ІД" v={passenger.id} /><D l="Дата" v={passenger.date} />
          <D l="Маршрут" v={`${passenger.from} → ${passenger.to}`} /><D l="Місць" v={passenger.seats?.toString()} />
          <D l="Вага" v={passenger.weight} /><D l="Автомобіль" v={passenger.vehicle} />
          {passenger._sourceRoute && <D l="Маршрут. лист" v={passenger._sourceRoute} />}
          {passenger.note?.trim() && <D l="Примітка" v={passenger.note} />}
        </div>
      )}

      {showCancel && (
        <div className="border-t border-red-100 bg-red-50/60 p-3.5">
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Причина скасування..." autoFocus
            className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-xl text-text text-sm resize-none h-16 focus:outline-none focus:border-red-400" />
          <button onClick={doCancel} className="w-full mt-2 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm cursor-pointer active:scale-[0.98]">Підтвердити</button>
        </div>
      )}
    </div>
  );
}

function C({ icon: I, c, b, children }: { icon: typeof Phone; c: string; b?: boolean; children: React.ReactNode }) {
  const m: Record<string, string> = { green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', gray: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${b ? 'font-bold' : 'font-medium'} ${m[c]}`}><I className="w-3 h-3" />{children}</span>;
}
function Btn({ icon: I, label, color, onClick }: { icon: typeof Phone; label: string; color: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform ${color}`}><I className="w-4 h-4" />{label}</button>;
}
function SB({ icon: I, c, onClick, disabled }: { icon: typeof RotateCw; c: string; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`flex-1 py-2 border rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all ${c} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}><I className="w-4 h-4" /></button>;
}
function D({ l, v }: { l: string; v?: string }) {
  if (!v) return null;
  return <div className="flex gap-2 text-xs"><span className="text-muted font-medium shrink-0 w-[90px]">{l}</span><span className="text-text break-words">{v}</span></div>;
}
