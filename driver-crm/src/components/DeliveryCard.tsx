import { useState } from 'react';
import {
  Phone, MapPin, ChevronDown, ChevronUp, RotateCw, CheckCircle2, XCircle, Undo2,
  Scale, Clock, MessageSquare, Image, CreditCard, Navigation, FileText,
} from 'lucide-react';
import type { Delivery, ItemStatus } from '../types';
import { useApp } from '../store/useAppStore';
import { updateDeliveryStatus } from '../api';

interface Props { delivery: Delivery; globalIndex: number; }

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
  const sl = stLabel[status];

  const doStatus = async (ns: ItemStatus) => {
    setStatus(delivery._statusKey, ns);
    try { await updateDeliveryStatus(driverName, currentSheet, delivery, ns); showToast(stLabel[ns].t + '!'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doCancel = async () => {
    if (!cancelReason.trim()) { showToast('Введи причину'); return; }
    setStatus(delivery._statusKey, 'cancelled'); setShowCancel(false);
    try { await updateDeliveryStatus(driverName, currentSheet, delivery, 'cancelled', cancelReason); showToast('Скасовано'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); }
  };
  const doUndo = async () => {
    if (!canUndo) return; const prev = status; setStatus(delivery._statusKey, 'pending');
    try { await updateDeliveryStatus(driverName, currentSheet, delivery, 'pending', 'Відміна'); showToast('Відмінено'); }
    catch (e) { showToast('Помилка: ' + (e as Error).message); setStatus(delivery._statusKey, prev); }
  };
  const navigate = () => {
    if (delivery.coords?.lat) window.open(`https://www.google.com/maps/dir/?api=1&destination=${delivery.coords.lat},${delivery.coords.lng}&travelmode=driving`, '_blank');
    else if (delivery.address) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.address)}&travelmode=driving`, '_blank');
    else showToast('Немає адреси');
  };

  return (
    <div className={`bg-card rounded-2xl ${leftBorder[status]} border-l-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden`}>
      <div className="px-4 pt-3.5 pb-3">
        {/* === ROW 1: Number + Address + Status pill === */}
        <div className="flex items-start gap-3 mb-1.5">
          <span className="w-7 h-7 rounded-lg bg-gray-100 text-secondary flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
            {globalIndex + 1}
          </span>
          <div className="flex-1 min-w-0">
            {/* ADDRESS — primary, bold, larger */}
            <p className="font-bold text-text text-[15px] leading-snug">
              {show('address') && (delivery.address || '—')}
            </p>
            {/* Name + ID — secondary, muted */}
            <p className="text-xs text-secondary mt-0.5 truncate">
              {show('name') && delivery.name}{show('id') && <span className="text-muted"> · #{delivery.internalNumber}</span>}
              {show('vo') && delivery.vo && <span className="text-muted"> · {delivery.vo}</span>}
            </p>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${sl.c}`}>{sl.t}</span>
        </div>

        {/* === ROW 2: Key params — neutral chips, money highlighted === */}
        <div className="flex flex-wrap items-center gap-1.5 ml-10 mb-2.5">
          {show('price') && priceVal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50">
              <CreditCard className="w-3 h-3" />€{priceVal}
            </span>
          )}
          {show('weight') && delivery.weight && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Scale className="w-3 h-3" />{delivery.weight}кг
            </span>
          )}
          {show('ttn') && delivery.ttn && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <FileText className="w-3 h-3" />{delivery.ttn}
            </span>
          )}
          {show('timing') && delivery.timing && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Clock className="w-3 h-3" />{delivery.timing}
            </span>
          )}
          {show('direction') && delivery.direction && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">
              <Navigation className="w-3 h-3" />{delivery.direction}
            </span>
          )}
          {show('status') && statusVal && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">{statusVal}</span>
          )}
          {show('payStatus') && payStatusVal && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${payStatusVal === 'Оплачено' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{payStatusVal}</span>
          )}
          {show('payment') && paymentVal && !payStatusVal && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-secondary bg-gray-100">{paymentVal}</span>
          )}
        </div>

        {/* === ROW 3: Note — yellow highlight if present === */}
        {show('note') && delivery.note?.trim() && (
          <div className="ml-10 mb-2.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-highlight text-amber-800 text-xs leading-snug">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span className="line-clamp-2">{delivery.note}</span>
          </div>
        )}

        {/* === ROW 4: Phone (always visible, prominent) === */}
        {show('phone') && delivery.phone && (
          <div className="ml-10 mb-3 text-sm font-semibold text-text flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-brand" />{delivery.phone}
          </div>
        )}

        {/* === ACTIONS: One primary + secondary icons === */}
        <div className="flex items-center gap-2 ml-10">
          {/* Primary CTA */}
          <button onClick={() => doStatus(status === 'pending' ? 'in-progress' : 'completed')}
            className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl cursor-pointer active:scale-[0.97] transition-transform shadow-sm shadow-brand/20 text-center">
            {status === 'pending' ? 'В роботу' : status === 'in-progress' ? 'Завершити' : 'Готово ✓'}
          </button>
          {/* Secondary actions — icon-only */}
          <IconBtn icon={Phone} title="Дзвонити" onClick={() => { window.location.href = `tel:${delivery.phone}`; }} />
          <IconBtn icon={MapPin} title="Карта" onClick={navigate} />
          <IconBtn icon={expanded ? ChevronUp : ChevronDown} title="Деталі" onClick={() => setExpanded(!expanded)} />
        </div>

        {/* === STATUS ROW: small, understated === */}
        <div className="flex gap-1 mt-2 ml-10">
          <MiniBtn icon={RotateCw} c="text-blue-500" onClick={() => doStatus('in-progress')} />
          <MiniBtn icon={CheckCircle2} c="text-emerald-500" onClick={() => doStatus('completed')} />
          <MiniBtn icon={XCircle} c="text-red-400" onClick={() => { setShowCancel(true); setExpanded(true); }} />
          <MiniBtn icon={Undo2} c="text-muted" onClick={doUndo} disabled={!canUndo} />
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div className="border-t border-border bg-bg px-4 py-3 space-y-1.5">
          <D l="ПІБ" v={delivery.name} /><D l="Номер" v={`${delivery.internalNumber}${delivery.id ? ' / ' + delivery.id : ''}`} />
          {delivery.vo && <D l="ВО" v={delivery.vo} />}<D l="Адреса" v={delivery.address} />
          <D l="ТТН" v={delivery.ttn} /><D l="Вага" v={delivery.weight} />
          {delivery.direction && <D l="Напрямок" v={delivery.direction} />}
          <D l="Телефон" v={delivery.phone} />{delivery.registrarPhone && <D l="Тел. реєстр." v={delivery.registrarPhone} />}
          {priceVal && <D l="Сума" v={'€' + priceVal} />}{paymentVal && <D l="Оплата" v={paymentVal} />}
          {payStatusVal && <D l="Статус оплати" v={payStatusVal} />}
          {delivery.timing && <D l="Таймінг" v={delivery.timing} />}
          {delivery.createdAt && <D l="Оформлено" v={delivery.createdAt} />}
          {delivery.receiveDate && <D l="Отримано" v={delivery.receiveDate} />}
          {delivery.smsNote?.trim() && <D l="SMS" v={delivery.smsNote} />}
          {delivery.photo?.startsWith('http') && (
            <a href={delivery.photo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold pt-1"><Image className="w-3.5 h-3.5" />Фото</a>
          )}
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

function IconBtn({ icon: I, title, onClick }: { icon: typeof Phone; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={title}
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
