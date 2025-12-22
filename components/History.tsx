import React, { useEffect, useState, useMemo } from 'react';
import { HistoryLog, Medication } from '../types';
import { getLogs, updateLog, deleteLog, getMedications } from '../services/storage';
import { 
  Pencil, Trash2, X, Save, Clock, 
  TrendingUp, Check, ChevronLeft, ChevronRight, 
  Target, CheckCircle2, XCircle, BarChart3, CalendarDays,
  CalendarCheck2, Activity
} from 'lucide-react';
import { Button } from './Button';
import { Haptics } from '../services/haptics';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [editingLog, setEditingLog] = useState<HistoryLog | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'taken' | 'skipped'>('taken');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(getLogs().reverse());
    setMedications(getMedications());
  };

  const handleEditClick = (log: HistoryLog) => {
    Haptics.tick();
    setEditingLog(log);
    const d = new Date(log.takenAt);
    const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setEditDate(localIso);
    setEditStatus(log.status || 'taken');
  };

  const handleSaveEdit = () => {
    if (editingLog && editDate) {
      Haptics.success();
      const updatedLog: HistoryLog = {
        ...editingLog,
        takenAt: new Date(editDate).toISOString(),
        status: editStatus
      };
      updateLog(updatedLog);
      setEditingLog(null);
      refreshData();
    }
  };

  const handleDelete = (id: string) => {
    Haptics.warning();
    if (confirm('Segur que vols eliminar aquest registre?')) {
      deleteLog(id);
      refreshData();
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    return { days, firstDayOfWeek: adjustedFirstDay };
  };

  const changeMonth = (offset: number) => {
    Haptics.tick();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const getDayData = (date: Date) => {
    const dateStr = date.toDateString();
    const dayOfWeek = date.getDay();
    let expectedCount = 0;
    
    medications.forEach(med => {
      const schedulesToday = med.schedules.filter(s => s.days.includes(dayOfWeek));
      expectedCount += schedulesToday.length;
    });

    const logsForDay = logs.filter(l => new Date(l.takenAt).toDateString() === dateStr);
    const takenCount = logsForDay.filter(l => l.status === 'taken').length;
    const skippedCount = logsForDay.filter(l => l.status === 'skipped').length;
    
    return { expectedCount, takenCount, skippedCount };
  };

  const stats = useMemo(() => {
    const monthLogs = logs.filter(l => {
      const d = new Date(l.takenAt);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    
    const taken = monthLogs.filter(l => l.status === 'taken').length;
    const total = monthLogs.length;
    const adherence = total === 0 ? 0 : Math.round((taken / total) * 100);

    return { taken, adherence, total };
  }, [logs, currentDate]);

  const { days, firstDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });

  const filteredLogs = selectedDay 
    ? logs.filter(l => new Date(l.takenAt).toDateString() === selectedDay.toDateString())
    : logs;

  const groupedLogs = filteredLogs.slice(0, 30).reduce((acc, log) => {
    const date = new Date(log.takenAt).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, HistoryLog[]>);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">El teu Historial</h1>
        <p className="text-sm text-slate-500 font-medium">L'adherència és la clau de l'èxit.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="bg-sky-50 w-10 h-10 rounded-xl flex items-center justify-center text-sky-600 mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 tracking-tighter">{stats.taken}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRESES MES</span>
          </div>
        </div>
        <div className={`p-6 rounded-[2rem] shadow-lg shadow-sky-600/10 flex flex-col justify-between text-white transition-all ${stats.adherence > 80 ? 'bg-emerald-500' : 'bg-sky-600'}`}>
          <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-3xl font-black tracking-tighter">{stats.adherence}%</span>
            <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">ADHERÈNCIA</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="bg-slate-50/80 p-5 flex items-center justify-between border-b border-slate-100">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-white shadow-sm rounded-xl text-slate-600 active:scale-90 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-black text-slate-900 capitalize leading-tight">{monthName.split(' de ')[0]}</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentDate.getFullYear()}</p>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 bg-white shadow-sm rounded-xl text-slate-600 active:scale-90 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['DL', 'DT', 'DC', 'DJ', 'DV', 'DS', 'DG'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-300 tracking-widest py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {Array.from({ length: days }).map((_, i) => {
              const dayNum = i + 1;
              const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const { expectedCount, takenCount } = getDayData(checkDate);
              const isSelected = selectedDay?.getDate() === dayNum && selectedDay?.getMonth() === currentDate.getMonth();
              const isToday = new Date().toDateString() === checkDate.toDateString();
              
              let statusClass = 'bg-slate-50 text-slate-400';
              let indicator = null;

              if (expectedCount > 0) {
                if (takenCount >= expectedCount) {
                  statusClass = 'bg-emerald-100 text-emerald-800 font-black';
                  indicator = 'bg-emerald-500';
                } else if (takenCount > 0) {
                  statusClass = 'bg-amber-100 text-amber-800 font-black';
                  indicator = 'bg-amber-500';
                } else if (checkDate < new Date()) {
                  statusClass = 'bg-rose-100 text-rose-800 font-black';
                  indicator = 'bg-rose-500';
                }
              }

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    Haptics.tick();
                    const newSelected = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                    setSelectedDay(selectedDay?.getTime() === newSelected.getTime() ? null : newSelected);
                  }}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-sm ${
                    isSelected ? 'ring-2 ring-sky-500 scale-105 z-10 shadow-md' : ''
                  } ${statusClass} ${isToday && !isSelected ? 'ring-1 ring-slate-300' : ''}`}
                >
                  <span>{dayNum}</span>
                  {indicator && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${indicator}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CalendarCheck2 className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
               <div className="bg-white/10 p-2 rounded-xl">
                 <CalendarDays className="w-5 h-5 text-sky-400" />
               </div>
               <div>
                 <h3 className="text-xl font-black capitalize tracking-tight">
                  {selectedDay.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}
                 </h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Resum de la jornada</p>
               </div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 relative z-10">
             <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center border border-white/5">
                <Target className="w-5 h-5 text-slate-500 mb-2" />
                <span className="text-xl font-black">{getDayData(selectedDay).expectedCount}</span>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OBJECTIU</p>
             </div>
             <div className="bg-emerald-500/10 p-3 rounded-2xl flex flex-col items-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-xl font-black text-emerald-400">{getDayData(selectedDay).takenCount}</span>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">PRESES</p>
             </div>
             <div className="bg-rose-500/10 p-3 rounded-2xl flex flex-col items-center border border-rose-500/20">
                <XCircle className="w-5 h-5 text-rose-400 mb-2" />
                <span className="text-xl font-black text-rose-400">{getDayData(selectedDay).skippedCount}</span>
                <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">SALTADES</p>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-6 pt-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tight px-2">
          {selectedDay ? 'Activitat del dia' : 'Registres recents'}
        </h2>
        
        <div className="space-y-6">
          {(Object.entries(groupedLogs) as [string, HistoryLog[]][]).map(([date, dayLogs]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-sky-500"></div>
                {date}
              </h3>
              <div className="space-y-2">
                {dayLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`bg-white p-4 rounded-[1.8rem] border flex items-center justify-between shadow-sm transition-all hover:border-sky-200 ${
                      log.status === 'skipped' ? 'border-rose-100' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${log.status === 'skipped' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {log.status === 'skipped' ? <XCircle className="w-5 h-5" /> : <Check className="w-5 h-5 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-tight">{log.medicationName}</h4>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.takenAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button onClick={() => handleEditClick(log)} className="p-2 text-slate-300 hover:text-sky-600 rounded-lg active:scale-90">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg active:scale-90">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-20 px-8 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 text-lg font-bold">Encara no hi dades.</p>
          </div>
        )}
      </div>

      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-6 animate-in slide-in-from-bottom-8">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Editar Registre</h2>
                <p className="text-slate-500 text-sm font-bold">{editingLog.medicationName}</p>
              </div>
              <button onClick={() => setEditingLog(null)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </header>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data i Hora</label>
                <input
                  type="datetime-local"
                  className="w-full p-4 text-lg rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 bg-slate-50 font-bold"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estat de la presa</label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => { Haptics.tick(); setEditStatus('taken'); }}
                    className={`p-4 rounded-2xl font-black text-base border-2 transition-all flex items-center justify-center gap-2 ${editStatus === 'taken' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                     <CheckCircle2 className="w-5 h-5" /> PRESA
                   </button>
                   <button 
                    onClick={() => { Haptics.tick(); setEditStatus('skipped'); }}
                    className={`p-4 rounded-2xl font-black text-base border-2 transition-all flex items-center justify-center gap-2 ${editStatus === 'skipped' ? 'bg-rose-500 border-rose-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                     <XCircle className="w-5 h-5" /> SALTADA
                   </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleSaveEdit} fullWidth className="py-5 text-lg">
                <Save className="w-5 h-5" /> GUARDAR CANVIS
              </Button>
              <Button onClick={() => setEditingLog(null)} variant="ghost" fullWidth className="text-slate-400">
                Cancel·lar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};