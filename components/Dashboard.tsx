
import React, { useEffect, useState, useMemo } from 'react';
import { Medication, HistoryLog, Schedule } from '../types.ts';
import { getTodaysLogs, saveLog, saveMedication } from '../services/storage.ts';
import { Button } from './Button.tsx';
import { Haptics } from '../services/haptics.ts';
import { 
  Check, Clock, AlertTriangle, 
  Pill, BellOff, CheckCircle, 
  ChevronRight, ListFilter, Download,
  Smartphone, ShieldCheck
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
  const [isTaking, setIsTaking] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    setLogs(getTodaysLogs());
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
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

    await new Promise(resolve => setTimeout(resolve, 1500));

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

    return tasks.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  }, [medications, logs]);

  const filteredTasks = useMemo(() => {
    if (filterMode === 'pendent') return allTasks.filter(t => !t.isTaken);
    if (filterMode === 'completat') return allTasks.filter(t => t.isTaken);
    return allTasks;
  }, [allTasks, filterMode]);

  const progress = useMemo(() => {
    if (allTasks.length === 0) return 100;
    return Math.round((logs.filter(l => l.status === 'taken').length / allTasks.length) * 100);
  }, [allTasks, logs]);

  const nextTask = allTasks.find(t => !t.isTaken);
  const todayFormatted = new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{todayFormatted}</h2>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">El teu dia</h1>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-black text-xs ring-4 ring-sky-50/50">
                {progress}%
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progrés</span>
                <span className="text-xs font-bold text-slate-700">{logs.filter(l => l.status === 'taken').length}/{allTasks.length}</span>
             </div>
          </div>
        </div>

        {installPrompt && !isStandalone && (
          <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-sky-200 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                   <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h3 className="font-black text-lg leading-tight">Instal·la l'App Nativa</h3>
                   <p className="text-sky-100 text-xs font-medium">Accedeix sense navegador i rep alertes millors.</p>
                </div>
             </div>
             <button 
                onClick={onInstall}
                className="w-full bg-white text-sky-600 py-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
             >
                <Download className="w-5 h-5" /> INSTAL·LAR ARA
             </button>
          </div>
        )}

        {nextTask ? (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-[-40px] right-[-40px] p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none select-none">
                <Pill className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-500/30">Properament</span>
                <span className="text-white/60 font-bold text-sm flex items-center gap-1.5"><Clock className="w-4 h-4" /> {nextTask.schedule.time}</span>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter leading-tight mb-1">{nextTask.medication.name}</h3>
                <p className="text-slate-400 font-bold text-lg">{nextTask.schedule.dose || nextTask.medication.dosage}</p>
              </div>
              
              <Button 
                variant={isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` ? 'primary' : 'glass'}
                onClick={() => handleTake(nextTask)}
                disabled={!!isTaking}
                className={`!py-6 text-lg transition-all duration-500 transform ${
                  isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` 
                    ? '!bg-emerald-500 !text-white scale-[1.02] border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                    : 'shadow-lg'
                }`}
              >
                {isTaking === `${nextTask.medication.id}-${nextTask.schedule.time}` ? (
                  <>
                    <CheckCircle className="w-6 h-6 animate-pulse" /> REGISTRANT...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6 stroke-[3]" /> MARCAR COM A PRESA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : allTasks.length > 0 && (
          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 flex items-center justify-between border border-emerald-400">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight">Tot completat! ✨</h3>
              <p className="text-emerald-50 font-medium">Has complert amb el pla d'avui.</p>
            </div>
            <div className="bg-white/20 p-4 rounded-3xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </header>

      <section className="space-y-4">
        {notifPermission !== 'granted' && (
          <button 
            onClick={handleRequestNotifs}
            className="w-full bg-amber-50 border-2 border-amber-100 p-5 rounded-[2rem] flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-amber-900 text-sm">Activa les Notificacions</h4>
                <p className="text-amber-700 text-[10px] font-bold opacity-70">Rep els avisos en el moment exacte.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </button>
        )}

        <div className="flex items-center justify-between px-2 pt-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <ListFilter className="w-5 h-5 text-sky-600" />
            Agenda d'avui
          </h3>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {(['pendent', 'tot'] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { Haptics.tick(); setFilterMode(m); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
                className={`bg-white rounded-[2.2rem] p-5 border-2 transition-all duration-300 flex items-center justify-between ${
                  task.isTaken 
                    ? 'border-emerald-50 bg-emerald-50/10 opacity-60' 
                    : isTaskTaking
                      ? 'border-emerald-400 bg-emerald-50 scale-[0.98]'
                      : 'border-slate-50 shadow-sm hover:border-sky-100 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    task.isTaken || isTaskTaking ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.isTaken || isTaskTaking ? (
                      <CheckCircle className={`w-7 h-7 ${isTaskTaking ? 'animate-pulse' : ''}`} />
                    ) : (
                      <Clock className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-sky-600">{task.schedule.time}</span>
                      {task.medication.hasAlarm === false && <BellOff className="w-3 h-3 text-slate-300" />}
                    </div>
                    <h4 className={`text-lg font-black tracking-tight transition-all duration-500 ${task.isTaken ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.medication.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {task.schedule.dose || task.medication.dosage}
                    </p>
                  </div>
                </div>

                {!task.isTaken && (
                  <button 
                    onClick={() => handleTake(task)}
                    disabled={!!isTaking}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                      isTaskTaking 
                        ? 'bg-emerald-500 text-white scale-110 rotate-[360deg]' 
                        : 'bg-slate-900 text-white active:scale-90 shadow-slate-900/30'
                    }`}
                  >
                    <Check className="w-7 h-7 stroke-[3]" />
                  </button>
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-slate-200">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Tot al dia!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
