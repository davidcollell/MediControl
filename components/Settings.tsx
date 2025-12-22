import React, { useState } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings } from '../services/storage';
import { Button } from './Button';
import { X, Bell, Clock, Timer, Smartphone, Check, ShieldCheck } from 'lucide-react';
import { Haptics } from '../services/haptics';

interface SettingsProps {
  onClose: () => void;
  onUpdate: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose, onUpdate }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const handleToggle = (key: keyof AppSettings) => {
    Haptics.tick();
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
    onUpdate();
  };

  const setOption = (key: keyof AppSettings, value: number) => {
    Haptics.tick();
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
        <header className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-2 rounded-xl text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Preferències</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white shadow-sm rounded-full active:scale-90 transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </header>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar text-slate-900">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <div>
                  <h3 className="font-bold text-slate-800">Alarmes de l'app</h3>
                  <p className="text-xs text-slate-500 font-medium">Activa o desactiva tots els avisos</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.notificationsEnabled}
                  onChange={() => handleToggle('notificationsEnabled')}
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Temps de posposició</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 30, 60].map(mins => (
                <button 
                  key={mins}
                  onClick={() => setOption('snoozeDuration', mins)}
                  className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${
                    settings.snoozeDuration === mins 
                      ? 'bg-sky-600 border-sky-700 text-white shadow-lg shadow-sky-600/20' 
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  {mins}'
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Avisar-me amb antelació</h3>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { val: 0, label: "A l'hora exacta" },
                { val: 5, label: "5 minuts abans" },
                { val: 10, label: "10 minuts abans" },
                { val: 15, label: "15 minuts abans" }
              ].map(opt => (
                <button 
                  key={opt.val}
                  onClick={() => setOption('remindBeforeMinutes', opt.val)}
                  className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                    settings.remindBeforeMinutes === opt.val
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-white border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="font-bold">{opt.label}</span>
                  {settings.remindBeforeMinutes === opt.val && <Check className="w-5 h-5 text-sky-600" />}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <div>
                  <h3 className="font-bold text-slate-800">Vibració</h3>
                  <p className="text-xs text-slate-500 font-medium">Feedback tàctil en interaccions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.vibrationEnabled}
                  onChange={() => handleToggle('vibrationEnabled')}
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50">
          <Button fullWidth onClick={onClose} className="py-5 text-lg">
            ENTÈS
          </Button>
        </div>
      </div>
    </div>
  );
};