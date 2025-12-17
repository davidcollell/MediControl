import React, { useEffect, useState } from 'react';
import { Medication, HistoryLog, Frequency, Schedule } from '../types';
import { getTodaysLogs, saveLog, saveMedication } from '../services/storage';
import { Button } from './Button';
import { 
  Check, Clock, AlertCircle, CalendarDays, Download, AlertTriangle, ChevronDown,
  Pill, Tablets, Syringe, Droplets, Wind, Heart, Zap, Thermometer, Baby, Bell, BellOff
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

// Icon helper per renderitzar
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

// Mapa de colors a classes utilitàries
const getColorTheme = (color: string) => {
  switch (color) {
    case 'red':
      return {
        icon: 'text-red-600',
        bgLight: 'bg-red-50',
        bgMedium: 'bg-red-100',
        textDark: 'text-red-700',
        border: 'border-red-300',
        ring: 'ring-red-100',
        btn: 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
      };
    case 'green':
      return {
        icon: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
        bgMedium: 'bg-emerald-100',
        textDark: 'text-emerald-700',
        border: 'border-emerald-300',
        ring: 'ring-emerald-100',
        btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
      };
    case 'purple':
      return {
        icon: 'text-purple-600',
        bgLight: 'bg-purple-50',
        bgMedium: 'bg-purple-100',
        textDark: 'text-purple-700',
        border: 'border-purple-300',
        ring: 'ring-purple-100',
        btn: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
      };
    case 'orange':
      return {
        icon: 'text-orange-600',
        bgLight: 'bg-orange-50',
        bgMedium: 'bg-orange-100',
        textDark: 'text-orange-700',
        border: 'border-orange-300',
        ring: 'ring-orange-100',
        btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
      };
    case 'pink':
      return {
        icon: 'text-pink-600',
        bgLight: 'bg-pink-50',
        bgMedium: 'bg-pink-100',
        textDark: 'text-pink-700',
        border: 'border-pink-300',
        ring: 'ring-pink-100',
        btn: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/30'
      };
    case 'teal':
      return {
        icon: 'text-teal-600',
        bgLight: 'bg-teal-50',
        bgMedium: 'bg-teal-100',
        textDark: 'text-teal-700',
        border: 'border-teal-300',
        ring: 'ring-teal-100',
        btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
      };
    case 'blue':
    default:
      return {
        icon: 'text-sky-600',
        bgLight: 'bg-sky-50',
        bgMedium: 'bg-sky-100',
        textDark: 'text-sky-700',
        border: 'border-sky-300',
        ring: 'ring-sky-100',
        btn: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
      };
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
    // Feedback hàptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
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

  // Calcular tasques del dia (Doses individuals)
  const getTodaysTasks = (): DoseTask[] => {
    const todayDay = new Date().getDay(); // 0 = Sunday
    const tasks: DoseTask[] = [];

    medications.forEach(med => {
      // Filtrar horaris per avui
      const validSchedules = med.schedules.filter(s => s.days.includes(todayDay));
      
      validSchedules.forEach(schedule => {
        // Comprovar si ja s'ha pres aquesta dosi específica
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

    // Ordenar per hora
    return tasks.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  };

  const tasks = getTodaysTasks();
  const completedTasks = tasks.filter(t => t.isTaken);
  const pendingTasks = tasks.filter(t => !t.isTaken);

  // Progress calculation
  const totalDaily = tasks.length;
  const takenCount = completedTasks.length;
  const progressPercent = totalDaily === 0 ? 0 : Math.round((takenCount / totalDaily) * 100);

  // Date formatting
  const todayDate = new Date().toLocaleDateString('ca-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  const formattedDate = todayDate.charAt(0).toUpperCase() + todayDate.slice(1);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 13) return "Bon dia!";
    if (hour < 20) return "Bona tarda!";
    return "Bona nit!";
  };

  return (
    <div className="space-y-8 pb-32">
      {/* HEADER AMB DATA I PROGRÉS */}
      <header className="flex flex-col gap-4 pt-2">
         <div>
          <h2 className="text-xl text-slate-500 font-medium capitalize">{formattedDate}</h2>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {getGreeting()}
          </h1>
        </div>

        {/* Progress Bar Card */}
        {totalDaily > 0 && (
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">El teu progrés</span>
              <span className="text-2xl font-black text-slate-800">{takenCount}/{totalDaily}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-right text-slate-400 text-sm mt-1 font-medium">
              {progressPercent === 100 ? 'Tot completat! 🎉' : `${progressPercent}% completat`}
            </p>
          </div>
        )}
      </header>

      {/* INSTALL PROMPT */}
      {installPrompt && (
        <div className="bg-sky-700 text-white p-6 rounded-3xl shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-4">
          <div>
            <h3 className="font-bold text-xl">Instal·lar App</h3>
            <p className="text-sky-100 text-lg">Per tenir-la sempre a mà.</p>
          </div>
          <button 
            onClick={onInstall}
            className="bg-white text-sky-700 px-6 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform w-full"
          >
            <Download className="w-6 h-6" />
            INSTAL·LAR ARA
          </button>
        </div>
      )}

      {/* SECCIÓ: PENDENTS */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-sky-600" />
          Pendents de prendre
        </h2>

        {pendingTasks.length === 0 && totalDaily > 0 ? (
          <div className="text-center py-10 bg-emerald-50 rounded-3xl border-2 border-emerald-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <p className="text-xl font-bold text-emerald-800">Fantàstic!</p>
            <p className="text-emerald-700">Has pres tota la medicació d'avui.</p>
          </div>
        ) : pendingTasks.length === 0 ? (
           <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed">
            <p className="text-slate-400 text-lg">No tens medicaments programats per avui.</p>
          </div>
        ) : (
          pendingTasks.map((task, index) => {
            const med = task.medication;
            const schedule = task.schedule;
            
            const isLowStock = med.stock <= (med.lowStockThreshold || 5);
            const isNext = index === 0;
            const theme = getColorTheme(med.color || 'blue');
            const IconComponent = getIconComponent(med.icon);
            
            // Prioritzem la dosi específica de l'horari, si no la general
            const displayDose = schedule.dose || med.dosage;

            return (
              <div 
                key={`${med.id}-${schedule.time}`} 
                className={`p-6 rounded-3xl border-2 shadow-sm transition-all bg-white ${
                  isNext 
                    ? `ring-4 ${theme.ring} ${theme.border}` 
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {isNext && (
                    <span className={`${theme.bgMedium} ${theme.textDark} px-3 py-1 rounded-lg text-sm font-bold w-fit mb-[-8px]`}>
                      SEGÜENT DOSI
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Clock className={`w-8 h-8 ${isNext ? theme.icon : 'text-slate-400'}`} />
                      <span className="text-4xl font-black text-slate-900 tracking-tight">
                        {schedule.time}
                      </span>
                    </div>
                    {/* Medication Icon Display in Card */}
                    <div className={`p-2 rounded-xl ${theme.bgMedium} ${theme.textDark}`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                        {med.name}
                      </h3>
                      <p className="text-2xl text-slate-600 font-medium">
                        {displayDose}
                      </p>
                    </div>
                    {med.hasAlarm !== false && (
                      <div className="bg-slate-100 p-2 rounded-full" title="Alarma activada">
                        <Bell className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleTake(task)}
                    fullWidth
                    className={`text-white !text-2xl !py-6 shadow-xl mt-2 ${
                      isNext 
                        ? `${theme.btn} shadow-lg` 
                        : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Check className="w-8 h-8 mr-2 stroke-[3]" />
                    PRENDRE ARA
                  </Button>

                  {isLowStock && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                      <span className="font-bold text-amber-800">Queden {med.stock} unitats</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SECCIÓ: COMPLETADES (Separada visualment) */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-4 border-t-2 border-slate-200">
           <h2 className="text-lg font-bold text-slate-500 flex items-center gap-2 opacity-80">
            <Check className="w-5 h-5" />
            Ja preses avui
          </h2>
          
          <div className="opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all space-y-3">
            {completedTasks.map(task => {
              const med = task.medication;
              const schedule = task.schedule;
              const theme = getColorTheme(med.color || 'blue');
              const IconComponent = getIconComponent(med.icon);
              return (
                <div 
                  key={`${med.id}-${schedule.time}-done`} 
                  className={`p-4 rounded-2xl border-2 ${theme.border} ${theme.bgLight} flex justify-between items-center`}
                >
                  <div className="flex items-center gap-4">
                     <div className={`${theme.bgMedium} ${theme.textDark} p-2 rounded-xl`}>
                        <IconComponent className="w-6 h-6" />
                     </div>
                     <div>
                        <span className="text-slate-500 font-bold text-lg block">{schedule.time}</span>
                        <span className="text-slate-700 font-bold text-xl line-through decoration-slate-400">{med.name}</span>
                     </div>
                  </div>
                  <div className={`${theme.bgMedium} ${theme.textDark} p-2 rounded-xl`}>
                    <Check className="w-6 h-6 stroke-[3]" />
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