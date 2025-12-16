import { Medication, HistoryLog, Schedule } from '../types';

const MEDS_KEY = 'medicontrol_meds';
const LOGS_KEY = 'medicontrol_logs';

export const getMedications = (): Medication[] => {
  const stored = localStorage.getItem(MEDS_KEY);
  if (!stored) return [];
  
  const meds: any[] = JSON.parse(stored);
  
  // Migració en calent per a dades antigues que tenien 'time' però no 'schedules'
  return meds.map(med => {
    if (!med.schedules || med.schedules.length === 0) {
      if (med.time) {
        // Convertim l'hora antiga en un horari diari
        const newSchedule: Schedule = {
          id: 'legacy-migration',
          time: med.time,
          days: [0, 1, 2, 3, 4, 5, 6] // Cada dia
        };
        return { ...med, schedules: [newSchedule] };
      }
    }
    return med;
  });
};

export const saveMedication = (med: Medication): void => {
  const meds = getMedications();
  const existingIndex = meds.findIndex(m => m.id === med.id);
  if (existingIndex >= 0) {
    meds[existingIndex] = med;
  } else {
    meds.push(med);
  }
  localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
};

export const deleteMedication = (id: string): void => {
  const meds = getMedications().filter(m => m.id !== id);
  localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
};

export const getLogs = (): HistoryLog[] => {
  const stored = localStorage.getItem(LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLog = (log: HistoryLog): void => {
  const logs = getLogs();
  logs.push(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const updateLog = (updatedLog: HistoryLog): void => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === updatedLog.id);
  if (index !== -1) {
    logs[index] = updatedLog;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
};

export const deleteLog = (id: string): void => {
  const logs = getLogs().filter(l => l.id !== id);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const getTodaysLogs = (): HistoryLog[] => {
  const logs = getLogs();
  const today = new Date().toDateString();
  return logs.filter(log => new Date(log.takenAt).toDateString() === today);
};