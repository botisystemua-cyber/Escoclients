import { useState } from 'react';
import { Package, MapPin, Phone, FileText, Weight, Loader2 } from 'lucide-react';
import { createOrder } from '../lib/api';
import Modal from '../components/Modal';
import type { Screen } from '../types';

interface Props {
  cliId: string;
  onNavigate: (screen: Screen) => void;
}

export default function ParcelsScreen({ cliId, onNavigate }: Props) {
  const [form, setForm] = useState({
    direction: 'UA → EU',
    addr_sender: '',
    addr_recipient: '',
    phone_recipient: '',
    weight: '',
    description: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const update = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: false }));
    setError('');
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 border ${errors[field] ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errs: Record<string, boolean> = {};
    if (!form.addr_sender) errs.addr_sender = true;
    if (!form.addr_recipient) errs.addr_recipient = true;
    if (!form.phone_recipient) errs.phone_recipient = true;
    if (!form.description) errs.description = true;
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await createOrder(cliId, form);
      setShowModal(true);
      setForm({ direction: 'UA → EU', addr_sender: '', addr_recipient: '', phone_recipient: '', weight: '', description: '', note: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка відправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Посилки</h1>
        <p className="text-blue-200/60 text-xs md:text-sm">Відправка посилок Україна - Європа</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-3 pb-6 space-y-3 md:max-w-2xl md:mx-auto md:mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-2">Напрям</p>
            <div className="flex gap-2">
              {['UA → EU', 'EU → UA'].map(dir => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => update('direction', dir)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                    form.direction === dir ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              placeholder="Адреса відправника *"
              value={form.addr_sender}
              onChange={e => update('addr_sender', e.target.value)}
              className={`${inputCls('addr_sender')} pl-10`}
            />
          </div>

          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              placeholder="Адреса отримувача *"
              value={form.addr_recipient}
              onChange={e => update('addr_recipient', e.target.value)}
              className={`${inputCls('addr_recipient')} pl-10`}
            />
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              placeholder="Телефон отримувача *"
              type="tel"
              value={form.phone_recipient}
              onChange={e => update('phone_recipient', e.target.value)}
              className={`${inputCls('phone_recipient')} pl-10`}
            />
          </div>

          <div className="relative">
            <Weight size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              placeholder="Вага (кг)"
              value={form.weight}
              onChange={e => update('weight', e.target.value)}
              className={`${inputCls('weight')} pl-10`}
            />
          </div>

          <div className="relative">
            <FileText size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              placeholder="Опис вмісту *"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className={`${inputCls('description')} pl-10`}
            />
          </div>

          <textarea
            placeholder="Примітка"
            value={form.note}
            onChange={e => update('note', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs pl-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-accent text-white font-bold rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-accent/30 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Відправка...
            </>
          ) : (
            <>
              <Package size={18} />
              Відправити посилку
            </>
          )}
        </button>
      </form>

      {showModal && (
        <Modal
          title="Замовлення створено!"
          subtitle="Менеджер зв'яжеться з вами для уточнення деталей"
          onClose={() => {
            setShowModal(false);
            onNavigate('orders');
          }}
        />
      )}
    </div>
  );
}
