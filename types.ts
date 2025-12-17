export enum Frequency {
  DAILY = 'Cada dia',
  WEEKLY = 'Setmanalment',
  AS_NEEDED = 'Si és necessari'
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  time: string; // HH:mm format
  notes?: string;
  color: string;
  enableNotifications: boolean;
}

export interface HistoryLog {
  id: string;
  medicationId: string;
  medicationName: string;
  takenAt: string; // ISO String
  status: 'taken' | 'skipped';
}

export type Tab = 'dashboard' | 'meds' | 'history' | 'assistant';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}