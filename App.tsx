import React, { useState, useEffect } from 'react';
import { Tab, Medication } from './types';
import { getMedications } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { MedicationList } from './components/MedicationList';
import { History } from './components/History';
import { AIAssistant } from './components/AIAssistant';
import { LayoutDashboard, Pill, History as HistoryIcon, Bot, Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);

  // Initial Load
  useEffect(() => {
    refreshMedications();
    requestNotificationPermission();
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

  // Basic Alarm System Check (Runs every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${currentHours}:${currentMinutes}`;

      medications.forEach(med => {
        // Check time, permission, AND if notifications are enabled for this specific med
        // Note: med.enableNotifications ?? true ensures backward compatibility if field is missing
        const shouldNotify = med.enableNotifications ?? true;
        
        if (med.time === timeString && Notification.permission === 'granted' && shouldNotify) {
           // Prevent spamming notification in the same minute using a simple check mechanism if needed
           // For this demo, we assume the user takes action or ignores.
           new Notification(`Hora de la pastilla: ${med.name}`, {
             body: `Has de prendre ${med.dosage}.`,
             icon: 'https://picsum.photos/192/192'
           });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [medications]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard medications={medications} onUpdate={refreshMedications} />;
      case 'meds':
        return <MedicationList medications={medications} onUpdate={refreshMedications} />;
      case 'history':
        return <History />;
      case 'assistant':
        return <AIAssistant medications={medications} />;
      default:
        return <Dashboard medications={medications} onUpdate={refreshMedications} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Main Content Area */}
      <main className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl shadow-slate-200">
        <div className="p-6 pt-8">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe">
            <div className="max-w-md mx-auto flex justify-around items-center px-2 py-3">
              <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<LayoutDashboard className="w-6 h-6" />} 
                label="Avui" 
              />
              <NavButton 
                active={activeTab === 'meds'} 
                onClick={() => setActiveTab('meds')} 
                icon={<Pill className="w-6 h-6" />} 
                label="Meds" 
              />
              <NavButton 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')} 
                icon={<HistoryIcon className="w-6 h-6" />} 
                label="Historial" 
              />
              <NavButton 
                active={activeTab === 'assistant'} 
                onClick={() => setActiveTab('assistant')} 
                icon={<Bot className="w-6 h-6" />} 
                label="MediBot" 
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
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors duration-200 ${
      active ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);