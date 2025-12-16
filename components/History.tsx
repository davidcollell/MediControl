import React, { useEffect, useState } from 'react';
import { HistoryLog, Medication } from '../types';
import { getLogs, updateLog, deleteLog, getMedications } from '../services/storage';
import { Calendar as CalendarIcon, Pencil, Trash2, X, Save, Clock, TrendingUp, Award, Ban, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  
  // Estats per al Calendari
  const [currentDate, setCurrentDate] = useState(new Date()); // Mes que estem veient
  const [selectedDay, setSelectedDay] = useState<Date | null>(null); // Dia seleccionat per filtrar llista

  // Estats per a l'Edició
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
    setEditingLog(log);
    const d = new Date(log.takenAt);
    const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setEditDate(localIso);
    setEditStatus(log.status || 'taken');
  };

  const handleSaveEdit = () => {
    if (editingLog && editDate) {
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
    if (confirm('Segur que vols eliminar aquest registre?')) {
      deleteLog(id);
      refreshData();
    }
  };

  // --- LÒGICA DEL CALENDARI ---

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Dg, 1 = Dl
    
    // Ajustar perquè la setmana comenci en Dilluns (standard català/europeu)
    // 0 (Dg) -> 6, 1 (Dl) -> 0, etc.
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    return { days, firstDayOfWeek: adjustedFirstDay };
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setSelectedDay(null); // Reset selection on month change
  };

  const getDayStatus = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = checkDate.toDateString();
    const dayOfWeek = checkDate.getDay(); // 0 = Dg, 1 = Dl...

    // 1. Calcular Dosis Esperades (Expected)
    let expectedCount = 0;
    medications.forEach(med => {
      // Sumem quantes preses toquen avui segons l'horari
      const schedulesToday = med.schedules.filter(s => s.days.includes(dayOfWeek));
      expectedCount += schedulesToday.length;
    });

    // 2. Calcular Dosis Preses (Actual)
    const logsForDay = logs.filter(l => 
      new Date(l.takenAt).toDateString() === dateStr && l.status === 'taken'
    );
    const takenCount = logsForDay.length;

    // 3. Determinar Estat
    if (expectedCount === 0) return 'none'; // Dia de descans
    if (takenCount >= expectedCount) return 'perfect';
    if (takenCount > 0) return 'partial';
    
    // Si no n'he pres cap, però n'havia de prendre, comprovem si el dia ja ha passat
    const today = new Date();
    today.setHours(0,0,0,0);
    if (checkDate < today) return 'missed';
    
    return 'pending'; // Dia futur o avui sense començar
  };

  const { days, firstDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });

  // --- DADES MENSUALS GENERALS ---
  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonthLogs = logs.filter(l => {
      const d = new Date(l.takenAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const totalTaken = currentMonthLogs.filter(l => l.status === 'taken').length;
    // L'adherència global és més complexa de calcular exactament sense historial d'horaris,
    // així que mostrem el total acumulat com a mètrica positiva.
    return { totalTaken };
  };

  const monthlyStats = getMonthlyStats();

  // --- FILTRATGE DE LLISTA ---
  const filteredLogs = selectedDay 
    ? logs.filter(l => new Date(l.takenAt).toDateString() === selectedDay.toDateString())
    : logs;

  const groupedLogs = filteredLogs.slice(0, 50).reduce((acc, log) => {
    const date = new Date(log.takenAt).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, HistoryLog[]>);

  return (
    <div className="space-y-6 pb-32">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Historial</h1>
        <p className="text-xl text-slate-500">Calendari d'adherència.</p>
      </header>

      {/* RESUM MENSUAL SIMPLE */}
      <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <div className="bg-sky-100 p-3 rounded-2xl text-sky-600">
             <Award className="w-8 h-8" />
           </div>
           <div>
             <span className="block text-3xl font-black text-slate-800">{monthlyStats.totalTaken}</span>
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Preses aquest mes</span>
           </div>
        </div>
        <TrendingUp className="w-12 h-12 text-sky-200" />
      </div>

      {/* CALENDARI */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
        {/* Navegació Mes */}
        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 capitalize">{monthName}</h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Capçaleres Dies Setmana */}
        <div className="grid grid-cols-7 mb-2">
          {['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Dies */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {Array.from({ length: days }).map((_, i) => {
            const dayNum = i + 1;
            const status = getDayStatus(dayNum);
            const isSelected = selectedDay?.getDate() === dayNum && selectedDay?.getMonth() === currentDate.getMonth();
            const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

            let bgClass = 'bg-slate-50 text-slate-400';
            if (status === 'perfect') bgClass = 'bg-emerald-400 text-white shadow-emerald-200';
            else if (status === 'partial') bgClass = 'bg-orange-400 text-white shadow-orange-200';
            else if (status === 'missed') bgClass = 'bg-red-400 text-white shadow-red-200';
            else if (status === 'pending') bgClass = 'bg-slate-100 text-slate-500';

            if (isSelected) bgClass += ' ring-4 ring-sky-300 z-10 scale-110';
            if (isToday && !isSelected) bgClass += ' ring-2 ring-sky-200';

            return (
              <button
                key={dayNum}
                onClick={() => {
                  const newSelected = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                  if (selectedDay && selectedDay.getTime() === newSelected.getTime()) {
                    setSelectedDay(null); // Deselect
                  } else {
                    setSelectedDay(newSelected);
                  }
                }}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${bgClass}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
        
        {/* Llegenda */}
        <div className="flex justify-center gap-4 mt-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-400"></div>Complet</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-400"></div>Parcial</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400"></div>Oblidat</div>
        </div>
      </div>

      {/* LLISTAT DE REGISTRES */}
      <div className="space-y-6 pt-4 border-t-2 border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedDay ? `Registres del ${selectedDay.toLocaleDateString()}` : 'Últims Registres'}
          </h2>
          {selectedDay && (
            <button 
              onClick={() => setSelectedDay(null)}
              className="text-sm font-bold text-sky-600 flex items-center gap-1 bg-sky-50 px-3 py-1 rounded-full"
            >
              <RotateCcw className="w-4 h-4" /> Veure tot
            </button>
          )}
        </div>
        
        {Object.entries(groupedLogs).map(([date, dayLogs]) => {
          const logsForDay = dayLogs as HistoryLog[];
          return (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wide px-2">
                <CalendarIcon className="w-4 h-4" />
                {date}
              </div>
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
                {logsForDay.map((log, index) => {
                  const isSkipped = log.status === 'skipped';
                  return (
                    <div 
                      key={log.id} 
                      className={`p-5 flex justify-between items-center ${index !== logsForDay.length - 1 ? 'border-b-2 border-slate-50' : ''} ${isSkipped ? 'bg-red-50/50' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${isSkipped ? 'text-red-700 decoration-red-300' : 'text-slate-800'}`}>
                            {log.medicationName}
                          </span>
                          {isSkipped && (
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                              NO PRES
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(log.takenAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(log)}
                          className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed">
            <p className="text-slate-400 text-lg">No hi ha registres per mostrar.</p>
          </div>
        )}
      </div>

      {/* Modal d'Edició */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Editar Registre</h3>
              <button 
                onClick={() => setEditingLog(null)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Medicament</label>
                <p className="text-xl font-bold text-slate-800">{editingLog.medicationName}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Estat</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditStatus('taken')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
                      editStatus === 'taken'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    Pres
                  </button>
                  <button
                    onClick={() => setEditStatus('skipped')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
                      editStatus === 'skipped'
                        ? 'bg-red-100 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Ban className="w-5 h-5" />
                    No Pres
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Data i Hora</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-4 text-xl rounded-2xl border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button onClick={handleSaveEdit} fullWidth className="text-lg">
                  <Save className="w-6 h-6" />
                  GUARDAR CANVIS
                </Button>
                <Button variant="ghost" onClick={() => setEditingLog(null)} fullWidth>
                  Cancel·lar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};