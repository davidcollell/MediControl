import React, { useState } from 'react';
import { Medication, Frequency, Schedule } from '../types';
import { saveMedication, deleteMedication } from '../services/storage';
import { Button } from './Button';
import { 
  Plus, Trash2, Pill, AlertTriangle, RefreshCw, X, Check, Bell, BellOff, Clock,
  Tablets, Syringe, Droplets, Wind, Heart, Zap, Thermometer, Baby, Pencil
} from 'lucide-react';

interface MedicationListProps {
  medications: Medication[];
  onUpdate: () => void;
}

const COLORS = [
  { id: 'blue', label: 'Blau', bg: 'bg-sky-500', ring: 'ring-sky-300' },
  { id: 'red', label: 'Vermell', bg: 'bg-red-500', ring: 'ring-red-300' },
  { id: 'green', label: 'Verd', bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
  { id: 'purple', label: 'Lila', bg: 'bg-purple-500', ring: 'ring-purple-300' },
  { id: 'orange', label: 'Taronja', bg: 'bg-orange-500', ring: 'ring-orange-300' },
];

const ICONS = [
  { id: 'pill', label: 'Pastilla', component: Pill },
  { id: 'tablets', label: 'Blister', component: Tablets },
  { id: 'syringe', label: 'Xeringa', component: Syringe },
  { id: 'droplets', label: 'Gotes', component: Droplets },
  { id: 'wind', label: 'Inhalador', component: Wind },
  { id: 'heart', label: 'Cor', component: Heart },
  { id: 'zap', label: 'Vitamines', component: Zap },
  { id: 'thermometer', label: 'Febre', component: Thermometer },
  { id: 'baby', label: 'Pediàtric', component: Baby },
];

const DAYS_OF_WEEK = [
  { val: 1, label: 'Dl' },
  { val: 2, label: 'Dm' },
  { val: 3, label: 'Dc' },
  { val: 4, label: 'Dj' },
  { val: 5, label: 'Dv' },
  { val: 6, label: 'Ds' },
  { val: 0, label: 'Dg' },
];

const getIconComponent = (iconId: string | undefined) => {
  const icon = ICONS.find(i => i.id === iconId);
  return icon ? icon.component : Pill;
};

export const MedicationList: React.FC<MedicationListProps> = ({ medications, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    schedules: [{ id: 'init', time: '08:00', days: [0,1,2,3,4,5,6] }],
    color: 'blue',
    icon: 'pill',
    hasAlarm: true,
    stock: 20,
    unitsPerDose: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.schedules || formData.schedules.length === 0) return;

    const newMed: Medication = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      dosage: formData.dosage || '1 unitat',
      frequency: Frequency.CUSTOM, 
      schedules: formData.schedules,
      color: formData.color || 'blue',
      icon: formData.icon || 'pill',
      hasAlarm: formData.hasAlarm !== false,
      notes: '',
      stock: formData.stock || 0,
      unitsPerDose: formData.unitsPerDose || 1,
      lowStockThreshold: 5
    };

    saveMedication(newMed);
    onUpdate();
    handleCancel();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      dosage: '', 
      schedules: [{ id: crypto.randomUUID(), time: '08:00', days: [0,1,2,3,4,5,6] }],
      color: 'blue',
      icon: 'pill',
      hasAlarm: true,
      stock: 20,
      unitsPerDose: 1
    });
  };

  const handleEdit = (med: Medication) => {
    setEditingId(med.id);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      schedules: JSON.parse(JSON.stringify(med.schedules)),
      color: med.color,
      icon: med.icon,
      hasAlarm: med.hasAlarm,
      stock: med.stock,
      unitsPerDose: med.unitsPerDose,
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Estàs segur que vols eliminar aquest medicament?')) {
      deleteMedication(id);
      onUpdate();
    }
  };

  const handleRefill = (med: Medication) => {
    // Utilitzem un prompt senzill, però es podria fer un modal més gran.
    const amount = prompt(`Quantes unitats vols afegir a ${med.name}?`, '30');
    if (amount && !isNaN(parseInt(amount))) {
      const updatedMed = { ...med, stock: med.stock + parseInt(amount) };
      saveMedication(updatedMed);
      onUpdate();
    }
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: any) => {
    const newSchedules = [...(formData.schedules || [])];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  const toggleDay = (scheduleIndex: number, dayVal: number) => {
    const newSchedules = [...(formData.schedules || [])];
    const currentDays = newSchedules[scheduleIndex].days;
    let newDays;
    if (currentDays.includes(dayVal)) {
      newDays = currentDays.filter(d => d !== dayVal);
    } else {
      newDays = [...currentDays, dayVal];
    }
    newSchedules[scheduleIndex].days = newDays;
    setFormData({ ...formData, schedules: newSchedules });
  };

  const addSchedule = () => {
    const newSchedules = [...(formData.schedules || []), { id: crypto.randomUUID(), time: '20:00', days: [0,1,2,3,4,5,6] }];
    setFormData({ ...formData, schedules: newSchedules });
  };

  const removeSchedule = (index: number) => {
    if ((formData.schedules?.length || 0) <= 1) return;
    const newSchedules = [...(formData.schedules || [])];
    newSchedules.splice(index, 1);
    setFormData({ ...formData, schedules: newSchedules });
  };

  if (isAdding) {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900">{editingId ? 'Editar' : 'Nou Medicament'}</h2>
          <button onClick={handleCancel} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200">
            <X className="w-8 h-8 text-slate-700" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xl font-bold text-slate-800 mb-3">Nom del medicament</label>
            <input
              type="text"
              required
              className="w-full p-5 text-2xl rounded-3xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-200 bg-white text-slate-900"
              placeholder="Ex: Ibuprofè"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xl font-bold text-slate-800 mb-3">Dosi (Quantitat)</label>
            <input
              type="text"
              className="w-full p-5 text-2xl rounded-3xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 bg-white text-slate-900"
              placeholder="Ex: 1 pastilla, 400mg"
              value={formData.dosage}
              onChange={e => setFormData({...formData, dosage: e.target.value})}
            />
          </div>

          {/* SCHEDULES BUILDER */}
          <div className="bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 space-y-5">
            <label className="block text-xl font-bold text-slate-800">A quina hora?</label>
            
            {formData.schedules?.map((schedule, idx) => (
              <div key={schedule.id || idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3 w-full">
                    <Clock className="w-8 h-8 text-sky-600" />
                    <input
                      type="time"
                      required
                      className="text-4xl font-black text-slate-900 bg-transparent focus:outline-none underline decoration-sky-300 decoration-4"
                      value={schedule.time}
                      onChange={e => updateSchedule(idx, 'time', e.target.value)}
                    />
                  </div>
                  {formData.schedules && formData.schedules.length > 1 && (
                    <button type="button" onClick={() => removeSchedule(idx)} className="p-3 text-red-500 bg-red-50 rounded-2xl">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = schedule.days.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => toggleDay(idx, day.val)}
                        className={`aspect-square rounded-xl text-lg font-bold flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-sky-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            
            <Button type="button" variant="secondary" onClick={addSchedule} fullWidth className="text-xl py-5 border-dashed border-2">
              <Plus className="w-6 h-6" /> Afegir una altra hora
            </Button>
          </div>

          {/* Alarm Toggle */}
          <div className="bg-white p-5 rounded-3xl flex items-center justify-between border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${formData.hasAlarm ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                {formData.hasAlarm ? <Bell className="w-8 h-8" /> : <BellOff className="w-8 h-8" />}
              </div>
              <span className="text-xl font-bold text-slate-800">Avisar-me (Alarma)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer p-2">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.hasAlarm}
                onChange={e => setFormData({...formData, hasAlarm: e.target.checked})}
              />
              <div className="w-16 h-9 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[12px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xl font-bold text-slate-800 mb-3">Tria el dibuix</label>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {ICONS.map((i) => {
                const IconComponent = i.component;
                const isSelected = formData.icon === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setFormData({...formData, icon: i.id})}
                    className={`w-20 h-20 rounded-3xl flex-shrink-0 flex items-center justify-center transition-all border-4 ${
                      isSelected 
                        ? 'bg-sky-100 border-sky-500 text-sky-700 scale-105' 
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <IconComponent className="w-10 h-10" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-3xl space-y-5">
             <div>
              <label className="block text-xl font-bold text-slate-800 mb-3">Quantes en tens (Estoc)?</label>
              <input
                type="number"
                min="0"
                className="w-full p-5 text-2xl rounded-3xl border-2 border-slate-300 bg-white text-slate-900"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="pt-4 space-y-4 pb-20">
            <Button type="submit" fullWidth className="text-2xl py-6 bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800">
              {editingId ? 'GUARDAR CANVIS' : 'GUARDAR TOT'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={handleCancel} className="text-xl py-6">
              Cancel·lar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Les meves pastilles</h1>
      </header>

      {/* BIG ADD BUTTON */}
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full bg-sky-600 text-white rounded-3xl p-6 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform border-b-4 border-sky-800"
      >
        <div className="bg-white/20 p-2 rounded-full">
           <Plus className="w-10 h-10 text-white stroke-[3]" />
        </div>
        <span className="text-2xl font-black">Afegir Medicament</span>
      </button>

      <div className="space-y-5">
        {medications.map(med => {
          const isLowStock = med.stock <= (med.lowStockThreshold || 5);
          const IconComponent = getIconComponent(med.icon);

          return (
            <div key={med.id} className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-200 flex flex-col gap-4">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-600">
                  <IconComponent className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 leading-none mb-2">
                    {med.name}
                  </h3>
                  <p className="text-xl text-slate-600 font-medium">{med.dosage}</p>
                  
                  {/* Hores Chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {med.schedules.map((s, idx) => (
                      <span key={idx} className="text-lg font-bold bg-sky-50 text-sky-800 px-3 py-1 rounded-xl border border-sky-100">
                        {s.time}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100 mt-2 gap-2">
                 <div className={`flex-1 flex items-center gap-2 text-lg px-4 py-3 rounded-2xl font-bold ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                  {isLowStock ? <AlertTriangle className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                  <span>Queden: {med.stock}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRefill(med)}
                    className="p-4 text-sky-700 bg-sky-100 rounded-2xl border-2 border-sky-200"
                    aria-label="Afegir més pastilles"
                  >
                    <RefreshCw className="w-8 h-8 stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={() => handleEdit(med)}
                    className="p-4 text-slate-600 bg-slate-100 rounded-2xl border-2 border-slate-200"
                    aria-label="Editar"
                  >
                    <Pencil className="w-8 h-8 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {medications.length === 0 && (
          <div className="text-center text-slate-400 py-12 text-2xl font-medium px-6">
            Encara no tens cap pastilla. <br/>Toca el botó blau de dalt per començar.
          </div>
        )}
      </div>
    </div>
  );
};