import React, { useEffect, useState, useMemo } from 'react';
import { Medication, HistoryLog, Schedule } from '../types';
import { getTodaysLogs, saveLog, saveMedication } from '../services/storage';
import { Button } from './Button';
import { Haptics } from '../services/haptics';
import { 
  Check, Clock, AlertTriangle, 
  Pill, BellOff, CheckCircle, 
  ChevronRight, ListFilter
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

type FilterMode = 'pendent' | 'completat' | 'tot';

export const Dashboard: React.FC<DashboardProps> = ({ medications, onUpdate, installPrompt, onInstall }) => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('pendent');
  const [isTaking, setIsTaking] = useState<string | null>(null); // ID de la tasca en procés
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    setLogs(getTodaysLogs());
  }, [medications]); 

  const handleRequestNotifs = async () => {
    Haptics.tick();
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const handleTake = async (task: DoseTask) => {
    const taskId = `${task.medication.id}-${task.schedule.time}`;
    if (isTaking) return;

    Haptics.success();
    setIsTaking(taskId);

    // Esperem 2 segons per mostrar el feedback visual abans d'actualitzar les dades
    await new Promise(resolve => setTimeout(resolve, 2000));

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
    setLogs(prev => [...prev, newLog]);

    if (medication.stock !== undefined) {
      const unitsToDeduct = medication.unitsPerDose || 1;
      const updatedMed = { ...medication, stock: Math.max(0, medication.stock - unitsToDeduct) };
      saveMedication(updatedMed);
      onUpdate(); 
    }
    
    setIsTaking(null);
  };

  const allTasks = useMemo((): DoseTask[] => {
    const todayDay = new Date().getDay(); 
    const tasks: DoseTask[] = [];

    medications.forEach(med => {
      med.schedules.filter(s => s.days.includes(todayDay)).forEach(schedule => {
        const isTaken = logs.some(l => 
          l.medicationId === med.id && 
          l.status === 'taken' && 
          l.scheduledTime === schedule.time
        );
        tasks.push({ medication: med, schedule, isTaken });
      });
    });

    // Ordenació cronològica estricte (HH:mm)
    return tasks.sort((a, b) => {
      if (a.schedule.time < b.schedule.time) return -1;
      if (a.schedule.time > b.schedule.time) return 1;
      return a.medication.name.localeCompare(b.medication.name);
    });
  }, [medications, logs]);

  const filteredTasks = useMemo(() => {
    if (filterMode === 'pendent') return allTasks.filter(t => !t.isTaken);
    if (filterMode === 'completat') return allTasks.filter(t => t.isTaken);
    return allTasks;
  }, [allTasks, filterMode]);

  const progress = useMemo(() => {
    if (allTasks.length === 0) return 100;
    return Math.round((logs.length / allTasks.length) * 100);
  }, [allTasks, logs]);

  const nextTask = allTasks.find(t => !t.isTaken);
  const todayFormatted = new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{todayFormatted}</h2>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Hola! 👋</h1>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-black text-xs">
                {progress}%
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Objectiu</span>
                <span className="text-xs font-bold text-slate-700">{logs.length}/{allTasks.length} preses</span>
             </div>
          </div>
        </div>

        {nextTask ? (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            {/* Icona de fons personalitzada o Pill */}
            <div className="absolute top-[-20px] right-[-20px] p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none select-none">
              {nextTask.medication.icon ? (
                <span className="text-[12rem] block leading-none">{nextTask.medication.icon}</span>
              ) : (
                <Pill className="w-48 h-48" />
              )}
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="bg-sky-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">PROPERA PRESA</span>
                <span className="text-sky-400 font-bold text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> {nextTask.schedule.time}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                   {nextTask.medication.icon && <span className="text-3xl">{nextTask.medication.icon}</span>}
                   <h3 className="text-3xl font-black tracking-tight leading-tight">{nextTask.medication.name}</h3>
                </div>
                <p className="text-slate-400 font-medium text-lg">{nextTask.schedule.dose || nextTask.medication.dosage}</p>
              </div>
              
              <Button 
                variant={isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` ? 'primary' : 'glass'}
                onClick={() => handleTake(nextTask)}
                disabled={!!isTaking}
                className={`!py-5 text-lg transition-all duration-500 transform ${
                  isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` 
                    ? '!bg-emerald-500 !text-white scale-105 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                    : ''
                }`}
              >
                {isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` ? (
                  <>
                    <CheckCircle className="w-6 h-6 animate-bounce" /> CONFIRMAT!
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" /> MARCAR COM A PRESA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : allTasks.length > 0 && (
          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between border border-white/10">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight">Tot al dia! 🌟</h3>
              <p className="text-emerald-50 font-medium">Has completat totes les preses d'avui.</p>
            </div>
            <CheckCircle className="w-14 h-14 text-white/30" />
          </div>
        )}
      </header>

      <section className="space-y-4">
        {notifPermission !== 'granted' && (
          <button 
            onClick={handleRequestNotifs}
            className="w-full bg-amber-50 border border-amber-100 p-5 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-amber-900 text-sm">Activa les notificacions</h4>
                <p className="text-amber-700 text-[10px] font-medium">Per no oblidar cap dosi important.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </button>
        )}

        {installPrompt && (
          <button 
            onClick={onInstall}
            className="w-full bg-sky-50 border border-sky-100 p-5 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
             <div className="flex items-center gap-4">
              <div className="bg-sky-100 p-3 rounded-2xl text-sky-600">
                <Pill className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sky-900 text-sm">Instal·la l'App</h4>
                <p className="text-sky-700 text-[10px] font-medium">Accedeix més ràpid des de l'escriptori.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-400" />
          </button>
        )}

        <div className="flex items-center justify-between px-2 pt-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-sky-600" />
            Tasques d'avui
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['pendent', 'completat', 'tot'] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { Haptics.tick(); setFilterMode(m); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filterMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task, idx) => {
            const taskId = `${task.medication.id}-${task.schedule.time}`;
            const isTaskTaking = isTaking === taskId;

            return (
              <div 
                key={`${task.medication.id}-${task.schedule.time}-${idx}`}
                className={`bg-white rounded-[2rem] p-5 border-2 transition-all duration-300 flex items-center justify-between ${
                  task.isTaken 
                    ? 'border-emerald-100 bg-emerald-50/20 opacity-60' 
                    : isTaskTaking
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-100 shadow-sm hover:border-sky-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                    task.isTaken || isTaskTaking ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {task.isTaken || isTaskTaking ? (
                      <CheckCircle className={`w-6 h-6 ${isTaskTaking ? 'animate-pulse' : ''}`} />
                    ) : (
                      task.medication.icon ? (
                        <span className="text-2xl">{task.medication.icon}</span>
                      ) : (
                        <Clock className="w-6 h-6" />
                      )
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-sky-600">{task.schedule.time}</span>
                      {task.medication.hasAlarm === false && <BellOff className="w-3 h-3 text-slate-300" />}
                    </div>
                    <h4 className={`font-black tracking-tight transition-all duration-500 ${task.isTaken ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.medication.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {task.schedule.dose || task.medication.dosage}
                    </p>
                  </div>
                </div>

                {!task.isTaken && (
                  <button 
                    onClick={() => handleTake(task)}
                    disabled={!!isTaking}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                      isTaskTaking 
                        ? 'bg-emerald-500 text-white scale-110 rotate-[360deg]' 
                        : 'bg-slate-900 text-white active:scale-90 shadow-slate-900/20'
                    }`}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </button>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No hi ha tasques {filterMode === 'tot' ? 'per avui' : filterMode}.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};