export enum Frequency {
  DAILY = 'Cada dia',
  WEEKLY = 'Setmanalment',
  AS_NEEDED = 'Si és necessari',
  CUSTOM = 'Personalitzat'
}

export interface Schedule {
  id: string;
  time: string; // format HH:mm
  days: number[]; // 0-6, on 0 és Diumenge, 1 Dilluns, etc.
  dose?: string; // Opcional, per si la dosi canvia segons l'hora
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  schedules: Schedule[]; 
  notes?: string;
  reminderMessage?: string;
  color?: string;
  icon?: string;
  hasAlarm?: boolean;
  stock: number;
  unitsPerDose: number;
  lowStockThreshold: number;
}

export interface HistoryLog {
  id: string;
  medicationId: string;
  medicationName: string;
  takenAt: string; // ISO String
  status: 'taken' | 'skipped';
  scheduledTime?: string; // Per saber quina dosi del dia era
}

export interface AppSettings {
  notificationsEnabled: boolean;
  snoozeDuration: number; // en minuts
  remindBeforeMinutes: number; // 0 = a l'hora exacta, >0 = minuts abans
  vibrationEnabled: boolean;
}

export type Tab = 'dashboard' | 'meds' | 'history';