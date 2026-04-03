import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, RefreshCw } from 'lucide-react';
import { getMessages, sendMessage, markRead } from '../lib/api';
import type { ChatMsg } from '../lib/api';

interface Props {
  cliId: string;
  onClearBadge: () => void;
}

function formatTime(dt: string): string {
  if (!dt) return '';
  // Try parsing various date formats
  const d = new Date(dt);
  if (!isNaN(d.getTime())) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  // Try dd.MM.yyyy HH:mm:ss format
  const m = dt.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (m) return `${m[4]}:${m[5]}`;
  return dt;
}

export default function ChatScreen({ cliId, onClearBadge }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(cliId);
      setMessages(msgs);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка');
    }
  }, [cliId]);

  // Initial load + mark read
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadMessages();
      setLoading(false);
      onClearBadge();
      markRead(cliId).catch(() => {});
    })();
  }, [cliId, loadMessages, onClearBadge]);

  // Poll every 10 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadMessages();
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(cliId, trimmed);
      await loadMessages();
      markRead(cliId).catch(() => {});
    } catch {
      setText(trimmed); // Restore text on failure
    }
    setSending(false);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      <div className="bg-navy px-4 pt-6 pb-4 rounded-b-3xl md:rounded-none md:px-10 md:pt-8 md:pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Чат з менеджером</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-status-confirmed rounded-full" />
              <span className="text-blue-200/60 text-xs">Онлайн</span>
            </div>
          </div>
          <button
            onClick={loadMessages}
            className="text-blue-200/60 hover:text-white transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center py-10 text-red-400 text-sm">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Ще немає повідомлень. Напишіть першим!
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'client';
            return (
              <div key={msg.message_id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                  isUser
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}>
                  {!isUser && (
                    <p className="text-[10px] font-semibold text-accent mb-0.5">
                      {msg.sender_name || 'Менеджер'}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(msg.datetime)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200 shrink-0 md:px-10">
        <div className="flex gap-2 md:max-w-3xl md:mx-auto">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Написати повідомлення..."
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-accent transition"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shrink-0 disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
