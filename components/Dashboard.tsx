import React, { useEffect, useState } from 'react';
import { Medication, HistoryLog } from '../types';
import { getTodaysLogs, saveLog } from '../services/storage';
import { Button } from './Button';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface DashboardProps {
  medications: Medication[];
  onUpdate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ medications, onUpdate }) => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setLogs(getTodaysLogs());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [medications]); // Re-fetch logs if meds change (though logs depend on user action)

  const handleTake = (med: Medication) => {
    const newLog: HistoryLog = {
      id: crypto.randomUUID(),
      medicationId: med.id,
      medicationName: med.name,
      takenAt: new Date().toISOString(),
      status: 'taken'
    };
    saveLog(newLog);
    setLogs([...logs, newLog]);
    onUpdate(); // Trigger parent refresh if needed
  };

  // Sort meds: Pending first (sorted by time), then Taken
  const sortedMeds = [...medications].sort((a, b) => {
    const isTakenA = logs.some(l => l.medicationId === a.id);
    const isTakenB = logs.some(l => l.medicationId === b.id);
    if (isTakenA === isTakenB) {
      return a.time.localeCompare(b.time);
    }
    return isTakenA ? 1 : -1;
  });

  const getStatusColor = (med: Medication, isTaken: boolean) => {
    if (isTaken) return 'bg-green-50 border-green-200 text-green-700';
    
    // Check if overdue
    const [hours, minutes] = med.time.split(':').map(Number);
    const medTime = new Date();
    medTime.setHours(hours, minutes, 0);
    
    if (currentTime > medTime) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-white border-slate-200 text-slate-700';
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Hola! 👋</h1>
        <p className="text-slate-500">Aquí tens la teva medicació per avui.</p>
      </header>

      <div className="space-y-4">
        {sortedMeds.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No tens medicaments programats.</p>
            <p className="text-sm text-slate-400">Afegeix-ne un a la pestanya de medicaments.</p>
          </div>
        ) : (
          sortedMeds.map(med => {
            const isTaken = logs.some(l => l.medicationId === med.id);
            const statusClass = getStatusColor(med, isTaken);

            return (
              <div 
                key={med.id} 
                className={`p-4 rounded-2xl border transition-all ${statusClass} shadow-sm`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 opacity-70" />
                      <span className="font-semibold text-sm opacity-90">{med.time}</span>
                    </div>
                    <h3 className={`font-bold text-lg ${isTaken ? 'line-through opacity-50' : ''}`}>
                      {med.name}
                    </h3>
                    <p className="text-sm opacity-70">{med.dosage} • {med.frequency}</p>
                  </div>

                  {isTaken ? (
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleTake(med)}
                      className="bg-sky-500 hover:bg-sky-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg shadow-sky-500/40"
                    >
                      <Check className="w-6 h-6" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};