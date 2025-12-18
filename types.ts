export enum Frequency {
  DAILY = 'Cada dia',
  WEEKLY = 'Setmanalment',
  AS_NEEDED = 'Si és necessari',
  CUSTOM = 'Personalitzat'
}

export interface Schedule {
  id: string;
  time: string; // HH:mm format
  days: number[]; // 0-6, on 0 és Diumenge, 1 Dilluns, etc.
  dose?: string; // Opcional, per si la dosi canvia segons l'hora
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  // time: string; // DEPRECATED: Replaced by schedules
  schedules: Schedule[]; 
  notes?: string;
  reminderMessage?: string; // Missatge personalitzat per a la notificació
  color: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type Tab = 'dashboard' | 'meds' | 'history';