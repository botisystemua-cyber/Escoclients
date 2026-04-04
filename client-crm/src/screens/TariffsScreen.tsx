import { useState } from 'react';
import { ArrowLeft, Package, Users, MapPin, AlertTriangle, Info } from 'lucide-react';
import type { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

type Tab = 'parcels' | 'passengers' | 'points' | 'rules';

const PARCEL_POINTS = [
  { city: 'Цюрих', addr: 'Parking Theater 11, Dorflistrasse 90, 8050 Zürich' },
  { city: 'Цуг', addr: 'Bahnhofplatz, 6300 Zug' },
  { city: 'Люцерн', addr: 'Tourist Bus Parking Landenberg, Alpenquai, 6005 Luzern' },
  { city: 'Берн', addr: 'Parkplatz 7c, Beundenfeld, 3014 Bern' },
  { city: 'Базель', addr: 'Meret Oppenheim Strasse, SBB Station, 4053 Basel' },
  { city: 'Сен-Гален', addr: 'Bahnhofplatz 8b, 9000 St. Gallen' },
  { city: 'Лозана', addr: 'Avenue du Grey 43, 1004 Lausanne' },
  { city: 'Монтре', addr: 'Route des Châtaigniers 7, 1816 Montreux' },
  { city: 'Женева', addr: 'P+R Bout-du-Monde, Route de Vessy 12, 1206 Genève' },
];

const PASSENGER_PARKING = [
  { city: 'Цюрих (ночівля)', addr: 'Im Gsteig 1, Küsnacht ZH 8700 (Sonnenhof)' },
  { city: 'Цюрих (паркінг)', addr: 'Dorflistrasse 90, 8050 Zürich (Parking Theater 11)' },
  { city: 'Цуг', addr: 'Bahnhofplatz, 6300 Zug' },
  { city: 'Люцерн', addr: 'Tourist Bus Parking Landenberg, Alpenquai, 6005 Luzern' },
  { city: 'Берн', addr: 'Parkplatz 7c, Beundenfeld, 3014 Bern' },
  { city: 'Базель', addr: 'Meret Oppenheim Strasse, SBB Station, 4053 Basel' },
  { city: 'Сен-Гален', addr: 'Bahnhofplatz 8b, 9000 St. Gallen' },
  { city: 'Женева (ночівля)', addr: 'Avenue des Roses 13, 1009 Pully' },
  { city: 'Лозана', addr: 'Avenue du Grey 43, 1004 Lausanne' },
  { city: 'Монтре', addr: 'Route des Châtaigniers 7, 1816 Montreux' },
  { city: 'Женева (P+R)', addr: 'P+R Bout-du-Monde, Route de Vessy 12, 1206 Genève' },
];

const STATIONS_FR = [
  { city: 'Geneva', addr: 'Gare de Genève-Cornavin' },
  { city: 'Nyon', addr: 'Gare de Nyon' },
  { city: 'Lausanne', addr: 'Gare de Lausanne' },
  { city: 'Vevey', addr: 'Gare de Vevey' },
  { city: 'Montreux', addr: 'Gare de Montreux' },
  { city: 'Yverdon', addr: 'Gare d\'Yverdon-les-Bains' },
  { city: 'Fribourg', addr: 'Gare de Fribourg' },
  { city: 'Payerne', addr: 'Gare de Payerne' },
  { city: 'Bern', addr: 'Bern Bahnhof' },
];

const STATIONS_DE = [
  { city: 'Oftringen', addr: 'Bahnhof Oftringen' },
  { city: 'Aarau', addr: 'Bahnhof Aarau' },
  { city: 'Baden', addr: 'Bahnhof Baden' },
  { city: 'Wettingen', addr: 'Bahnhof Wettingen' },
  { city: 'Zürich HB', addr: 'Zürich HB' },
  { city: 'Winterthur', addr: 'Bahnhof Winterthur' },
  { city: 'Wil', addr: 'Bahnhof Wil SG' },
  { city: 'St. Gallen', addr: 'Bahnhof St. Gallen' },
];

export default function TariffsScreen({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('parcels');

  const tabCls = (t: Tab) =>
    `flex-1 py-2 text-xs font-semibold rounded-xl transition ${tab === t ? 'bg-accent text-white' : 'text-gray-500'}`;

  const renderAddressTable = (title: string, items: { city: string; addr: string }[]) => (
    <div className="mt-3">
      <p className="text-xs font-bold text-navy mb-2">{title}</p>
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-semibold text-gray-500">Місто</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-500">Адреса</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.city} className={i % 2 ? 'bg-gray-50/50' : ''}>
                <td className="px-3 py-2 text-navy font-medium whitespace-nowrap">{r.city}</td>
                <td className="px-3 py-2 text-gray-600">{r.addr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="bg-navy px-4 pt-6 pb-5 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-6">
        <button onClick={() => onNavigate('home')} className="text-blue-200/60 flex items-center gap-1 mb-3 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-xl font-bold text-white">Тарифи та умови</h1>
      </div>

      {/* Tab selector */}
      <div className="px-4 -mt-3 md:px-10 md:mt-4">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
          <button onClick={() => setTab('parcels')} className={tabCls('parcels')}>Посилки</button>
          <button onClick={() => setTab('passengers')} className={tabCls('passengers')}>Пасажири</button>
          <button onClick={() => setTab('points')} className={tabCls('points')}>Точки</button>
          <button onClick={() => setTab('rules')} className={tabCls('rules')}>Правила</button>
        </div>
      </div>

      <div className="px-4 mt-3 pb-6 space-y-3 md:px-10">
        {/* ── ПОСИЛКИ ── */}
        {tab === 'parcels' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Package size={18} className="text-accent" />
                <h2 className="text-sm font-bold text-navy">Тарифи на посилки</h2>
              </div>
              <div className="bg-accent/5 rounded-xl p-3 mb-3">
                <p className="text-lg font-bold text-accent text-center">3 CHF / кг</p>
                <p className="text-[10px] text-gray-400 text-center mt-0.5">базова ціна доставки</p>
              </div>

              <p className="text-xs font-bold text-navy mb-2">Мінімальні ціни заїзду</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <MapPin size={14} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Точка видачі — від 10 CHF</p>
                    <p className="text-[10px] text-gray-500">1 кг = 10 CHF, 4 кг = 12 CHF</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <MapPin size={14} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Великі міста адресно — від 20 CHF</p>
                    <p className="text-[10px] text-gray-500">5 кг = 20 CHF, 7 кг = 21 CHF</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <MapPin size={14} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-navy">Маленькі містечка адресно — від 40 CHF</p>
                    <p className="text-[10px] text-gray-500">8 кг = 40 CHF, 14 кг = 42 CHF</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-500" />
                <p className="text-xs font-bold text-navy">Доставка ліків</p>
              </div>
              <p className="text-xs text-gray-600">Безрецептні ліки понад 5 упакувань (різних чи однакових) — <span className="font-bold text-navy">50 CHF</span></p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-1">Індивідуальний розрахунок</p>
              <p className="text-[11px] text-amber-600">Документи, побутова техніка, велосипед, об'ємні посилки, телевізор, гроші, комерційний вантаж, поліграфія — розраховується індивідуально з менеджером</p>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-100">
              <p className="text-xs font-bold text-red-700 mb-1">Речі дорожчі за 200 EUR оголошуються обов'язково!</p>
            </div>
          </>
        )}

        {/* ── ПАСАЖИРИ ── */}
        {tab === 'passengers' && (
          <>
            {/* UA → EU */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-accent" />
                <h2 className="text-sm font-bold text-navy">Україна → Швейцарія</h2>
              </div>
              <div className="space-y-3">
                {/* Мінімум */}
                <div className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Мінімум</span>
                    <span className="text-sm font-bold text-accent">50 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Ручна поклажа до 2 кг</p>
                    <p>Додатковий багаж — <span className="font-semibold text-red-500">3 CHF/кг</span></p>
                  </div>
                </div>
                {/* Стандарт */}
                <div className="border-2 border-accent/30 rounded-xl p-3 bg-accent/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Стандарт</span>
                    <span className="text-sm font-bold text-accent">130 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Багаж 20 кг</p>
                    <p>Вибір місця</p>
                    <p>Більший вибір міст для прибуття</p>
                    <p>Додатковий багаж — <span className="font-semibold text-emerald-600">1.5 CHF/кг</span></p>
                  </div>
                </div>
                {/* Максимум */}
                <div className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Максимум</span>
                    <span className="text-sm font-bold text-accent">200 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Багаж 30 кг</p>
                    <p>Вибір місця</p>
                    <p>Забір з ЖД вокзалу у Львові</p>
                    <p>Прибуття за адресою у Швейцарії</p>
                    <p>Оплата: Twint, Revolut, Monobank, Приват24</p>
                    <p>Додатковий багаж — <span className="font-semibold text-emerald-600">1 CHF/кг</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* EU → UA */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-accent" />
                <h2 className="text-sm font-bold text-navy">Швейцарія → Україна (Львів)</h2>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Мінімум</span>
                    <span className="text-sm font-bold text-accent">50 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Ручна поклажа до 2 кг</p>
                    <p>Додатковий багаж — <span className="font-semibold text-red-500">3 CHF/кг</span></p>
                  </div>
                </div>
                <div className="border-2 border-accent/30 rounded-xl p-3 bg-accent/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Стандарт</span>
                    <span className="text-sm font-bold text-accent">130 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Багаж 20 кг</p>
                    <p>Вибір місця</p>
                    <p>Більший вибір міст для посадки</p>
                    <p>Додатковий багаж — <span className="font-semibold text-emerald-600">1.5 CHF/кг</span></p>
                  </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Максимум</span>
                    <span className="text-sm font-bold text-accent">200 CHF</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600">
                    <p>Багаж 30 кг</p>
                    <p>Вибір місця</p>
                    <p>Довіз на ЖД вокзал у Львові</p>
                    <p>Забір за адресою у Швейцарії</p>
                    <p>Оплата: Twint, Revolut, Monobank, Приват24</p>
                    <p>Додатковий багаж — <span className="font-semibold text-emerald-600">1 CHF/кг</span></p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ТОЧКИ ── */}
        {tab === 'points' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-accent" />
                <h2 className="text-sm font-bold text-navy">Точки видачі/прийому посилок</h2>
              </div>
              {renderAddressTable('Швейцарія', PARCEL_POINTS)}
              <div className="mt-3 p-2.5 bg-blue-50 rounded-xl">
                <p className="text-[10px] text-blue-700 font-semibold">Україна: Смт. Рудне, Львівська обл., Нова Пошта #1</p>
                <p className="text-[10px] text-blue-600">Отримувач: Цимбала Оксана, +380677175107</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Отримання до пн-вт 12:00. ТТН зареєструвати до вт 15:00</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-accent" />
                <h2 className="text-sm font-bold text-navy">Точки посадки/висадки пасажирів</h2>
              </div>
              {renderAddressTable('Паркінги / Ночівлі', PASSENGER_PARKING)}
              {renderAddressTable('Вокзали — Французька Швейцарія', STATIONS_FR)}
              {renderAddressTable('Вокзали — Німецька Швейцарія', STATIONS_DE)}
            </div>
          </>
        )}

        {/* ── ПРАВИЛА ── */}
        {tab === 'rules' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-bold text-navy">Заборонено: Україна → Швейцарія</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["М'ясні вироби", 'Молочні вироби', 'Тютюнові вироби', 'Алкоголь', 'Не оригінальні бренди', 'Насіння на розсаду', 'Овочі', 'Фрукти', 'Наркотики', 'Зброя', 'Антикваріат'].map(item => (
                  <span key={item} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-medium rounded-lg border border-red-100">{item}</span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-bold text-navy">Заборонено: Швейцарія → Україна</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Алкоголь (більше 1л)', 'Насіння на розсаду', 'Наркотики', 'Зброя'].map(item => (
                  <span key={item} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-medium rounded-lg border border-red-100">{item}</span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2.5">
              <h2 className="text-sm font-bold text-navy">Пакування</h2>
              <p className="text-[11px] text-gray-600">Особисті речі з України у Швейцарію повинні бути у валізах чи сумці (клітчата, АТБ, Ашан — зручна для речей)</p>
              <p className="text-[11px] text-gray-600">У відділення сумки можна запакувати у стрейч або коробку Нової Пошти</p>
              <p className="text-[11px] text-gray-600">Вантаж з Швейцарії в Україну пакувати в коробки не обов'язково</p>
              <p className="text-[11px] text-gray-600">Якщо речі без сумки/валізи — перепаковуємо у наші сумки (<span className="font-bold text-navy">+10 CHF</span>)</p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-100 space-y-2">
              <p className="text-xs font-bold text-amber-700">Зберігання</p>
              <p className="text-[11px] text-amber-600">Не ідентифікована посилка зберігається 3 дні безкоштовно, далі пеня 1 CHF/день. Через 30 днів — утилізація.</p>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-100 space-y-2">
              <p className="text-xs font-bold text-red-700">Митний контроль</p>
              <p className="text-[11px] text-red-600">Всі вантажі перевіряються на двох постах митного контролю. Заборонені речі утилізовуються через 3 дні. Конфісковані речі на кордоні — оплачуються клієнтом (штраф + мито + штраф від фірми).</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
