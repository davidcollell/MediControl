import React, { useState } from 'react';
import { Medication, Frequency, Schedule } from '../types';
import { saveMedication, deleteMedication } from '../services/storage';
import { Button } from './Button';
import { 
  Plus, Trash2, Pill, AlertTriangle, RefreshCw, X, Check, Bell, BellOff, Clock,
  Tablets, Syringe, Droplets, Wind, Heart, Zap, Thermometer, Baby, Pencil, Scale, MessageSquare
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
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-500', ring: 'ring-pink-300' },
  { id: 'teal', label: 'Turquesa', bg: 'bg-teal-500', ring: 'ring-teal-300' },
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

const getColorStyles = (colorId: string) => {
  switch (colorId) {
    case 'red': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    case 'green': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'purple': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    case 'orange': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    case 'pink': return { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' };
    case 'teal': return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' };
    default: return { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' };
  }
};

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
    reminderMessage: '',
    schedules: [{ id: 'init', time: '08:00', days: [0,1,2,3,4,5,6], dose: '' }],
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
      reminderMessage: formData.reminderMessage || '',
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
      reminderMessage: '',
      schedules: [{ id: crypto.randomUUID(), time: '08:00', days: [0,1,2,3,4,5,6], dose: '' }],
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
      reminderMessage: med.reminderMessage || '',
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
    const newSchedules = [...(formData.schedules || []), { id: crypto.randomUUID(), time: '20:00', days: [0,1,2,3,4,5,6], dose: '' }];
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
      <div className="space-y-6 pb-32 animate-in slide-in-from-bottom-4 duration-300">
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Medicament' : 'Nou Medicament'}</h2>
          <button onClick={handleCancel} className="p-2 bg-slate-100 rounded-full">
            <X className="w-8 h-8 text-slate-600" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="block text-lg font-bold text-slate-800 mb-2">Nom del medicament</label>
              <input
                type="text"
                required
                className="w-full p-4 text-xl rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-200 bg-white text-slate-900"
                placeholder="Ex: Ibuprofè"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-800 mb-2">Dosi General</label>
              <input
                type="text"
                className="w-full p-4 text-xl rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 bg-white text-slate-900"
                placeholder="Ex: 400mg"
                value={formData.dosage}
                onChange={e => setFormData({...formData, dosage: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                Missatge del recordatori
              </label>
              <textarea
                className="w-full p-4 text-lg rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 bg-white text-slate-900 min-h-[100px]"
                placeholder="Ex: Pren-t'ho amb l'esmorzar / No oblidis beure aigua..."
                value={formData.reminderMessage}
                onChange={e => setFormData({...formData, reminderMessage: e.target.value})}
              />
              <p className="text-sm text-slate-500 mt-1 ml-2">Aquest missatge apareixerà a la notificació de l'alarma.</p>
            </div>
          </div>

          {/* SCHEDULES BUILDER */}
          <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xl font-black text-slate-800">
                 Horaris i Preses
              </label>
            </div>
            
            {formData.schedules?.map((schedule, idx) => (
              <div key={schedule.id || idx} className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm relative">
                
                {/* Header: Time and Delete */}
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                   <div className="flex items-center gap-3">
                      <div className="bg-sky-50 p-2 rounded-xl">
                        <Clock className="w-6 h-6 text-sky-600" />
                      </div>
                      <input
                        type="time"
                        required
                        className="text-3xl font-black text-slate-900 bg-transparent focus:outline-none focus:underline decoration-sky-400 decoration-4 rounded-lg"
                        value={schedule.time}
                        onChange={e => updateSchedule(idx, 'time', e.target.value)}
                      />
                   </div>
                   {formData.schedules && formData.schedules.length > 1 && (
                    <button type="button" onClick={() => removeSchedule(idx)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Specific Dose Input */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">Dosi per aquesta hora (Opcional)</label>
                  <input 
                    type="text"
                    placeholder={`Igual que la general (${formData.dosage || '...'})`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-medium focus:border-sky-500 outline-none"
                    value={schedule.dose || ''}
                    onChange={e => updateSchedule(idx, 'dose', e.target.value)}
                  />
                </div>

                {/* Days Selector */}
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Dies de la setmana</label>
                   <div className="flex justify-between gap-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = schedule.days.includes(day.val);
                      return (
                        <button
                          key={day.val}
                          type="button"
                          onClick={() => toggleDay(idx, day.val)}
                          className={`flex-1 aspect-square rounded-xl text-base font-bold flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-sky-600 text-white shadow-md scale-105 ring-2 ring-sky-200' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            ))}
            
            <Button type="button" variant="secondary" onClick={addSchedule} fullWidth className="border-dashed border-2 py-5 text-lg">
              <Plus className="w-6 h-6" /> Afegir una altra presa
            </Button>
          </div>

          {/* Alarm Toggle */}
          <div className="bg-white p-5 rounded-2xl flex items-center justify-between border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${formData.hasAlarm ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-400'}`}>
                {formData.hasAlarm ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
              </div>
              <span className="text-lg font-bold text-slate-700">Avisar-me (Notificació)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.hasAlarm}
                onChange={e => setFormData({...formData, hasAlarm: e.target.checked})}
              />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Icon & Color Picker */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="block text-lg font-bold text-slate-800 mb-3">Tria el dibuix</label>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {ICONS.map((i) => {
                  const IconComponent = i.component;
                  const isSelected = formData.icon === i.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setFormData({...formData, icon: i.id})}
                      className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                        isSelected 
                          ? 'bg-sky-100 border-sky-500 text-sky-700 shadow-md scale-105' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <IconComponent className="w-8 h-8" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-800 mb-3">Color de la targeta</label>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData({...formData, color: c.id})}
                    className={`w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${c.bg} ${
                      formData.color === c.id 
                        ? `ring-4 ${c.ring} scale-110 shadow-lg` 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {formData.color === c.id && <Check className="w-8 h-8 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-3xl space-y-4 shadow-inner">
             <div>
              <label className="block text-lg font-bold text-slate-800 mb-2">Estoc Inicial (Quantitat total)</label>
              <input
                type="number"
                min="0"
                className="w-full p-4 text-xl rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 bg-white text-slate-900"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-lg font-bold text-slate-800 mb-2">Unitats restades per presa</label>
              <input
                type="number"
                min="1"
                className="w-full p-4 text-xl rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-sky-500 bg-white text-slate-900"
                value={formData.unitsPerDose}
                onChange={e => setFormData({...formData, unitsPerDose: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <Button type="submit" fullWidth className="text-xl py-6 bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800">
              {editingId ? 'GUARDAR CANVIS' : 'GUARDAR MEDICAMENT'}
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
    <div className="space-y-6 pb-32">
      <header className="flex justify-between items-center px-2">
        <h1 className="text-3xl font-black text-slate-900">Medicaments</h1>
        <Button onClick={() => setIsAdding(true)} className="!p-4 rounded-full w-16 h-16 shadow-xl !min-h-0">
          <Plus className="w-8 h-8" />
        </Button>
      </header>

      <div className="space-y-4">
        {medications.map(med => {
          const isLowStock = med.stock <= (med.lowStockThreshold || 5);
          const colorStyles = getColorStyles(med.color);
          const IconComponent = getIconComponent(med.icon);

          return (
            <div key={med.id} className={`bg-white p-6 rounded-3xl shadow-sm border-2 ${colorStyles.border} flex flex-col gap-4 animate-in fade-in duration-300`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorStyles.bg} ${colorStyles.text}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                      {med.name}
                      {med.hasAlarm === false && <BellOff className="w-4 h-4 text-slate-300" />}
                    </h3>
                    <p className="text-lg text-slate-600 mt-1 font-medium">{med.dosage}</p>
                    
                    {med.reminderMessage && (
                      <p className="text-sm italic text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        "{med.reminderMessage}"
                      </p>
                    )}

                    {/* Horaris Chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {med.schedules.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                          <Clock className="w-3 h-3" />
                          <span>{s.time}</span>
                          {s.dose && <span className="text-sky-600 ml-1">({s.dose})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                 <div className={`flex items-center gap-2 text-lg px-4 py-2 rounded-xl font-medium ${isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                  {isLowStock ? <AlertTriangle className="w-6 h-6" /> : <Pill className="w-5 h-5" />}
                  <span>Queden: {med.stock}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(med)}
                    className="p-3 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors border-2 border-slate-100 active:scale-90"
                    title="Editar medicament"
                  >
                    <Pencil className="w-7 h-7" />
                  </button>
                  <button 
                    onClick={() => handleRefill(med)}
                    className="p-3 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-2xl transition-colors border-2 border-sky-100 active:scale-90"
                    title="Afegir estoc"
                  >
                    <RefreshCw className="w-7 h-7" />
                  </button>
                  <button 
                    onClick={() => handleDelete(med.id)}
                    className="p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border-2 border-red-100 active:scale-90"
                    title="Eliminar medicament"
                  >
                    <Trash2 className="w-7 h-7" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {medications.length === 0 && (
          <div className="text-center text-slate-400 py-10 text-xl font-medium px-10">
            Encara no has afegit cap pastilla. <br/> Prem el botó <span className="inline-flex items-center justify-center w-8 h-8 bg-sky-600 text-white rounded-full align-middle mx-1">+</span> per començar.
          </div>
        )}
      </div>
    </div>
  );
};