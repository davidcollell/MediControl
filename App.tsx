import React, { useState, useEffect, useRef } from 'react';
import { Tab, Medication, HistoryLog, AppSettings } from './types';
import { getMedications, saveLog, getLogs, getSettings } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { MedicationList } from './components/MedicationList';
import { History } from './components/History';
import { LayoutDashboard, Pill, History as HistoryIcon, WifiOff } from 'lucide-react';
import { Haptics } from './services/haptics';

const APP_ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNjAgMTUwYy00MC00MC0xMDUtNDAtMTQ1IDBsLTY1IDY1Yy00MCA0MC00MCAxMDUgMCAxNDVzMTA1IDQwIDE0NSAwbDY1LTY1YzQwLTQwIDQwLTEwNSAwLTE0NXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjE1IDIxNWw4MCA4MCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSIxMTAiIHI9IjYwIiBmaWxsPSIjZmRlMDQ3Ii8+PHBhdGggZD0iTTQwMCA5MHY0MG0tMjAtMjBoNDAiIHN0cm9rZT0iIzg1NGQwZSIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [snoozedMeds, setSnoozedMeds] = useState<Record<string, number>>({});

  const lastNotifiedMinute = useRef<string>("");

  useEffect(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 600);
      }, 1000);
    }

    refreshMedications();
    
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MARK_TAKEN') {
        const { medId, medName, scheduledTime } = event.data;
        confirmMedication(medId, medName, scheduledTime);
      } else if (event.data?.type === 'SNOOZE_MED') {
        const { medId, scheduledTime } = event.data;
        const key = `${medId}-${scheduledTime}`;
        const currentSettings = getSettings();
        setSnoozedMeds(prev => ({ 
          ...prev, 
          [key]: Date.now() + currentSettings.snoozeDuration * 60000 
        }));
      }
    };
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const refreshMedications = () => {
    setMedications(getMedications());
    setAppSettings(getSettings());
  };

  const confirmMedication = (medId: string, medName: string, scheduledTime: string) => {
    Haptics.success();
    const newLog: HistoryLog = {
      id: crypto.randomUUID(),
      medicationId: medId,
      medicationName: medName,
      takenAt: new Date().toISOString(),
      status: 'taken',
      scheduledTime: scheduledTime
    };
    saveLog(newLog);
    refreshMedications();
  };

  useEffect(() => {
    const checkAlarms = async () => {
      const now = new Date();
      if (!appSettings.notificationsEnabled) return;

      const currentDay = now.getDay();
      const logs = getLogs();
      const today = new Date().toDateString();
      const todaysLogs = logs.filter(log => new Date(log.takenAt).toDateString() === today);

      const medsDueNow: Array<{ med: Medication; schedule: any }> = [];

      for (const med of medications) {
        if (med.hasAlarm === false) continue;
        for (const schedule of med.schedules) {
          const key = `${med.id}-${schedule.time}`;
          
          const [h, m] = schedule.time.split(':').map(Number);
          const schedDate = new Date();
          schedDate.setHours(h, m, 0, 0);

          if (appSettings.remindBeforeMinutes > 0) {
            schedDate.setMinutes(schedDate.getMinutes() - appSettings.remindBeforeMinutes);
          }
          
          const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const timeToNotifyString = `${schedDate.getHours().toString().padStart(2, '0')}:${schedDate.getMinutes().toString().padStart(2, '0')}`;

          const isSnoozed = snoozedMeds[key] && Date.now() < snoozedMeds[key];
          if (isSnoozed) continue;

          const isScheduledNow = (timeToNotifyString === currentTimeString) && schedule.days.includes(currentDay);
          const isSnoozeExpired = snoozedMeds[key] && Math.abs(Date.now() - snoozedMeds[key]) < 60000;

          if ((isScheduledNow || isSnoozeExpired) && lastNotifiedMinute.current !== `${key}-${currentTimeString}`) {
            const alreadyTaken = todaysLogs.some(l => l.medicationId === med.id && l.scheduledTime === schedule.time);
            if (!alreadyTaken) {
              medsDueNow.push({ med, schedule });
              lastNotifiedMinute.current = `${key}-${currentTimeString}`;
            }
          }
        }
      }

      if (medsDueNow.length > 0 && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (medsDueNow.length === 1) {
            const { med, schedule } = medsDueNow[0];
            const isEarly = appSettings.remindBeforeMinutes > 0;
            registration.showNotification(`${isEarly ? '🔜 Propera presa: ' : '🔔 Hora de: '}${med.name}`, {
              body: med.reminderMessage || `Dosi de les ${schedule.time}: ${schedule.dose || med.dosage}`,
              icon: APP_ICON_URI,
              badge: APP_ICON_URI,
              tag: `med-${med.id}-${schedule.time}`,
              requireInteraction: true,
              data: { medId: med.id, medName: med.name, scheduledTime: schedule.time },
              actions: [
                { action: 'mark-taken', title: '✅ Pres', type: 'button' },
                { action: 'snooze', title: `⏰ +${appSettings.snoozeDuration} min`, type: 'button' }
              ]
            } as any);
          } else {
            registration.showNotification(`Tens ${medsDueNow.length} medicaments pendents`, {
              body: medsDueNow.map(m => m.med.name).join(', '),
              icon: APP_ICON_URI,
              badge: APP_ICON_URI,
              tag: 'med-group',
              requireInteraction: true,
              data: { multiple: true }
            } as any);
          }
        }
      }
    };

    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [medications, snoozedMeds, appSettings]);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard medications={medications} onUpdate={refreshMedications} installPrompt={installPrompt} onInstall={handleInstallClick} />;
      case 'meds':
        return <MedicationList medications={medications} onUpdate={refreshMedications} />;
      case 'history':
        return <History />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {!isOnline && (
        <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-black tracking-widest text-center sticky top-0 z-[60] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" /> MODE SENSE CONNEXIÓ • DADES LOCALS
        </div>
      )}

      <main className="max-w-md mx-auto min-h-screen bg-slate-50 relative">
        <div className="px-6 pt-10 pb-40">
          {renderContent()}
        </div>

        <nav className="fixed bottom-6 left-4 right-4 z-50">
          <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-2 flex justify-around items-center shadow-2xl shadow-slate-900/40 border border-white/10">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => { Haptics.tick(); setActiveTab('dashboard'); }} 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Inici" 
            />
            <NavButton 
              active={activeTab === 'meds'} 
              onClick={() => { Haptics.tick(); setActiveTab('meds'); }} 
              icon={<Pill className="w-5 h-5" />} 
              label="Pla" 
            />
            <NavButton 
              active={activeTab === 'history'} 
              onClick={() => { Haptics.tick(); setActiveTab('history'); }} 
              icon={<HistoryIcon className="w-5 h-5" />} 
              label="Història" 
            />
          </div>
        </nav>
      </main>
    </div>
  );
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-[1.8rem] transition-all duration-300 active:scale-90 ${
      active ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon}
    {active && <span className="text-[10px] font-black tracking-tighter uppercase">{label}</span>}
  </button>
);