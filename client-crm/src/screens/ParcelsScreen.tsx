import { useState } from 'react';
import { Package, MapPin, Phone, FileText, Weight, Hash, Banknote, Loader2, User } from 'lucide-react';
import { createOrder } from '../lib/api';
import Modal from '../components/Modal';
import type { Screen } from '../types';

interface Props {
  cliId: string;
  onNavigate: (screen: Screen) => void;
}

const CURRENCIES = ['UAH', 'EUR', 'CHF', 'USD', 'PLN', 'CZK'];

const CONTENT_CATEGORIES = [
  { id: 'clothes', label: 'Особисті речі', icon: '👕' },
  { id: 'food', label: 'Продукти', icon: '🍪' },
  { id: 'goods', label: 'Товар', icon: '📦' },
  { id: 'tech', label: 'Техніка', icon: '⚙️' },
  { id: 'docs', label: 'Документи', icon: '📄' },
  { id: 'meds', label: 'Ліки', icon: '💊' },
  { id: 'other', label: 'Інше', icon: '🧾' },
];

const emptyFormUaEu = {
  direction: 'UA → EU',
  recipient_name: '',
  phone_recipient: '',
  addr_europe: '',
  ttn: '',
  weight: '',
  estimated_value: '',
  qty: '',
  amount: '',
  currency: 'EUR',
  note: '',
};

const emptyFormEuUa = {
  direction: 'EU → UA',
  sender_name: '',
  phone_sender: '',
  addr_sender: '',
  estimated_value: '',
  weight: '',
  recipient_name: '',
  phone_recipient: '',
  delivery_type: 'nova_poshta' as 'nova_poshta' | 'address',
  np_city: '',
  np_branch: '',
  addr_city: '',
  addr_street: '',
  addr_house: '',
  addr_apt: '',
  note: '',
};

