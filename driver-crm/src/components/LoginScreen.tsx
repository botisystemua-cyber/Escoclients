import { useState } from 'react';
import { LogIn, Truck } from 'lucide-react';
import { BotiLogo } from './BotiLogo';
import { useApp } from '../store/useAppStore';

export function LoginScreen() {
  const { driverName, setDriverName, setCurrentScreen, showToast } = useApp();
  const [inputValue, setInputValue] = useState(driverName);

  const handleLogin = () => {
    const name = inputValue.trim();
    if (!name) {
      showToast('Введи своє ім\'я');
      return;
    }
    setDriverName(name);
    setCurrentScreen('routes');
    showToast(`Привіт, ${name}!`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 bg-dark">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center mb-6">
        <Truck className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>

      <BotiLogo size="lg" onDark />
      <p className="text-white/50 text-sm mt-2 mb-10 font-medium">
        Панель водія
      </p>

      {/* Form */}
      <div className="w-full max-w-md">
        <label className="block text-sm font-semibold text-white/70 mb-2">
          Твоє ім'я
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Введи своє ім'я"
          className="w-full px-5 py-4 bg-white/10 border border-white/15 rounded-2xl text-white text-lg placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
        />
        <button
          onClick={handleLogin}
          className="w-full mt-5 py-4 bg-brand text-white font-bold rounded-2xl text-lg hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <LogIn className="w-5 h-5" />
          Увійти
        </button>
      </div>
    </div>
  );
}
