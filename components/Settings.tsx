import React, { useState } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings } from '../services/storage';
import { Button } from './Button';
import { X, Bell, Clock, Timer, Smartphone, Check, ShieldCheck, Send, Info } from 'lucide-react';
import { Haptics } from '../services/haptics';

interface SettingsProps {
  onClose: () => void;
  onUpdate: () => void;
}

const APP_ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNjAgMTUwYy00MC00MC0xMDUtNDAtMTQ1IDBsLTY1IDY1Yy00MCA0MC00MCAxMDUgMCAxNDVzMTA1IDQwIDE0NSAwbDY1LTY1YzQwLTQwIDQwLTEwNSAwLTE0NXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjE1IDIxNWw4MCA4MCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSIxMTAiIHI9IjYwIiBmaWxsPSIjZmRlMDQ3Ii8+PHBhdGggZD0iTTQwMCA5MHY0MG0tMjAtMjBoNDAiIHN0cm9rZT0iIzg1NGQwZSIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

export const Settings: React.FC<SettingsProps> = ({ onClose, onUpdate }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [testSent, setTestSent] = useState(false);

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

  const sendTestNotification = async () => {
    Haptics.success();
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        alert('Si us plau, permet les notificacions a la configuració del teu Android.');
        return;
      }
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.showNotification('Prova de MediControl', {
        body: 'Això és una notificació de prova. Els teus avisos funcionen correctament!',
        icon: APP_ICON_URI,
        badge: APP_ICON_URI,
        tag: 'test-notification',
        vibrate: [100, 50, 100],
        data: { test: true },
        actions: [
          // Use double quotes to handle the single quote in D'acord to avoid parsing errors
          { action: 'mark-taken', title: "✅ D'acord", type: 'button' }
        ]
      } as any);
      
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      new Notification('Prova de MediControl', {
        body: 'Els teus avisos funcionen correctament!',
        icon: APP_ICON_URI
      });
    }
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

          <section className="bg-sky-50 p-5 rounded-3xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-sky-600 shadow-sm">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sky-900 text-sm">Verificació d'avisos</h3>
                <p className="text-[10px] text-sky-700 font-bold opacity-70">Comprova que el teu Android rep les alertes.</p>
              </div>
            </div>
            <button 
              onClick={sendTestNotification}
              disabled={testSent}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                testSent 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-sky-600 border border-sky-200 shadow-sm active:scale-95'
              }`}
            >
              {testSent ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              {testSent ? 'ENVIADA!' : 'ENVIAR PROVA'}
            </button>
            <div className="flex gap-2 items-start opacity-60">
              <Info className="w-3 h-3 text-sky-600 mt-0.5 flex-shrink-0" />
              <p className="text-[9px] font-medium text-sky-800 leading-tight">
                Si no reps la prova, comprova que MediControl tingui permís de "Notificacions" i que el mode "No molestar" estigui desactivat.
              </p>
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