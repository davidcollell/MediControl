import React, { useState, useRef, useEffect } from 'react';
import { Medication, Frequency, Schedule } from '../types';
import { saveMedication, deleteMedication, saveAllMedications } from '../services/storage';
import { Button } from './Button';
import { Settings } from './Settings';
import { 
  Plus, Trash2, Pill, AlertTriangle, RefreshCw, X, Check, Bell, BellOff, Clock,
  Pencil, MessageSquare, GripVertical, Move, ArrowUpDown, Settings as SettingsIcon,
  ChevronUp, ChevronDown, MoreVertical, Sun, Sunrise, Moon, CloudSun
} from 'lucide-react';
import { Haptics } from '../services/haptics';

interface MedicationListProps {
  medications: Medication[];
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  { val: 1, label: 'Dl' },
  { val: 2, label: 'Dm' },
  { val: 3, label: 'Dc' },
  { val: 4, label: 'Dj' },
  { val: 5, label: 'Dv' },
  { val: 6, label: 'Ds' },
  { val: 0, label: 'Dg' },
];

export const MedicationList: React.FC<MedicationListProps> = ({ medications, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    reminderMessage: '',
    schedules: [{ id: 'init', time: '08:00', days: [0,1,2,3,4,5,6], dose: '' }],
    hasAlarm: true,
    stock: 20,
    unitsPerDose: 1
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 5 && hour < 9) return <Sunrise className="w-4 h-4 text-orange-400" />;
    if (hour >= 9 && hour < 14) return <Sun className="w-4 h-4 text-amber-500" />;
    if (hour >= 14 && hour < 20) return <CloudSun className="w-4 h-4 text-sky-500" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const getDaySummary = (days: number[]) => {
    if (days.length === 7) return "Tots els dies";
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Dl - Dv";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Caps de setmana";
    return days.sort((a,b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
               .map(d => DAYS_OF_WEEK.find(dw => dw.val === d)?.label).join(', ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.schedules || formData.schedules.length === 0) return;

    Haptics.success();
    const newMed: Medication = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      dosage: formData.dosage || '1 unitat',
      reminderMessage: formData.reminderMessage || '',
      frequency: Frequency.CUSTOM,
      schedules: formData.schedules,
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
      hasAlarm: true,
      stock: 20,
      unitsPerDose: 1
    });
  };

  const handleEdit = (med: Medication) => {
    Haptics.tick();
    setEditingId(med.id);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      reminderMessage: med.reminderMessage || '',
      schedules: JSON.parse(JSON.stringify(med.schedules)),
      hasAlarm: med.hasAlarm,
      stock: med.stock,
      unitsPerDose: med.unitsPerDose,
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    Haptics.tick();
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Haptics.warning();
    if (confirm('Estàs segur que vols eliminar aquest medicament?')) {
      deleteMedication(id);
      onUpdate();
    }
  };

  const handleRefill = (med: Medication) => {
    Haptics.tick();
    const amount = prompt(`Quantes unitats vols afegir a ${med.name}?`, '30');
    if (amount && !isNaN(parseInt(amount))) {
      Haptics.success();
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
    Haptics.tick();
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
    Haptics.tick();
    const newSchedules = [...(formData.schedules || []), { id: crypto.randomUUID(), time: '20:00', days: [0,1,2,3,4,5,6], dose: '' }];
    setFormData({ ...formData, schedules: newSchedules });
  };

  const removeSchedule = (index: number) => {
    if ((formData.schedules?.length || 0) <= 1) return;
    Haptics.tick();
    const newSchedules = [...(formData.schedules || [])];
    newSchedules.splice(index, 1);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handlePointerDown = (index: number) => {
    if (!isReordering) return;
    setDraggedIndex(index);
    Haptics.tick();
  };

  const handlePointerEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    Haptics.tick();
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= medications.length) return;
    const newMeds = [...medications];
    const item = newMeds.splice(fromIndex, 1)[0];
    newMeds.splice(toIndex, 0, item);
    saveAllMedications(newMeds);
    onUpdate();
  };

  const handlePointerUp = () => {
    setDraggedIndex(null);
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
                placeholder="Ex: Pren-t'ho amb l'esmorzar..."
                value={formData.reminderMessage}
                onChange={e => setFormData({...formData, reminderMessage: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-200 space-y-4">
            <label className="block text-xl font-black text-slate-800">Horaris i Preses</label>
            
            {formData.schedules?.map((schedule, idx) => (
              <div key={schedule.id || idx} className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm relative">
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

                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Dies de la setmana</label>
                   <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = schedule.days.includes(day.val);
                      return (
                        <button
                          key={day.val}
                          type="button"
                          onClick={() => toggleDay(idx, day.val)}
                          className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 scale-110 ring-4 ring-sky-100' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
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
                onChange={e => { Haptics.tick(); setFormData({...formData, hasAlarm: e.target.checked}); }}
              />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
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
    <div className="space-y-6 pb-32" onPointerUp={handlePointerUp}>
      <header className="flex justify-between items-center px-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">El teu Pla</h1>
        <div className="flex gap-2">
          {!isReordering ? (
            <>
              <Button onClick={() => { Haptics.tick(); setIsAdding(true); }} className="!p-4 rounded-full w-14 h-14 shadow-lg !min-h-0">
                <Plus className="w-7 h-7" />
              </Button>
              
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => { Haptics.tick(); setIsMenuOpen(!isMenuOpen); }}
                  className="p-4 rounded-2xl border-2 bg-white text-slate-600 border-slate-200 active:scale-95 transition-all shadow-sm flex items-center justify-center w-14 h-14"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <button 
                      onClick={() => { Haptics.tick(); setShowSettings(true); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-6 py-4 text-slate-700 hover:bg-sky-50 transition-colors border-b border-slate-100 text-left"
                    >
                      <SettingsIcon className="w-5 h-5 text-sky-600" />
                      <span className="font-bold text-sm">Preferències</span>
                    </button>
                    <button 
                      onClick={() => { Haptics.tick(); setIsReordering(true); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-6 py-4 text-slate-700 hover:bg-sky-50 transition-colors text-left"
                    >
                      <ArrowUpDown className="w-5 h-5 text-sky-600" />
                      <span className="font-bold text-sm">Reordenar llista</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => { Haptics.success(); setIsReordering(false); }}
              className="px-6 py-4 rounded-2xl bg-sky-600 text-white font-black flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition-all h-14"
            >
              <Check className="w-6 h-6" /> FET
            </button>
          )}
        </div>
      </header>

      {showSettings && <Settings onClose={() => setShowSettings(false)} onUpdate={onUpdate} />}

      {isReordering && (
        <div className="bg-sky-50 border-2 border-sky-100 p-5 rounded-3xl text-sky-800 animate-in fade-in slide-in-from-top-2 flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-sm text-sky-600">
            <Move className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold leading-tight">
            Ordena la teva medicació arrossegant les targetes.
          </p>
        </div>
      )}

      <div className={`space-y-6 transition-all duration-500 ${isReordering ? 'bg-slate-100/50 p-2 rounded-[2.5rem] -m-2 border border-slate-200/50' : ''}`}>
        {medications.map((med, index) => {
          const isLowStock = med.stock <= (med.lowStockThreshold || 5);
          const isBeingDragged = draggedIndex === index;

          return (
            <div 
              key={med.id} 
              onPointerEnter={isReordering ? () => handlePointerEnter(index) : undefined}
              className={`bg-white rounded-[2.5rem] shadow-sm border-2 flex flex-col transition-all duration-300 ${
                isReordering ? 'cursor-grab active:cursor-grabbing touch-none select-none overflow-hidden' : ''
              } ${isBeingDragged ? 'scale-105 shadow-2xl border-sky-500 z-50 ring-[12px] ring-sky-500/10 rotate-1' : 'border-slate-100'}`}
            >
              <div className={`p-6 flex flex-col gap-6 ${isReordering ? 'py-4' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {isReordering ? (
                      <div 
                        onPointerDown={() => handlePointerDown(index)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-sky-50 text-sky-600 border border-sky-100"
                      >
                        <GripVertical className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-slate-50 text-sky-600 border border-sky-100/50`}>
                        <Pill className="w-7 h-7" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-slate-900 truncate flex items-center gap-2 ${isReordering ? 'text-lg' : 'text-xl'}`}>
                        {med.name}
                        {!isReordering && med.hasAlarm === false && <BellOff className="w-4 h-4 text-slate-300" />}
                      </h3>
                      {!isReordering && <p className="text-base text-slate-500 font-bold">{med.dosage}</p>}
                    </div>
                  </div>

                  {isReordering && (
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => { Haptics.tick(); moveItem(index, index - 1); }}
                        disabled={index === 0}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-20 rounded-xl transition-all active:scale-90"
                      >
                        <ChevronUp className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => { Haptics.tick(); moveItem(index, index + 1); }}
                        disabled={index === medications.length - 1}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-20 rounded-xl transition-all active:scale-90"
                      >
                        <ChevronDown className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>

                {!isReordering && (
                  <>
                    {med.reminderMessage && (
                      <p className="text-sm italic text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 font-medium">
                        <MessageSquare className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                        "{med.reminderMessage}"
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horaris d'administració</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {med.schedules.sort((a,b) => a.time.localeCompare(b.time)).map((s, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-sky-100 transition-colors">
                            <div className="bg-white p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                              {getTimeIcon(s.time)}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-baseline mb-0.5">
                                  <span className="text-lg font-black text-slate-900 leading-none">{s.time}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                    {getDaySummary(s.days)}
                                  </span>
                               </div>
                               {s.dose && <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">{s.dose}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-2">
                      <div className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full font-black uppercase tracking-tight ${isLowStock ? 'bg-amber-100 text-amber-800 ring-4 ring-amber-50' : 'bg-slate-100 text-slate-500'}`}>
                        {isLowStock ? <AlertTriangle className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                        <span>Estoc: {med.stock} unitats</span>
                      </div>

                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(med)} className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all active:scale-90">
                          <Pencil className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleRefill(med)} className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all active:scale-90">
                          <RefreshCw className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleDelete(med.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        {medications.length === 0 && (
          <div className="text-center py-24 px-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Pill className="w-10 h-10" />
            </div>
            <p className="text-slate-500 text-lg font-bold leading-relaxed">
              Encara no has afegit cap medicament. <br/>
              <span className="text-sm font-medium text-slate-400 mt-2 block">Prem el botó + per començar el teu pla de salut.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};