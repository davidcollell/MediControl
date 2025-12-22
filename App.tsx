
import React, { useState, useEffect, useRef } from 'react';
import { Tab, Medication, HistoryLog, AppSettings } from './types.ts';
import { getMedications, saveLog, getLogs, getSettings } from './services/storage.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { MedicationList } from './components/MedicationList.tsx';
import { History } from './components/History.tsx';
import { LayoutDashboard, Pill, History as HistoryIcon, WifiOff, Download, Smartphone, ChevronRight } from 'lucide-react';
import { Haptics } from './services/haptics.ts';

const APP_ICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNjAgMTUwYy00MC00MC0xMDUtNDAtMTQ1IDBsLTY1IDY1Yy00MCA0MC00MCAxMDUgMCAxNDVzMTA1IDQwIDE0NSAwbDY1LTY1YzQwLTQwIDQwLTEwNSAwLTE0NXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjE1IDIxNWw4MCA4MCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSIxMTAiIHI9IjYwIiBmaWxsPSIjZmRlMDQ3Ii8+PHBhdGggZD0iTTQwMCA5MHY0MG0tMjAtMjBoNDAiIHN0cm9rZT0iIzg1NGQwZSIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [snoozedMeds, setSnoozedMeds] = useState<Record<string, number>>({});

  const lastNotifiedMinute = useRef<string>("");

  useEffect(() => {
    // Detectar si l'app s'està executant com a PWA Standalone (Nativa)
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isPWA);
    };

    checkStandalone();

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

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    } else {
      alert("Per instal·lar l'app a Android, prem els 3 punts del Chrome i selecciona 'Instal·la l'aplicació' o 'Afegeix a la pantalla d'inici'.");
    }
  };

  if (!isStandalone && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-sky-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-sky-200 mb-8">
           <svg viewBox="0 0 512 512" width="50" height="50" fill="white">
            <path d="M360 150c-40-40-105-40-145 0l-65 65c-40 40-40 105 0 145s105 40 145 0l65-65c40-40 40-105 0-145z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Instal·la MediControl</h1>
        <p className="text-slate-500 font-medium mb-10 max-w-xs">
          Per una experiència nativa, sense navegadors i amb recordatoris fiables, instal·la l'aplicació al teu Android.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={handleInstallClick}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Download className="w-6 h-6" /> INSTAL·LAR ARA
          </button>
          
          <button 
            onClick={() => setIsStandalone(true)}
            className="w-full py-4 text-slate-400 font-bold text-sm flex items-center justify-center gap-2"
          >
            Continuar al navegador (No recomanat) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-16 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-left w-full">
           <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-600" /> Passos manuals
           </h3>
           <ol className="text-xs text-slate-500 font-bold space-y-2 list-decimal pl-4">
              <li>Prem els tres punts (⋮) del Chrome.</li>
              <li>Selecciona <strong>"Instal·la l'aplicació"</strong>.</li>
              <li>Obre-la des de la teva llista d'aplicacions.</li>
           </ol>
        </div>
      </div>
    );
  }

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
    <div className="h-full bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900 flex flex-col">
      {!isOnline && (
        <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-black tracking-widest text-center sticky top-0 z-[60] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" /> MODE SENSE CONNEXIÓ • DADES LOCALS
        </div>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar max-w-md mx-auto w-full relative">
        <div className="px-6 pt-10 pb-40">
          {renderContent()}
        </div>
      </main>

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
