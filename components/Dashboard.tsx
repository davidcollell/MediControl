import React, { useEffect, useState } from 'react';
import { Medication, HistoryLog, Schedule } from '../types';
import { getTodaysLogs, saveLog, saveMedication } from '../services/storage';
import { Button } from './Button';
import { 
  Check, Clock, AlertCircle, Download, AlertTriangle, 
  Pill, Tablets, Syringe, Droplets, Wind, Heart, Zap, Thermometer, Baby, Bell
} from 'lucide-react';

interface DashboardProps {
  medications: Medication[];
  onUpdate: () => void;
  installPrompt?: any;
  onInstall?: () => void;
}

interface DoseTask {
  medication: Medication;
  schedule: Schedule;
  isTaken: boolean;
}

// Helper per saludar
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 13) return "Bon dia!";
  if (hour < 20) return "Bona tarda!";
  return "Bona nit!";
};

const getIconComponent = (iconId: string | undefined) => {
  switch (iconId) {
    case 'tablets': return Tablets;
    case 'syringe': return Syringe;
    case 'droplets': return Droplets;
    case 'wind': return Wind;
    case 'heart': return Heart;
    case 'zap': return Zap;
    case 'thermometer': return Thermometer;
    case 'baby': return Baby;
    default: return Pill;
  }
};

