import React, { useState, useEffect } from 'react';
import { Tab, Medication, HistoryLog } from './types';
import { getMedications, saveLog, getLogs } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { MedicationList } from './components/MedicationList';
import { History } from './components/History';
import { LayoutDashboard, Pill, History as HistoryIcon, WifiOff } from 'lucide-react';

const APP_ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNjAgMTUwYy00MC00MC0xMDUtNDAtMTQ1IDBsLTY1IDY1Yy00MCA0MC00MCAxMDUgMCAxNDVzMTA1IDQwIDE0NSAwbDY1LTY1YzQwLTQwIDQwLTEwNSAwLTE0NXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjE1IDIxNWw4MCA4MCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSIxMTAiIHI9IjYwIiBmaWxsPSIjZmRlMDQ3Ii8+PHBhdGggZD0iTTQwMCA5MHY0MG0tMjAtMjBoNDAiIHN0cm9rZT0iIzg1NGQwZSIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    refreshMedications();
    requestNotificationPermission();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MARK_TAKEN') {
        // Feedback hàptic
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }

        const { medId, medName } = event.data;
        const newLog: HistoryLog = {
          id: crypto.randomUUID(),
          medicationId: medId,
          medicationName: medName,
          takenAt: new Date().toISOString(),
          status: 'taken'
        };
        saveLog(newLog);
        refreshMedications();
        setUpdateTrigger(prev => prev + 1);
      }
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const refreshMedications = () => {
    setMedications(getMedications());
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay(); // 0 = Sunday
      
      const logs = getLogs();
      const today = new Date().toDateString();
      const todaysLogs = logs.filter(log => new Date(log.takenAt).toDateString() === today);

      for (const med of medications) {
        for (const schedule of med.schedules) {
          if (!schedule.days.includes(currentDay)) continue;
          if (schedule.time !== timeString) continue;

          const alreadyTaken = todaysLogs.some(l => 
            l.medicationId === med.id && 
            (l.scheduledTime === schedule.time)
          );
          
          const alarmEnabled = med.hasAlarm !== false;
          // Use specific schedule dose if available, otherwise global dose
          const doseToTake = schedule.dose || med.dosage;

          if (!alreadyTaken && alarmEnabled && Notification.permission === 'granted') {
             const registration = await navigator.serviceWorker.getRegistration();
             
             // Prepare notification body: user message or default
             const notificationBody = med.reminderMessage 
               ? `${med.reminderMessage} (${doseToTake})`
               : `Has de prendre ${doseToTake}. Toca 'Prendre' per confirmar.`;

             if (registration) {
               registration.showNotification(`Hora de: ${med.name}`, {
                 body: notificationBody,
                 icon: APP_ICON_URI,
                 badge: APP_ICON_URI,
                 tag: `med-${med.id}-${schedule.time}-${today}`,
                 renotify: true,
                 requireInteraction: true,
                 data: { medId: med.id, medName: med.name },
                 actions: [
                   { action: 'mark-taken', title: '✅ Prendre', type: 'button' }
                 ]
               } as any);
             } else {
               new Notification(`Hora de: ${med.name}`, {
                 body: notificationBody,
                 icon: APP_ICON_URI
               });
             }
          }
        }
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [medications, updateTrigger]); 

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard medications={medications} onUpdate={refreshMedications} installPrompt={installPrompt} onInstall={handleInstallClick} />;
      case 'meds':
        return <MedicationList medications={medications} onUpdate={refreshMedications} />;
      case 'history':
        return <History />;
      default:
        return <Dashboard medications={medications} onUpdate={refreshMedications} installPrompt={installPrompt} onInstall={handleInstallClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {!isOnline && (
        <div className="bg-slate-800 text-white px-4 py-3 text-sm font-bold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-5 h-5" /> SENSE INTERNET
        </div>
      )}

      <main className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl shadow-slate-200">
        <div className="p-4 pt-6 pb-32">
          {renderContent()}
        </div>

        {/* Navigation Bar - Taller and bigger for accessibility */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto flex justify-around items-center px-1 py-3">
              <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<LayoutDashboard className="w-9 h-9" />} 
                label="AVUI" 
              />
              <NavButton 
                active={activeTab === 'meds'} 
                onClick={() => setActiveTab('meds')} 
                icon={<Pill className="w-9 h-9" />} 
                label="PASTILLES" 
              />
              <NavButton 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')} 
                icon={<HistoryIcon className="w-9 h-9" />} 
                label="HISTORIAL" 
              />
            </div>
        </nav>
      </main>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-200 w-full active:scale-95 touch-manipulation ${
      active ? 'text-sky-800 bg-sky-100 font-black scale-105 ring-2 ring-sky-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold'
    }`}
  >
    {icon}
    <span className="text-sm tracking-wide">{label}</span>
  </button>
);