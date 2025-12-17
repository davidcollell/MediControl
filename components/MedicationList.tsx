import React, { useState } from 'react';
import { Medication, Frequency } from '../types';
import { saveMedication, deleteMedication } from '../services/storage';
import { Button } from './Button';
import { Plus, Trash2, Pill, Bell, BellOff } from 'lucide-react';

interface MedicationListProps {
  medications: Medication[];
  onUpdate: () => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    time: '08:00',
    frequency: Frequency.DAILY,
    color: 'blue',
    enableNotifications: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.time) return;

    const newMed: Medication = {
      id: crypto.randomUUID(),
      name: formData.name,
      dosage: formData.dosage || '1 unitat',
      frequency: formData.frequency as Frequency,
      time: formData.time,
      color: 'blue',
      notes: '',
      enableNotifications: formData.enableNotifications ?? true
    };

    saveMedication(newMed);
    onUpdate();
    setIsAdding(false);
    setFormData({ 
      name: '', 
      dosage: '', 
      time: '08:00', 
      frequency: Frequency.DAILY, 
      enableNotifications: true 
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Estàs segur que vols eliminar aquest medicament?')) {
      deleteMedication(id);
      onUpdate();
    }
  };

  if (isAdding) {
    return (
      <div className="space-y-6 pb-24">
        <header>
          <h2 className="text-xl font-bold text-slate-900">Nou Medicament</h2>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom del medicament</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex: Ibuprofè"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosi</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ex: 400mg"
                value={formData.dosage}
                onChange={e => setFormData({...formData, dosage: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
              <input
                type="time"
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Freqüència</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              value={formData.frequency}
              onChange={e => setFormData({...formData, frequency: e.target.value as Frequency})}
            >
              {Object.values(Frequency).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Toggle Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${formData.enableNotifications ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                {formData.enableNotifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-900">Notificacions</span>
                <span className="block text-xs text-slate-500">Rebre avisos al mòbil</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({...formData, enableNotifications: !formData.enableNotifications})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                formData.enableNotifications ? 'bg-sky-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`${
                  formData.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)} className="flex-1">
              Cancel·lar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Els meus medicaments</h1>
        <Button onClick={() => setIsAdding(true)} className="!p-2 rounded-full w-10 h-10">
          <Plus className="w-6 h-6" />
        </Button>
      </header>

      <div className="space-y-3">
        {medications.map(med => (
          <div key={med.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {med.name}
                  {!med.enableNotifications && (
                     <BellOff className="w-3 h-3 text-slate-400" />
                  )}
                </h3>
                <p className="text-xs text-slate-500">{med.dosage} • {med.time}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(med.id)}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        
        {medications.length === 0 && (
          <div className="text-center text-slate-400 py-10">
            No hi ha medicaments configurats.
          </div>
        )}
      </div>
    </div>
  );
};