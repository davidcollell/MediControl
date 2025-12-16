import React, { useEffect, useState } from 'react';
import { HistoryLog, Medication } from '../types';
import { getLogs, updateLog, deleteLog, getMedications } from '../services/storage';
import { Calendar, CheckCircle2, Pencil, Trash2, X, Save, Clock, BarChart3, TrendingUp, Award, Ban, Check } from 'lucide-react';
import { Button } from './Button';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [editingLog, setEditingLog] = useState<HistoryLog | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'taken' | 'skipped'>('taken');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allLogs = getLogs();
    setLogs(allLogs.reverse()); // Ordenat del més recent al més antic
    
    // Calcular l'objectiu diari basat en medicaments actius "Cada dia"
    const meds = getMedications();
    const dailyMedsCount = meds.filter(m => m.frequency === 'Cada dia').length;
    setDailyTarget(dailyMedsCount);
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

  // --- CÀLCULS ESTADÍSTICS ---

  // 1. Dades Setmanals (Últims 7 dies)
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toDateString();
      
      // Només comptem els que tenen status 'taken'
      const takenCount = logs.filter(l => 
        new Date(l.takenAt).toDateString() === dateStr && l.status === 'taken'
      ).length;

      // Evitem dividir per 0 si no hi ha medicaments configurats
      const target = dailyTarget || 1; 
      // Limitem al 100% visualment encara que n'hagis pres més (p.ex. "Si és necessari")
      const percentage = Math.min(100, Math.round((takenCount / target) * 100));
      
      data.push({
        dayName: d.toLocaleDateString('ca-ES', { weekday: 'short' }).slice(0, 2),
        fullDate: dateStr,
        percentage,
        count: takenCount,
        isToday: i === 0
      });
    }
    return data;
  };

  // 2. Dades Mensuals (Mes actual)
  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonthLogs = logs.filter(l => {
      const d = new Date(l.takenAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const daysInMonthSoFar = now.getDate();
    // Estimació simple: Objectiu diari * dies transcorreguts
    const totalExpected = (dailyTarget || 1) * daysInMonthSoFar; 
    const totalTaken = currentMonthLogs.filter(l => l.status === 'taken').length;
    
    const monthlyAdherence = dailyTarget > 0 
      ? Math.round((totalTaken / totalExpected) * 100) 
      : 0;

    return {
      totalTaken,
      adherence: Math.min(100, monthlyAdherence)
    };
  };

  const weeklyData = getLast7DaysData();
  const monthlyStats = getMonthlyStats();

  const groupedLogs = logs.slice(0, 50).reduce((acc, log) => {
    const date = new Date(log.takenAt).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, HistoryLog[]>);

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Historial i Progrés</h1>
        <p className="text-xl text-slate-500">La teva constància al detall.</p>
      </header>

      {/* SECCIÓ ESTADÍSTIQUES */}
      <div className="grid gap-4">
        {/* Gràfic Setmanal */}
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800">Últims 7 dies</h2>
            </div>
          </div>
          
          <div className="flex justify-between items-end h-48 gap-3">
            {weeklyData.map((day, idx) => {
              // Determinem color segons %
              let barColor = 'bg-slate-200';
              let shadowColor = 'transparent';
              
              if (day.count > 0) {
                 if (day.percentage >= 100) {
                   barColor = 'bg-emerald-500';
                   shadowColor = 'shadow-emerald-200';
                 } else if (day.percentage >= 50) {
                   barColor = 'bg-sky-500';
                   shadowColor = 'shadow-sky-200';
                 } else {
                   barColor = 'bg-orange-400';
                   shadowColor = 'shadow-orange-200';
                 }
              }

              // Assegurem que la barra tingui un mínim d'alçada estètica si hi ha preses (encara que sigui baix %)
              // o un mínim absolut per al 0 (fons gris)
              const displayHeight = day.count > 0 ? Math.max(day.percentage, 15) : 100;

              return (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group">
                  
                  {/* Container de la barra */}
                  <div className="w-full relative flex items-end justify-center h-full">
                     {/* Fons de la pista */}
                     <div className="absolute inset-0 bg-slate-100 rounded-2xl w-full"></div>
                     
                     {/* Barra de Progrés */}
                     <div 
                      className={`w-full relative z-10 rounded-2xl transition-all duration-700 ease-out shadow-lg ${shadowColor} ${barColor}`}
                      style={{ height: day.count > 0 ? `${displayHeight}%` : '8px' }} 
                     >
                       {/* Número dins o sobre la barra */}
                       {day.count > 0 && (
                         <div className={`absolute left-1/2 -translate-x-1/2 font-bold text-sm ${day.percentage > 30 ? 'top-2 text-white/90' : '-top-7 text-slate-600'}`}>
                           {day.count}
                         </div>
                       )}
                     </div>
                  </div>

                  {/* Etiqueta del dia */}
                  <span className={`text-sm font-bold uppercase tracking-wide ${day.isToday ? 'text-sky-600' : 'text-slate-400'}`}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resum Mensual */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-100 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-sky-600 mb-2" />
            <span className="text-3xl font-black text-sky-800">{monthlyStats.adherence}%</span>
            <span className="text-sm font-bold text-sky-600 uppercase tracking-wide">Compliment Mes</span>
          </div>
          <div className="bg-purple-50 p-5 rounded-3xl border-2 border-purple-100 flex flex-col items-center justify-center text-center">
            <Award className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-3xl font-black text-purple-800">{monthlyStats.totalTaken}</span>
            <span className="text-sm font-bold text-purple-600 uppercase tracking-wide">Total Preses</span>
          </div>
        </div>
      </div>

      {/* LLISTAT DE REGISTRES */}
      <div className="space-y-6 pt-4 border-t-2 border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Registre Detallat</h2>
        
        {Object.entries(groupedLogs).map(([date, dayLogs]) => {
          const logsForDay = dayLogs as HistoryLog[];
          return (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4 text-sm font-bold text-slate-500 uppercase tracking-wide px-2">
                <Calendar className="w-4 h-4" />
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

        {logs.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-lg">
            No hi ha dades suficients per mostrar estadístiques.
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