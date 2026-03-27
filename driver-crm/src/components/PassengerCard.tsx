import { useState } from 'react';
import {
  Phone, MapPin, ChevronDown, ChevronUp, RotateCw, CheckCircle2, XCircle, Undo2,
  Users, Calendar, Clock, Car, FileText, ArrowRight, Repeat,
} from 'lucide-react';
import type { Passenger, ItemStatus } from '../types';
import { useApp } from '../store/useAppStore';
import { updatePassengerStatus } from '../api';

interface Props {
  passenger: Passenger;
  index: number;
  onTransfer?: () => void;
}

const statusColors: Record<ItemStatus, string> = {
  pending: 'border-l-amber-400',
  'in-progress': 'border-l-blue-500',
  completed: 'border-l-green-500',
  cancelled: 'border-l-red-500',
};

const statusLabels: Record<ItemStatus, { text: string; color: string }> = {
  pending: { text: 'Очікує', color: 'bg-amber-50 text-amber-700' },
  'in-progress': { text: 'В роботі', color: 'bg-blue-50 text-blue-700' },
  completed: { text: 'Готово', color: 'bg-green-50 text-green-700' },
  cancelled: { text: 'Скасов.', color: 'bg-red-50 text-red-700' },
};

export function PassengerCard({ passenger, index, onTransfer }: Props) {
  const { getStatus, setStatus, driverName, currentSheet, isUnifiedView, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = getStatus(passenger._statusKey);
  const canUndo = status === 'completed' || status === 'cancelled';
  const routeName = isUnifiedView && passenger._sourceRoute ? passenger._sourceRoute : currentSheet;
  const sl = statusLabels[status];

  const handleStatus = async (newStatus: ItemStatus) => {
    setStatus(passenger._statusKey, newStatus);
    try {
      await updatePassengerStatus(driverName, routeName, passenger, newStatus);
      showToast(statusLabels[newStatus].text + '!');
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { showToast('Введи причину'); return; }
    setStatus(passenger._statusKey, 'cancelled');
    setShowCancel(false);
    try {
      await updatePassengerStatus(driverName, routeName, passenger, 'cancelled', cancelReason);
      showToast('Скасовано');
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
  };

  const handleUndo = async () => {
    if (!canUndo) return;
    const prev = status;
    setStatus(passenger._statusKey, 'pending');
    try {
      await updatePassengerStatus(driverName, routeName, passenger, 'pending', 'Відміна статусу водієм');
      showToast('Статус відмінено');
    } catch (err) {
      showToast('Помилка: ' + (err as Error).message);
      setStatus(passenger._statusKey, prev);
    }
  };

  const navigateTo = (addr: string) => {
    if (addr) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}&travelmode=driving`, '_blank');
    else showToast('Немає адреси');
  };

  return (
    <div className={`bg-card rounded-xl border border-border ${statusColors[status]} border-l-[5px] overflow-hidden`}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {isUnifiedView && passenger._sourceRoute && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-600 bg-blue-50 mb-0.5">
                {passenger._sourceRoute}
              </span>
            )}
            <div className="font-bold text-text text-[13px] leading-tight truncate">{passenger.name}</div>
            <div className="flex items-center gap-1 text-xs text-text-secondary truncate">
              <Car className="w-3 h-3 shrink-0" />{passenger.from}
              <ArrowRight className="w-3 h-3 shrink-0 text-brand" />{passenger.to}
            </div>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold ${sl.color}`}>{sl.text}</span>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          <Chip icon={Phone} color="green">{passenger.phone}</Chip>
          {passenger.date && <Chip icon={Calendar} color="gray">{passenger.date}</Chip>}
          {passenger.timing && <Chip icon={Clock} color="gray">{passenger.timing}</Chip>}
          {passenger.seats && <Chip icon={Users} color="blue">{passenger.seats} місць</Chip>}
          {passenger.payment && <Chip icon={FileText} color="green" bold>€{passenger.payment}</Chip>}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5">
          <ActBtn icon={Phone} label="Дзвонити" onClick={() => { window.location.href = `tel:${passenger.phone}`; }} />
          <ActBtn icon={Car} label="Відправка" onClick={() => navigateTo(passenger.from)} />
          <ActBtn icon={MapPin} label="Прибуття" onClick={() => navigateTo(passenger.to)} />
        </div>
        <div className={`flex gap-1.5 mt-1.5`}>
          <ActBtn icon={expanded ? ChevronUp : ChevronDown} label="Деталі" onClick={() => setExpanded(!expanded)} />
          {onTransfer && (
            <button onClick={onTransfer}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-50 rounded-lg text-[11px] font-semibold text-amber-700 cursor-pointer active:scale-95">
              <Repeat className="w-3.5 h-3.5" /> Перенести
            </button>
          )}
        </div>
      </div>

      {/* Status buttons */}
      <div className="flex border-t border-border">
        <SBtn icon={RotateCw} color="text-blue-600 bg-blue-50" onClick={() => handleStatus('in-progress')} />
        <SBtn icon={CheckCircle2} color="text-green-600 bg-green-50" onClick={() => handleStatus('completed')} />
        <SBtn icon={XCircle} color="text-red-500 bg-red-50" onClick={() => { setShowCancel(true); setExpanded(true); }} />
        <SBtn icon={Undo2} color="text-gray-400 bg-gray-50" onClick={handleUndo} disabled={!canUndo} last />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border bg-bg p-3 space-y-2">
          <Det label="ПІБ" value={passenger.name} />
          <Det label="ІД" value={passenger.id} />
          <Det label="Дата виїзду" value={passenger.date} />
          <Det label="Маршрут" value={`${passenger.from} → ${passenger.to}`} />
          <Det label="Місць" value={passenger.seats?.toString()} />
          <Det label="Вага" value={passenger.weight} />
          <Det label="Автомобіль" value={passenger.vehicle} />
          {passenger._sourceRoute && <Det label="Маршрут. лист" value={passenger._sourceRoute} />}
          {passenger.note?.trim() && <Det label="Примітка" value={passenger.note} />}
        </div>
      )}

      {/* Cancel */}
      {showCancel && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Причина скасування..." autoFocus
            className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-xl text-text text-sm resize-none h-16 focus:outline-none focus:border-red-400" />
          <button onClick={handleCancel}
            className="w-full mt-2 py-2.5 bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer">
            Підтвердити
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ icon: Icon, color, bold, children }: { icon: typeof Phone; color: string; bold?: boolean; children: React.ReactNode }) {
  const c: Record<string, string> = {
    green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] ${bold ? 'font-bold' : 'font-semibold'} ${c[color]}`}>
      <Icon className="w-3 h-3" />{children}
    </span>
  );
}

function ActBtn({ icon: Icon, label, onClick }: { icon: typeof Phone; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1 py-2 bg-bg rounded-lg text-[11px] font-semibold text-text-secondary hover:text-brand transition-colors cursor-pointer active:scale-95">
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );
}

function SBtn({ icon: Icon, color, onClick, disabled, last }: {
  icon: typeof RotateCw; color: string; onClick: () => void; disabled?: boolean; last?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex-1 flex items-center justify-center py-2.5 ${color} cursor-pointer transition-all active:scale-95 ${!last ? 'border-r border-border' : ''} ${disabled ? 'opacity-25 cursor-not-allowed' : ''}`}>
      <Icon className="w-4.5 h-4.5" />
    </button>
  );
}

function Det({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-text-secondary font-semibold shrink-0 w-24">{label}</span>
      <span className="text-text break-words">{value}</span>
    </div>
  );
}
