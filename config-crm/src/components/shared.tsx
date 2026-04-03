import { Truck } from 'lucide-react';

export function Logo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const isLg = size === 'lg';
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${isLg ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-9 h-9'} rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20`}>
        <Truck className={`${isLg ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4.5 h-4.5'} text-white`} />
      </div>
      <span className={`${isLg ? 'text-3xl sm:text-4xl' : 'text-xl'} font-black tracking-tight`}>
        <span className="text-text">Boti</span>
        <span className="text-success">Logistics</span>
      </span>
    </div>
  );
}

export const API_URL = 'https://script.google.com/macros/s/AKfycbyc23WPRGTjQJs-58cGYuCKBnJMbJItHsRwcHwttd6csZXNEo9MQrhW83inIHsmnJp-/exec';

export interface AuthUser {
  name: string;
  role: string;
  staffId: string;
}
