import { useState } from 'react';
import { Users, ScrollText, MapPin, Wifi, LogOut } from 'lucide-react';
import { Logo, type AuthUser } from './shared';
import { StaffTab } from './StaffTab';
import { LogTab } from './LogTab';
import { RouteAccessTab } from './RouteAccessTab';
import { OnlineTab } from './OnlineTab';

type Tab = 'staff' | 'log' | 'access' | 'online';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'staff', label: 'Персонал', icon: Users },
  { key: 'log', label: 'Лог', icon: ScrollText },
  { key: 'access', label: 'Доступи', icon: MapPin },
  { key: 'online', label: 'Онлайн', icon: Wifi },
];

export function AdminPanel({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('staff');

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-text">{user.name}</div>
              <div className="text-[10px] text-muted">{user.role}</div>
            </div>
            <button onClick={onLogout}
              className="p-2 rounded-xl hover:bg-red-50 cursor-pointer transition-all group">
              <LogOut className="w-4 h-4 text-muted group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="sticky top-[57px] z-30 bg-white/80 backdrop-blur-xl border-b border-border px-4">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto no-scrollbar py-2">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${active ? 'bg-brand text-white shadow-sm' : 'text-muted hover:bg-bg'}`}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {tab === 'staff' && <StaffTab />}
          {tab === 'log' && <LogTab />}
          {tab === 'access' && <RouteAccessTab />}
          {tab === 'online' && <OnlineTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-muted/50 py-4 font-medium">
        <span className="text-text/40 font-bold">Boti</span><span className="text-success/40 font-bold">Logistics</span> Config v1.0
      </footer>
    </div>
  );
}