export default function ParcelsScreen({ cliId, onNavigate }: Props) {
  const [direction, setDirection] = useState<'UA → EU' | 'EU → UA'>('UA → EU');
  const [formUa, setFormUa] = useState(emptyFormUaEu);
  const [formEu, setFormEu] = useState(emptyFormEuUa);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setErrors(prev => ({ ...prev, description: false }));
    setError('');
  };

  const buildDescription = () => {
    const labels = selectedCategories
      .map(id => {
        if (id === 'other') return otherText.trim() ? `Інше: ${otherText.trim()}` : 'Інше';
        return CONTENT_CATEGORIES.find(c => c.id === id)?.label || '';
      })
      .filter(Boolean);
    return labels.join(', ');
  };

  const updateUa = (k: string, v: string) => {
    setFormUa(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: false }));
    setError('');
  };

  const updateEu = (k: string, v: string) => {
    setFormEu(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: false }));
    setError('');
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 border ${errors[field] ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: Record<string, boolean> = {};

    let payload: Record<string, string> = {};

    if (direction === 'UA → EU') {
      if (!formUa.recipient_name) errs.recipient_name = true;
      if (!formUa.phone_recipient) errs.phone_recipient = true;
      if (!formUa.addr_europe) errs.addr_europe = true;
      if (Object.keys(errs).length) { setErrors(errs); return; }

      payload = {
        direction: 'UA → EU',
        recipient_name: formUa.recipient_name,
        phone_recipient: formUa.phone_recipient,
        addr_europe: formUa.addr_europe,
        ttn: formUa.ttn,
        weight: formUa.weight,
        estimated_value: formUa.estimated_value,
        description: buildDescription(),
        qty: formUa.qty,
        amount: formUa.amount,
        currency: formUa.currency,
        note: formUa.note,
      };
    } else {
      if (!formEu.sender_name) errs.sender_name = true;
      if (!formEu.phone_sender) errs.phone_sender = true;
      if (!formEu.addr_sender) errs.addr_sender = true;
      if (!formEu.recipient_name) errs.recipient_name = true;
      if (!formEu.phone_recipient) errs.phone_recipient = true;
      if (formEu.delivery_type === 'nova_poshta' && (!formEu.np_city || !formEu.np_branch)) {
        if (!formEu.np_city) errs.np_city = true;
        if (!formEu.np_branch) errs.np_branch = true;
      }
      if (formEu.delivery_type === 'address' && (!formEu.addr_city || !formEu.addr_street || !formEu.addr_house)) {
        if (!formEu.addr_city) errs.addr_city = true;
        if (!formEu.addr_street) errs.addr_street = true;
        if (!formEu.addr_house) errs.addr_house = true;
      }
      if (Object.keys(errs).length) { setErrors(errs); return; }

      const deliveryAddr = formEu.delivery_type === 'nova_poshta'
        ? `НП: ${formEu.np_city}, ${formEu.np_branch}`
        : `${formEu.addr_city}, ${formEu.addr_street}, ${formEu.addr_house}${formEu.addr_apt ? ', кв.' + formEu.addr_apt : ''}`;

      payload = {
        direction: 'EU → UA',
        sender_name: formEu.sender_name,
        phone_sender: formEu.phone_sender,
        addr_sender: formEu.addr_sender,
        estimated_value: formEu.estimated_value,
        weight: formEu.weight,
        recipient_name: formEu.recipient_name,
        phone_recipient: formEu.phone_recipient,
        delivery_addr: deliveryAddr,
        delivery_type: formEu.delivery_type,
        note: formEu.note,
      };
    }

    setLoading(true);
    try {
      await createOrder(cliId, payload);
      setShowModal(true);
      setFormUa(emptyFormUaEu);
      setFormEu(emptyFormEuUa);
      setSelectedCategories([]);
      setOtherText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка відправки');
    } finally {
      setLoading(false);
    }
  };

  const switchDirection = (dir: 'UA → EU' | 'EU → UA') => {
    setDirection(dir);
    setErrors({});
    setError('');
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Посилки</h1>
        <p className="text-blue-200/60 text-xs md:text-sm">Відправка посилок Україна - Європа</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-3 pb-6 space-y-3 md:max-w-2xl md:mx-auto md:mt-6">
        {/* Direction selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Напрям</p>
          <div className="flex gap-2">
            {(['UA → EU', 'EU → UA'] as const).map(dir => (
              <button
                key={dir}
                type="button"
                onClick={() => switchDirection(dir)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                  direction === dir ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        {/* UA → EU form */}
        {direction === 'UA → EU' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-navy mb-1">Отримувач в Європі</p>

            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="ПІБ отримувача *" value={formUa.recipient_name}
                onChange={e => updateUa('recipient_name', e.target.value)} className={`${inputCls('recipient_name')} pl-10`} />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Телефон отримувача *" type="tel" value={formUa.phone_recipient}
                onChange={e => updateUa('phone_recipient', e.target.value)} className={`${inputCls('phone_recipient')} pl-10`} />
            </div>

            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Адреса в Європі *" value={formUa.addr_europe}
                onChange={e => updateUa('addr_europe', e.target.value)} className={`${inputCls('addr_europe')} pl-10`} />
            </div>

            <div className="relative">
              <Hash size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Номер ТТН" value={formUa.ttn}
                onChange={e => updateUa('ttn', e.target.value)} className={`${inputCls('ttn')} pl-10`} />
            </div>

            <p className="text-xs font-semibold text-navy mt-2 mb-1">Деталі посилки</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Weight size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input placeholder="Вага (кг)" value={formUa.weight}
                  onChange={e => updateUa('weight', e.target.value)} className={`${inputCls('weight')} pl-10`} />
              </div>
              <input placeholder="К-сть позицій" value={formUa.qty}
                onChange={e => updateUa('qty', e.target.value)} className={inputCls('qty')} />
            </div>

            <div className="relative">
              <Banknote size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Оціночна вартість (EUR)" value={formUa.estimated_value}
                onChange={e => updateUa('estimated_value', e.target.value)} className={`${inputCls('estimated_value')} pl-10`} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><FileText size={14} /> Що передаєте?</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-accent/50'
                    }`}
                  >{cat.icon} {cat.label}</button>
                ))}
              </div>
              {selectedCategories.includes('other') && (
                <input placeholder="Вкажіть що саме..." value={otherText}
                  onChange={e => { setOtherText(e.target.value); setError(''); }}
                  className={`${inputCls('otherText')} mt-2`} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Сума" value={formUa.amount}
                onChange={e => updateUa('amount', e.target.value)} className={inputCls('amount')} />
              <select value={formUa.currency} onChange={e => updateUa('currency', e.target.value)}
                className={inputCls('currency')}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <textarea placeholder="Примітка" value={formUa.note} onChange={e => updateUa('note', e.target.value)}
              rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition resize-none" />
          </div>
        )}

        {/* EU → UA form */}
        {direction === 'EU → UA' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-navy mb-1">Відправник в Європі</p>

            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="ПІБ відправника *" value={formEu.sender_name}
                onChange={e => updateEu('sender_name', e.target.value)} className={`${inputCls('sender_name')} pl-10`} />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Телефон відправника *" type="tel" value={formEu.phone_sender}
                onChange={e => updateEu('phone_sender', e.target.value)} className={`${inputCls('phone_sender')} pl-10`} />
            </div>

            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Адреса відправника (Європа) *" value={formEu.addr_sender}
                onChange={e => updateEu('addr_sender', e.target.value)} className={`${inputCls('addr_sender')} pl-10`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Banknote size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input placeholder="Оцін. вартість EUR" value={formEu.estimated_value}
                  onChange={e => updateEu('estimated_value', e.target.value)} className={`${inputCls('estimated_value')} pl-10`} />
              </div>
              <div className="relative">
                <Weight size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input placeholder="Вага (кг)" value={formEu.weight}
                  onChange={e => updateEu('weight', e.target.value)} className={`${inputCls('weight')} pl-10`} />
              </div>
            </div>

            <p className="text-xs font-semibold text-navy mt-2 mb-1">Отримувач в Україні</p>

            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="ПІБ отримувача *" value={formEu.recipient_name}
                onChange={e => updateEu('recipient_name', e.target.value)} className={`${inputCls('recipient_name')} pl-10`} />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input placeholder="Телефон отримувача *" type="tel" value={formEu.phone_recipient}
                onChange={e => updateEu('phone_recipient', e.target.value)} className={`${inputCls('phone_recipient')} pl-10`} />
            </div>

            <p className="text-xs font-semibold text-navy mt-2 mb-1">Доставка</p>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => updateEu('delivery_type', 'nova_poshta')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  formEu.delivery_type === 'nova_poshta' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}>Нова Пошта</button>
              <button type="button" onClick={() => updateEu('delivery_type', 'address')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  formEu.delivery_type === 'address' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                }`}>Адресна доставка</button>
            </div>

            {formEu.delivery_type === 'nova_poshta' ? (
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Місто *" value={formEu.np_city}
                  onChange={e => updateEu('np_city', e.target.value)} className={inputCls('np_city')} />
                <input placeholder="Відділення *" value={formEu.np_branch}
                  onChange={e => updateEu('np_branch', e.target.value)} className={inputCls('np_branch')} />
              </div>
            ) : (
              <div className="space-y-3">
                <input placeholder="Місто *" value={formEu.addr_city}
                  onChange={e => updateEu('addr_city', e.target.value)} className={inputCls('addr_city')} />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="Вулиця *" value={formEu.addr_street}
                    onChange={e => updateEu('addr_street', e.target.value)} className={`${inputCls('addr_street')} col-span-2`} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Буд *" value={formEu.addr_house}
                      onChange={e => updateEu('addr_house', e.target.value)} className={inputCls('addr_house')} />
                    <input placeholder="Кв" value={formEu.addr_apt}
                      onChange={e => updateEu('addr_apt', e.target.value)} className={inputCls('addr_apt')} />
                  </div>
                </div>
              </div>
            )}

            <textarea placeholder="Примітка" value={formEu.note} onChange={e => updateEu('note', e.target.value)}
              rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition resize-none" />
          </div>
        )}

        {error && <p className="text-red-500 text-xs pl-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-accent text-white font-bold rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-accent/30 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> Відправка...</>
          ) : (
            <><Package size={18} /> Відправити посилку</>
          )}
        </button>
      </form>

      {showModal && (
        <Modal
          title="Замовлення створено!"
          subtitle="Менеджер зв'яжеться з вами для уточнення деталей"
          onClose={() => { setShowModal(false); onNavigate('orders'); }}
        />
      )}
    </div>
  );
}
