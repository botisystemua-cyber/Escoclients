import { useState } from 'react';
import {
  Phone, MapPin, ChevronDown, ChevronUp, RotateCw, CheckCircle2, XCircle, Undo2,
  FileText, Scale, Clock, MessageSquare, Image, CreditCard, Hash, Navigation,
} from 'lucide-react';
import type { Delivery, ItemStatus } from '../types';
import { useApp } from '../store/useAppStore';
import { updateDeliveryStatus } from '../api';

interface Props {
  delivery: Delivery;
  globalIndex: number;
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

export function DeliveryCard({ delivery, globalIndex }: Props) {
  const { getStatus, setStatus, hiddenCols, driverName, currentSheet, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = getStatus(delivery._statusKey);
  const show = (col: string) => !hiddenCols.has(col);
  const priceVal = delivery.price || delivery.amount || '';
  const paymentVal = delivery.payment || '';
  const payStatusVal = delivery.paymentStatus || delivery.payStatus || '';
  const statusVal = delivery.parcelStatus || delivery.status || '';
  const canUndo = status === 'completed' || status === 'cancelled';
  const sl = statusLabels[status];

  const handleStatus = async (newStatus: ItemStatus) => {
    setStatus(delivery._statusKey, newStatus);
    try {
      await updateDeliveryStatus(driverName, currentSheet, delivery, newStatus);
      showToast(statusLabels[newStatus].text + '!');
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { showToast('Введи причину'); return; }
    setStatus(delivery._statusKey, 'cancelled');
    setShowCancel(false);
    try {
      await updateDeliveryStatus(driverName, currentSheet, delivery, 'cancelled', cancelReason);
      showToast('Скасовано');
    } catch (err) { showToast('Помилка: ' + (err as Error).message); }
  };

  const handleUndo = async () => {
    if (!canUndo) return;
    setStatus(delivery._statusKey, 'pending');
    try {
      await updateDeliveryStatus(driverName, currentSheet, delivery, 'pending', 'Відміна статусу');
      showToast('Статус відмінено');
    } catch (err) {
      showToast('Помилка: ' + (err as Error).message);
      setStatus(delivery._statusKey, status);
    }
  };

  const navigate = () => {
    if (delivery.coords?.lat) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${delivery.coords.lat},${delivery.coords.lng}&travelmode=driving`, '_blank');
    } else if (delivery.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.address)}&travelmode=driving`, '_blank');
    } else { showToast('Немає адреси'); }
  };

  return (
    <div className={`bg-card rounded-xl border border-border ${statusColors[status]} border-l-[5px] overflow-hidden`}>
      {/* Compact header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-dark text-white flex items-center justify-center text-xs font-black shrink-0">
            {globalIndex + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-text text-[13px] leading-tight truncate">
              {show('id') && <span className="text-text-secondary">#{delivery.internalNumber} </span>}
              {show('address') && delivery.address}
            </div>
            {show('name') && delivery.name && (
              <div className="text-xs text-text-secondary truncate">{delivery.name}</div>
            )}
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold ${sl.color}`}>{sl.text}</span>
        </div>

        {/* Compact chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {show('phone') && delivery.phone && <Chip icon={Phone} color="green">{delivery.phone}</Chip>}
          {show('price') && priceVal && <Chip icon={CreditCard} color="green" bold>€{priceVal}</Chip>}
          {show('ttn') && delivery.ttn && <Chip icon={FileText} color="red">ТТН: {delivery.ttn}</Chip>}
          {show('weight') && delivery.weight && <Chip icon={Scale} color="gray">{delivery.weight}кг</Chip>}
          {show('direction') && delivery.direction && <Chip icon={Navigation} color="purple">{delivery.direction}</Chip>}
          {show('timing') && delivery.timing && <Chip icon={Clock} color="gray">{delivery.timing}</Chip>}
          {show('status') && statusVal && <Chip icon={Hash} color="blue">{statusVal}</Chip>}
          {show('payment') && paymentVal && <Chip icon={CreditCard} color="gray">{paymentVal}</Chip>}
          {show('payStatus') && payStatusVal && (
            <Chip icon={CreditCard} color={payStatusVal === 'Оплачено' ? 'green' : 'red'} bold>{payStatusVal}</Chip>
          )}
        </div>
        {show('note') && delivery.note?.trim() && (
          <div className="flex items-start gap-1 mt-1.5 text-[11px] text-text-secondary leading-tight">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" /><span className="truncate">{delivery.note}</span>
          </div>
        )}
      </div>

      {/* Actions row — compact */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5">
          <ActBtn icon={Phone} label="Дзвонити" onClick={() => { window.location.href = `tel:${delivery.phone}`; }} />
          <ActBtn icon={MapPin} label="Карта" onClick={navigate} />
          <ActBtn icon={expanded ? ChevronUp : ChevronDown} label="Деталі" onClick={() => setExpanded(!expanded)} />
        </div>
      </div>

      {/* Status buttons — single row */}
      <div className="flex border-t border-border">
        <SBtn icon={RotateCw} color="text-blue-600 bg-blue-50" onClick={() => handleStatus('in-progress')} />
        <SBtn icon={CheckCircle2} color="text-green-600 bg-green-50" onClick={() => handleStatus('completed')} />
        <SBtn icon={XCircle} color="text-red-500 bg-red-50" onClick={() => { setShowCancel(true); setExpanded(true); }} />
        <SBtn icon={Undo2} color="text-gray-400 bg-gray-50" onClick={handleUndo} disabled={!canUndo} last />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border bg-bg p-3 space-y-2">
          <Det label="ПІБ" value={delivery.name} />
          <Det label="Номер" value={`${delivery.internalNumber}${delivery.id ? ' / ' + delivery.id : ''}`} />
          {delivery.vo && <Det label="ВО" value={delivery.vo} />}
          <Det label="Адреса" value={delivery.address} />
          <Det label="ТТН" value={delivery.ttn} />
          <Det label="Вага" value={delivery.weight} />
          {delivery.direction && <Det label="Напрямок" value={delivery.direction} />}
          <Det label="Телефон" value={delivery.phone} />
          {delivery.registrarPhone && <Det label="Тел. Реєстр." value={delivery.registrarPhone} />}
          {priceVal && <Det label="Сума" value={`€${priceVal}`} />}
          {paymentVal && <Det label="Оплата" value={paymentVal} />}
          {payStatusVal && <Det label="Статус оплати" value={payStatusVal} />}
          {delivery.timing && <Det label="Таймінг" value={delivery.timing} />}
          {delivery.createdAt && <Det label="Дата оформл." value={delivery.createdAt} />}
          {delivery.receiveDate && <Det label="Дата отрим." value={delivery.receiveDate} />}
          {delivery.smsNote?.trim() && <Det label="SMS" value={delivery.smsNote} />}
          {delivery.photo?.startsWith('http') && (
            <a href={delivery.photo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
              <Image className="w-3.5 h-3.5" /> Відкрити фото
            </a>
          )}
        </div>
      )}

      {/* Cancel reason */}
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
    green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700', gray: 'bg-gray-100 text-gray-600',
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
