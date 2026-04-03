import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Trash2, X, Save, MapPin } from 'lucide-react';
import { API_URL } from './shared';

interface RouteAccess {
  rowNum: number;
  accessId: string;
  staffId: string;
  staffName: string;
  role: string;
  route: string;
  rteId: string;
  dateFrom: string;
  dateTo: string;
  level: string;
  grantedBy: string;
  dateGranted: string;
  status: string;
  note: string;
}

export function RouteAccessTab() {
  const [items, setItems] = useState<RouteAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getRouteAccess' }),
      });
      const data = await res.json();
      if (data.success) setItems(data.access || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item: RouteAccess) => {
    if (!confirm(`Видалити доступ ${item.staffName} до ${item.route}?`)) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteRouteAccess', accessId: item.accessId, rowNum: item.rowNum }),
      });
      const data = await res.json();
      if (data.success) load();
      else alert('Помилка: ' + (data.error || ''));
    } catch { alert('Помилка мережі'); }
  };

  const handleAdd = async (form: Record<string, string>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addRouteAccess', access: form }),
      });
      const data = await res.json();
      if (data.success) { setShowAdd(false); load(); }
      else alert('Помилка: ' + (data.error || ''));
    } catch { alert('Помилка мережі'); }
  };

  const getLevelBg = (level: string) => {
    if (level.includes('Повний')) return 'bg-violet-50 text-violet-600';
    if (level.includes('Запис')) return 'bg-blue-50 text-blue-600';
    return 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{items.length} доступів</span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-white cursor-pointer transition-all">
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer hover:brightness-110 transition-all">
            <Plus className="w-4 h-4" /> Додати
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted text-sm"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Завантаження...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">Немає записів</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.accessId || i} className="bg-white rounded-2xl border border-border p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-text">{item.staffName}</span>
                  <span className="text-[10px] font-bold text-muted bg-gray-100 px-2 py-0.5 rounded-full">{item.role}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-bold text-indigo-600">{item.route}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLevelBg(item.level)}`}>{item.level}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Активний' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{item.status}</span>
                </div>
                {item.dateFrom && <div className="text-[10px] text-muted mt-0.5">{item.dateFrom}{item.dateTo ? ` — ${item.dateTo}` : ' — безстроково'}</div>}
              </div>
              <button onClick={() => handleDelete(item)}
                className="p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-all shrink-0">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddAccessModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}

function AddAccessModal({ onClose, onSave }: { onClose: () => void; onSave: (form: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    staffName: '', role: 'Водій', route: '', level: 'Читання + Запис', status: 'Активний', note: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.staffName.trim() || !form.route.trim()) { alert('ПІБ та Маршрут обов\'язкові'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h2 className="text-lg font-extrabold text-text">Новий доступ</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg cursor-pointer"><X className="w-5 h-5 text-muted" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="ПІБ персоналу" value={form.staffName} onChange={v => setForm(p => ({ ...p, staffName: v }))} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Роль</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:border-brand">
                <option>Водій</option><option>Менеджер</option>
              </select>
            </div>
            <Field label="Маршрут" value={form.route} onChange={v => setForm(p => ({ ...p, route: v }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Рівень доступу</label>
            <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:border-brand">
              <option>Читання</option><option>Читання + Запис</option><option>Повний</option>
            </select>
          </div>
          <Field label="Примітка" value={form.note} onChange={v => setForm(p => ({ ...p, note: v }))} />
        </div>
        <div className="px-5 py-4 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={submit} disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-all disabled:opacity-40">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Збереження...' : 'Додати'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} autoFocus={autoFocus}
        className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:border-brand transition-all" />
    </div>
  );
}
