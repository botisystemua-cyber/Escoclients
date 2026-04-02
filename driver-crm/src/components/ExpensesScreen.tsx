import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, RefreshCw, Plus, Trash2, Fuel, UtensilsCrossed,
  ParkingCircle, Route, AlertTriangle, Landmark, Smartphone,
  HelpCircle, Receipt, X,
} from 'lucide-react';
import { useApp } from '../store/useAppStore';
import { fetchExpenses, addExpense, deleteExpense } from '../api';
import type { ExpenseItem, ExpenseAdvance, ExpenseCategory } from '../types';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: typeof Fuel; color: string; bg: string }[] = [
  { key: 'fuel', label: 'Бензин', icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'food', label: 'Їжа', icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'parking', label: 'Паркування', icon: ParkingCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'toll', label: 'Толл', icon: Route, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'fine', label: 'Штраф', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'customs', label: 'Митниця', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'topUp', label: 'Поповнення', icon: Smartphone, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'other', label: 'Інше', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
  { key: 'tips', label: 'Чайові', icon: Receipt, color: 'text-pink-600', bg: 'bg-pink-50' },
];

function getCat(key: string) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[7];
}

interface TaggedExpense extends ExpenseItem {
  _routeName: string;
}

export function ExpensesScreen() {
  const { currentSheet, driverName, isUnifiedView, routes, showToast, setCurrentScreen } = useApp();

  const [items, setItems] = useState<TaggedExpense[]>([]);
  const [advances, setAdvances] = useState<Record<string, ExpenseAdvance | null>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const routeNames = isUnifiedView ? routes.map((r) => r.name) : [currentSheet];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        routeNames.map(async (rn) => {
          const data = await fetchExpenses(rn);
          return {
            routeName: rn,
            items: data.items.filter((e) => e.driver === driverName).map((e) => ({ ...e, _routeName: rn })),
            advance: data.advance,
          };
        })
      );

      const allItems: TaggedExpense[] = [];
      const advMap: Record<string, ExpenseAdvance | null> = {};

      for (const r of results) {
        if (r.status === 'fulfilled') {
          allItems.push(...r.value.items);
          advMap[r.value.routeName] = r.value.advance;
        }
      }

      setItems(allItems);
      setAdvances(advMap);
    } catch (err) {
      showToast('Помилка: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSheet, isUnifiedView, routes.length, driverName, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Grand totals
  const totalsByCurrency: Record<string, number> = {};
  items.forEach((e) => { totalsByCurrency[e.currency] = (totalsByCurrency[e.currency] || 0) + e.amount; });
  const currencyEntries = Object.entries(totalsByCurrency);

  // Per-route totals
  const perRouteTotals: Record<string, Record<string, number>> = {};
  if (isUnifiedView) {
    for (const rn of routeNames) {
      perRouteTotals[rn] = {};
    }
    items.forEach((e) => {
      if (!perRouteTotals[e._routeName]) perRouteTotals[e._routeName] = {};
      perRouteTotals[e._routeName][e.currency] = (perRouteTotals[e._routeName][e.currency] || 0) + e.amount;
    });
  }

  // Advance calculation (sum of all routes in unified)
  const advanceTotal = Object.values(advances).reduce((sum, adv) => {
    if (!adv) return sum;
    return sum + adv.cash + adv.card;
  }, 0);

  const advanceTotalSpent = Object.values(advances).reduce((sum, adv) => {
    if (!adv) return sum;
    const cashSpent = totalsByCurrency[adv.cashCurrency] || 0;
    const cardSpent = totalsByCurrency[adv.cardCurrency] || 0;
    return sum + (adv.cashCurrency === adv.cardCurrency ? cashSpent : cashSpent + cardSpent);
  }, 0);

  // For single route, keep original advance logic
  const singleAdvance = !isUnifiedView ? advances[currentSheet] ?? null : null;
  const singleAdvanceCashSpent = singleAdvance ? (totalsByCurrency[singleAdvance.cashCurrency] || 0) : 0;
  const singleAdvanceCardSpent = singleAdvance ? (totalsByCurrency[singleAdvance.cardCurrency] || 0) : 0;
  const singleAdvanceTotal = singleAdvance ? singleAdvance.cash + singleAdvance.card : 0;
  const singleTotalSpent = singleAdvance
    ? (singleAdvance.cashCurrency === singleAdvance.cardCurrency
        ? singleAdvanceCashSpent
        : singleAdvanceCashSpent + singleAdvanceCardSpent)
    : 0;
  const singleRemaining = singleAdvanceTotal - singleTotalSpent;

  const handleDelete = async (item: TaggedExpense) => {
    try {
      const res = await deleteExpense({ routeName: item._routeName, rowNum: String(item.rowNum), driverName });
      if (res.success) {
        showToast('Видалено');
        loadData();
      } else {
        showToast('Помилка: ' + (res.error || ''));
      }
    } catch (err) {
      showToast('Помилка: ' + (err as Error).message);
    }
  };

  const handleAdd = async (category: ExpenseCategory, amount: string, currency: string, description: string, routeName: string) => {
    try {
      const res = await addExpense({ routeName, driverName, category, amount, currency, description });
      if (res.success) {
        showToast('Додано!');
        setShowAdd(false);
        loadData();
      } else {
        showToast('Помилка: ' + (res.error || ''));
      }
    } catch (err) {
      showToast('Помилка: ' + (err as Error).message);
    }
  };

  const headerLabel = isUnifiedView ? 'Усі маршрути' : currentSheet.replace('Маршрут_', 'М');

  return (
    <div className="flex-1 flex flex-col bg-bg max-h-dvh overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setCurrentScreen('list')} className="p-2 -ml-2 rounded-xl hover:bg-bg cursor-pointer active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5 text-text" />
            </button>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand" />
              <span className="text-sm font-bold text-text">Витрати — {headerLabel}</span>
            </div>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl hover:bg-bg cursor-pointer active:scale-95 transition-all">
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-7 h-7 text-brand animate-spin mb-3" />
            <p className="text-muted text-sm">Завантаження...</p>
          </div>
        ) : (
          <>
            {/* Grand summary card */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Всього витрат</div>
                  {currencyEntries.length === 0 ? (
                    <div className="text-2xl font-black text-text">0</div>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {currencyEntries.map(([cur, sum]) => (
                        <div key={cur} className="text-xl font-black text-text">
                          {sum.toFixed(2)} <span className="text-sm text-muted font-bold">{cur}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Записів</div>
                  <div className="text-2xl font-black text-muted">{items.length}</div>
                </div>
              </div>

              {/* Per-route breakdown (unified view only) */}
              {isUnifiedView && routeNames.length > 1 && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {routeNames.map((rn) => {
                    const totals = perRouteTotals[rn] || {};
                    const entries = Object.entries(totals);
                    const count = items.filter((e) => e._routeName === rn).length;
                    return (
                      <div key={rn} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted">{rn.replace('Маршрут_', 'Маршрут ')}</span>
                        <div className="flex items-center gap-3">
                          {entries.length === 0 ? (
                            <span className="text-xs text-gray-300">0</span>
                          ) : (
                            entries.map(([cur, sum]) => (
                              <span key={cur} className="text-xs font-bold text-text">
                                {sum.toFixed(2)} <span className="text-muted">{cur}</span>
                              </span>
                            ))
                          )}
                          <span className="text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Advance - single route */}
              {!isUnifiedView && singleAdvanceTotal > 0 && singleAdvance && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Аванс</div>
                    <div className="text-sm font-bold text-text">
                      {singleAdvance.cash > 0 && <span>{singleAdvance.cash} {singleAdvance.cashCurrency}</span>}
                      {singleAdvance.cash > 0 && singleAdvance.card > 0 && <span className="text-muted"> + </span>}
                      {singleAdvance.card > 0 && <span>{singleAdvance.card} {singleAdvance.cardCurrency}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Залишок</div>
                    <div className={`text-lg font-black ${singleRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {singleRemaining.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Advance - unified view */}
              {isUnifiedView && advanceTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Аванс (усі)</div>
                    <div className="text-sm font-bold text-text">
                      {Object.values(advances).filter(Boolean).map((adv, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-muted"> + </span>}
                          {adv!.cash > 0 && <span>{adv!.cash} {adv!.cashCurrency}</span>}
                          {adv!.cash > 0 && adv!.card > 0 && <span className="text-muted"> + </span>}
                          {adv!.card > 0 && <span>{adv!.card} {adv!.cardCurrency}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Залишок</div>
                    <div className={`text-lg font-black ${advanceTotal - advanceTotalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(advanceTotal - advanceTotalSpent).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expense cards */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Receipt className="w-10 h-10 text-border mb-3" strokeWidth={1} />
                <p className="text-muted text-sm">Немає витрат</p>
                <p className="text-muted text-xs mt-1">Натисни + щоб додати</p>
              </div>
            ) : (
              items.map((item) => {
                const cat = getCat(item.category);
                const Icon = cat.icon;
                return (
                  <div key={`${item._routeName}_${item.expId || item.rowNum}`} className="bg-white rounded-2xl border border-border p-3.5 flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-text">{cat.label}</span>
                        {isUnifiedView && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            {item._routeName.replace('Маршрут_', 'М')}
                          </span>
                        )}
                      </div>
                      {item.description && <div className="text-[11px] text-muted truncate">{item.description}</div>}
                      <div className="text-[10px] text-muted mt-0.5">{item.dateTrip}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-text">{item.amount}</div>
                      <div className="text-[10px] font-semibold text-muted">{item.currency}</div>
                    </div>
                    <button onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl hover:bg-red-50 cursor-pointer active:scale-90 transition-all shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Add button */}
      {!loading && (
        <div className="shrink-0 bg-white border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={() => setShowAdd(true)}
            className="w-full py-3.5 rounded-2xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all">
            <Plus className="w-5 h-5" />
            Додати витрату
          </button>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          routeNames={routeNames}
          isUnifiedView={isUnifiedView}
          defaultRoute={currentSheet || routeNames[0]}
        />
      )}
    </div>
  );
}

// ---- Add Expense Modal ----
function AddExpenseModal({ onClose, onAdd, routeNames, isUnifiedView, defaultRoute }: {
  onClose: () => void;
  onAdd: (category: ExpenseCategory, amount: string, currency: string, description: string, routeName: string) => void;
  routeNames: string[];
  isUnifiedView: boolean;
  defaultRoute: string;
}) {
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CHF');
  const [description, setDescription] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(defaultRoute);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    await onAdd(category, amount, currency, description, selectedRoute);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold text-text">Нова витрата</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {/* Route selector (unified view) */}
          {isUnifiedView && (
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Маршрут</div>
              <div className="flex gap-1.5">
                {routeNames.map((rn) => (
                  <button key={rn} onClick={() => setSelectedRoute(rn)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                      selectedRoute === rn ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                    }`}>{rn.replace('Маршрут_', 'М')}</button>
                ))}
              </div>
            </div>
          )}

          {/* Category grid */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Категорія</div>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                      active ? `${c.bg} ${c.color} ring-2 ring-current` : 'bg-gray-50 text-gray-400'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Сума</div>
            <input
              autoFocus
              type="text" inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
              placeholder="0.00"
              className="w-full text-xl font-black text-text bg-gray-50 rounded-xl px-3 py-3 border border-border focus:border-brand focus:outline-none"
            />
          </div>

          {/* Currency */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Валюта</div>
            <div className="flex gap-1.5">
              {['UAH', 'EUR', 'CHF', 'PLN', 'USD'].map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    currency === c ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Опис (необов'язково)</div>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Заправка Shell, обід..."
              className="w-full text-sm text-text bg-gray-50 rounded-xl px-3 py-2.5 border border-border focus:border-brand focus:outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="px-3 py-3 border-t border-gray-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={handleSubmit} disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 rounded-2xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-40">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Додаю...' : 'Додати'}
          </button>
        </div>
      </div>
    </div>
  );
}