// Mapa de colors simplificat per accessibilitat (més contrast)
// Utilitzem Emerald (verd) per a l'acció principal de prendre.
const getColorTheme = (color: string) => {
  // Per defecte tots utilitzaran un fons clar per llegibilitat
  // Les icones mantenen el seu color per reconeixement
  switch (color) {
    case 'red': return { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    case 'green': return { icon: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    case 'purple': return { icon: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };
    case 'orange': return { icon: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    default: return { icon: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' };
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ medications, onUpdate, installPrompt, onInstall }) => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setLogs(getTodaysLogs());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [medications]); 

  const handleTake = (task: DoseTask) => {
    // Feedback hàptic fort
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    const { medication, schedule } = task;

    const newLog: HistoryLog = {
      id: crypto.randomUUID(),
      medicationId: medication.id,
      medicationName: medication.name,
      takenAt: new Date().toISOString(),
      status: 'taken',
      scheduledTime: schedule.time
    };
    saveLog(newLog);
    setLogs([...logs, newLog]);

    if (medication.stock !== undefined) {
      const unitsToDeduct = medication.unitsPerDose || 1;
      const newStock = Math.max(0, medication.stock - unitsToDeduct);
      const updatedMed = { ...medication, stock: newStock };
      saveMedication(updatedMed);
      onUpdate(); 
    }
  };

  const getTodaysTasks = (): DoseTask[] => {
    const todayDay = new Date().getDay(); // 0 = Sunday
    const tasks: DoseTask[] = [];

    medications.forEach(med => {
      const validSchedules = med.schedules.filter(s => s.days.includes(todayDay));
      validSchedules.forEach(schedule => {
        const isTaken = logs.some(l => 
          l.medicationId === med.id && 
          l.status === 'taken' && 
          (l.scheduledTime === schedule.time || !l.scheduledTime)
        );

        tasks.push({
          medication: med,
          schedule: schedule,
          isTaken: isTaken
        });
      });
    });

    return tasks.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  };

  const tasks = getTodaysTasks();
  const completedTasks = tasks.filter(t => t.isTaken);
  const pendingTasks = tasks.filter(t => !t.isTaken);

  const totalDaily = tasks.length;
  const takenCount = completedTasks.length;
  const progressPercent = totalDaily === 0 ? 0 : Math.round((takenCount / totalDaily) * 100);

  const todayDate = new Date().toLocaleDateString('ca-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  const formattedDate = todayDate.charAt(0).toUpperCase() + todayDate.slice(1);

  return (
    <div className="space-y-8">
      {/* HEADER AMB SALUTACIÓ GRAN */}
      <header className="flex flex-col gap-2 pt-2">
        <h2 className="text-xl text-slate-500 font-medium capitalize">{formattedDate}</h2>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          {getGreeting()}
        </h1>

        {/* Barra de progrés molt visual */}
        {totalDaily > 0 && (
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm mt-2">
            <div className="flex justify-between items-end mb-3">
              <span className="text-slate-600 font-bold text-lg">Progrés diari</span>
              <span className="text-3xl font-black text-slate-900">{takenCount} / {totalDaily}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* INSTALL PROMPT */}
      {installPrompt && (
        <div className="bg-sky-700 text-white p-6 rounded-3xl shadow-xl flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-2xl">Instal·lar l'App</h3>
            <p className="text-sky-100 text-xl">Per tenir-la sempre a la pantalla.</p>
          </div>
          <button 
            onClick={onInstall}
            className="bg-white text-sky-700 px-6 py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform w-full shadow-lg"
          >
            <Download className="w-7 h-7" />
            INSTAL·LAR ARA
          </button>
        </div>
      )}

      {/* SECCIÓ: PENDENTS */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Clock className="w-8 h-8 text-sky-600" />
          Ara toca prendre:
        </h2>

        {pendingTasks.length === 0 && totalDaily > 0 ? (
          <div className="text-center py-12 bg-emerald-50 rounded-3xl border-2 border-emerald-100 px-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
              <Check className="w-12 h-12 stroke-[3]" />
            </div>
            <p className="text-3xl font-black text-emerald-800 mb-2">Molt bé!</p>
            <p className="text-xl text-emerald-700 font-medium">Ja ho has pres tot per avui.</p>
          </div>
        ) : pendingTasks.length === 0 ? (
           <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-slate-200 border-dashed">
            <p className="text-slate-500 text-2xl font-medium">Avui no tens medicaments.</p>
          </div>
        ) : (
          pendingTasks.map((task, index) => {
            const med = task.medication;
            const schedule = task.schedule;
            
            // Avisar només si l'estoc és molt baix (menys de 3 dies aprox)
            const isCriticalStock = med.stock <= 3;
            const isNext = index === 0;
            const theme = getColorTheme(med.color || 'blue');
            const IconComponent = getIconComponent(med.icon);

            return (
              <div 
                key={`${med.id}-${schedule.time}`} 
                className={`p-6 rounded-3xl border-2 shadow-sm transition-all bg-white relative overflow-hidden ${
                  isNext 
                    ? `border-sky-400 ring-4 ring-sky-100` 
                    : 'border-slate-200'
                }`}
              >
                {/* Visual Cue for Next Dose */}
                {isNext && (
                  <div className="absolute top-0 right-0 bg-sky-500 text-white px-6 py-2 rounded-bl-2xl font-bold text-lg">
                    PRIMER
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="bg-slate-100 p-3 rounded-2xl">
                       <Clock className="w-8 h-8 text-slate-700" />
                    </div>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                      {schedule.time}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Icona Gran del Medicament */}
                    <div className={`p-4 rounded-2xl flex-shrink-0 ${theme.bg}`}>
                      <IconComponent className={`w-10 h-10 ${theme.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {med.name}
                      </h3>
                      <p className="text-2xl text-slate-600 font-medium">
                        {med.dosage}
                      </p>
                    </div>
                  </div>

                  {/* Botó d'Acció Enorme i Verd (Psicologia positiva) */}
                  <button 
                    onClick={() => handleTake(task)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-6 px-4 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-2 border-b-4 border-emerald-800"
                  >
                    <Check className="w-10 h-10 stroke-[3]" />
                    <span className="text-3xl font-black tracking-wide">PRENDRE</span>
                  </button>

                  {isCriticalStock && (
                    <div className="mt-1 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800">
                      <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                      <span className="font-bold text-lg">Atenció: Queden {med.stock} unitats.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SECCIÓ: COMPLETADES */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-8 border-t-2 border-slate-200">
           <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
            <Check className="w-6 h-6" />
            Ja fet avui
          </h2>
          
          <div className="space-y-4">
            {completedTasks.map(task => {
              const med = task.medication;
              const schedule = task.schedule;
              const theme = getColorTheme(med.color || 'blue');
              
              return (
                <div 
                  key={`${med.id}-${schedule.time}-done`} 
                  className={`p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 flex justify-between items-center opacity-70`}
                >
                  <div>
                      <span className="text-slate-500 font-bold text-xl block mb-1">{schedule.time}</span>
                      <span className="text-slate-700 font-bold text-2xl line-through decoration-2 decoration-slate-400">{med.name}</span>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};