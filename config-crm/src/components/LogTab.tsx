import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ShieldOff } from 'lucide-react';
import { API_URL } from './shared';

interface LogEntry {
  logId: string;
  userId: string;
  name: string;
  role: string;
  action: string;
  datetime: string;
  status: string;
  note: string;
}

export function LogTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getAccessLog' }),
      });
      const data = await res.json();
      if (data.success) setLogs((data.logs || []).reverse());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getStatusIcon = (status: string) => {
    if (status === 'Успішно') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'Помилка') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'Заблоковано') return <ShieldOff className="w-4 h-4 text-orange-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'Успішно') return 'bg-green-50 border-green-200';
    if (status === 'Помилка') return 'bg-red-50 border-red-200';
    if (status === 'Заблоковано') return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">{logs.length} записів</span>
        <button onClick={load} className="p-2 rounded-xl hover:bg-white cursor-pointer transition-all">
          <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted text-sm"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Завантаження...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">Немає записів</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={log.logId || i} className={`rounded-2xl border p-3 sm:p-4 flex items-start gap-3 ${getStatusBg(log.status)}`}>
              <div className="mt-0.5 shrink-0">{getStatusIcon(log.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-text">{log.name || '???'}</span>
                  <span className="text-[10px] font-bold text-muted bg-white/80 px-2 py-0.5 rounded-full">{log.role}</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{log.action}</div>
                {log.note && <div className="text-[10px] text-muted mt-0.5">{log.note}</div>}
                <div className="text-[10px] text-muted/60 mt-1">{log.datetime}</div>
              </div>
              <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${
                log.status === 'Успішно' ? 'text-green-600' : log.status === 'Помилка' ? 'text-red-500' : 'text-orange-500'
              }`}>{log.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
