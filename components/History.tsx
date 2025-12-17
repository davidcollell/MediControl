import React, { useEffect, useState } from 'react';
import { HistoryLog } from '../types';
import { getLogs } from '../services/storage';
import { Calendar, CheckCircle2 } from 'lucide-react';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);

  useEffect(() => {
    // Get last 20 logs, reversed
    const allLogs = getLogs();
    setLogs(allLogs.reverse().slice(0, 50));
  }, []);

  // Group by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.takenAt).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, HistoryLog[]>);

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
        <p className="text-slate-500">Registre de les preses recents.</p>
      </header>

      <div className="space-y-6">
        {Object.entries(groupedLogs).map(([date, dayLogs]) => {
          const logsForDay = dayLogs as HistoryLog[];
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {logsForDay.map((log, index) => (
                  <div 
                    key={log.id} 
                    className={`p-4 flex justify-between items-center ${index !== logsForDay.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <span className="font-medium text-slate-700">{log.medicationName}</span>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span>{new Date(log.takenAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Encara no has registrat cap presa.
          </div>
        )}
      </div>
    </div>
  );
};