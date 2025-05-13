"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

// Tipos para horario estático y dinámico
interface OpeningHour {
  id?: string;
  restaurant_id: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

interface TimeSlot {
  id?: string;
  restaurant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_reservations: number;
  max_party_size: number;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export default function SchedulePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all'); // 'all' para mostrar todas las franjas
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });
  const [showTimeSlotsSection, setShowTimeSlotsSection] = useState(false);
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: "13:00",
    end_time: "14:30",
    max_reservations: 4,
    max_party_size: 10,
    is_active: true
  });
  const [activeTab, setActiveTab] = useState<'general' | 'slots'>('general');
  const [previewDay, setPreviewDay] = useState(5); // Viernes por defecto
  const [previewPeople, setPreviewPeople] = useState(2);

  // Cargar datos al iniciar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Obtener usuario y restaurante
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!restaurant) return setLoading(false);
      setRestaurantId(restaurant.id);
      // Horario estático
      const { data: opening, error: openingError } = await supabase
        .from("opening_hours")
        .select("*")
        .eq("restaurant_id", restaurant.id);
      if (!openingError) setOpeningHours(opening || []);
      // Horario dinámico (franjas) - TRAER TODAS LAS FRANJAS DE TODOS LOS DÍAS
      const { data: slots, error: slotsError } = await supabase
        .from("reservation_time_slots")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("day_of_week")
        .order("start_time");
      if (!slotsError) setTimeSlots(slots || []);
      setLoading(false);
    };
    fetchData();
  }, []); // Solo al montar

  // CRUD Horario Estático (igual que contacto)
  const handleHoursChange = (index: number, field: keyof OpeningHour, value: unknown) => {
    const updatedHours = [...openingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setOpeningHours(updatedHours);
  };

  const handleSaveOpeningHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setSaving(true);
    setSaveMessage({ type: "", message: "" });
    try {
      const updatedOpeningHours = [...openingHours];
      for (let i = 0; i < updatedOpeningHours.length; i++) {
        const hour = updatedOpeningHours[i];
        const hourData = {
          restaurant_id: restaurantId,
          day_of_week: hour.day_of_week,
          opens_at: hour.opens_at,
          closes_at: hour.closes_at,
          is_closed: hour.is_closed
        };
        if (hour.id) {
          const updateRes = await supabase
            .from('opening_hours')
            .update(hourData)
            .eq('id', hour.id)
            .select();
          if (updateRes.error) throw updateRes.error;
          if (updateRes.data && updateRes.data.length > 0) {
            updatedOpeningHours[i] = updateRes.data[0];
          }
        } else {
          const insertRes = await supabase
            .from('opening_hours')
            .insert(hourData)
            .select();
          if (insertRes.error) throw insertRes.error;
          if (insertRes.data && insertRes.data.length > 0) {
            updatedOpeningHours[i] = insertRes.data[0];
          }
        }
      }
      setOpeningHours(updatedOpeningHours);
      setSaveMessage({ type: "success", message: "Horarios guardados correctamente" });
      setTimeout(() => setSaveMessage({ type: "", message: "" }), 3000);
    } catch (error: any) {
      setSaveMessage({ type: "error", message: error.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  // CRUD Franjas Dinámicas (idéntico reservas)
  const loadTimeSlots = async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("reservation_time_slots")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("day_of_week")
      .order("start_time");
    if (!error) setTimeSlots(data || []);
  };
  useEffect(() => { if (showTimeSlotsSection) loadTimeSlots(); }, [showTimeSlotsSection, selectedDay, restaurantId]);

  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewSlot(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      const numValue = value === '' ? '' : parseInt(value);
      setNewSlot(prev => ({ ...prev, [name]: numValue }));
    } else {
      setNewSlot(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleEditSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditingSlot((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      const numValue = value === '' ? '' : parseInt(value);
      setEditingSlot((prev: any) => ({ ...prev, [name]: numValue }));
    } else {
      setEditingSlot((prev: any) => ({ ...prev, [name]: value }));
    }
  };
  const addTimeSlot = async () => {
    if (!restaurantId) return;
    const dataToInsert = {
      restaurant_id: restaurantId,
      day_of_week: newSlot.day_of_week,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      max_reservations: Number(newSlot.max_reservations) || 1,
      max_party_size: Number(newSlot.max_party_size) || 1,
      is_active: newSlot.is_active
    };
    const { error } = await supabase
      .from("reservation_time_slots")
      .insert(dataToInsert);
    if (!error) {
      toast.success("Horario añadido correctamente");
      loadTimeSlots();
      setNewSlot({ day_of_week: 1, start_time: "13:00", end_time: "14:30", max_reservations: 4, max_party_size: 10, is_active: true });
    } else {
      toast.error("Error al crear horario");
    }
  };
  const prepareEditSlot = (slot: any) => { setEditingSlot({ ...slot }); setIsEditingSlot(true); };
  const cancelEditSlot = () => { setIsEditingSlot(false); setEditingSlot(null); };
  const saveSlotChanges = async () => {
    if (!editingSlot || !editingSlot.id || !restaurantId) return;
    const dataToUpdate = {
      start_time: editingSlot.start_time,
      end_time: editingSlot.end_time,
      max_reservations: Number(editingSlot.max_reservations) || 1,
      max_party_size: Number(editingSlot.max_party_size) || 1,
      is_active: editingSlot.is_active
    };
    const { error } = await supabase
      .from("reservation_time_slots")
      .update(dataToUpdate)
      .eq("id", editingSlot.id)
      .eq("restaurant_id", restaurantId);
    if (!error) {
      toast.success("Horario actualizado correctamente");
      setIsEditingSlot(false);
      setEditingSlot(null);
      loadTimeSlots();
    } else {
      toast.error("Error al actualizar horario");
    }
  };
  const deleteTimeSlot = async (slotId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este horario?")) return;
    const { error } = await supabase
      .from("reservation_time_slots")
      .delete()
      .eq("id", slotId);
    if (!error) {
      toast.success("Horario eliminado correctamente");
      loadTimeSlots();
    } else if (
      error.code === '409' ||
      (error.message && (
        error.message.includes('violates foreign key constraint') ||
        error.message.includes('constraint')
      ))
    ) {
      toast.error("No puedes eliminar esta franja porque tiene reservas asociadas.");
    } else {
      toast.error("Error al eliminar horario");
    }
  };

  // Render
  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-4">
      {/* Columna principal (2/3) */}
      <div className="w-full md:w-2/3 space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          <button onClick={() => setActiveTab('general')} className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>Horario General</button>
          <button onClick={() => setActiveTab('slots')} className={`px-4 py-2 font-medium ${activeTab === 'slots' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>Franjas de Reserva</button>
        </div>

        {/* Horario General */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveOpeningHours} className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-1"><CalendarIcon className="w-5 h-5 text-green-600" /> Horario General del Restaurante</h2>
            <p className="text-gray-500 mb-6">Configure el horario general que se mostrará al público...</p>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, idx) => {
                const hour = openingHours.find(h => h.day_of_week === idx) || { day_of_week: idx, opens_at: "12:00", closes_at: (idx === 5 || idx === 6) ? "00:00" : "23:00", is_closed: idx === 0 };
                return (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-3">
                    <Checkbox
                      checked={!hour.is_closed}
                      onCheckedChange={(v: boolean) => handleHoursChange(idx, 'is_closed', !v)}
                      className="mr-2"
                      id={`switch-${idx}`}
                    />
                    <label htmlFor={`switch-${idx}`} className="w-24 font-medium text-gray-700">{day}</label>
                    <input
                      type="time"
                      value={hour.opens_at || ''}
                      onChange={e => handleHoursChange(idx, 'opens_at', e.target.value)}
                      disabled={hour.is_closed}
                      className={`w-28 border rounded px-2 py-1 text-sm ${hour.is_closed ? 'opacity-50' : ''}`}
                    />
                    <span className="mx-2 text-gray-400">-</span>
                    <input
                      type="time"
                      value={hour.closes_at || ''}
                      onChange={e => handleHoursChange(idx, 'closes_at', e.target.value)}
                      disabled={hour.is_closed}
                      className={`w-28 border rounded px-2 py-1 text-sm ${hour.is_closed ? 'opacity-50' : ''}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
              >
                {saving ? "Guardando..." : "Guardar Horario General"}
              </button>
            </div>
            {saveMessage.message && (
              <div className={`mt-4 p-2 rounded-md text-center ${saveMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{saveMessage.message}</div>
            )}
          </form>
        )}

        {/* Franjas de Reserva */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-green-600" /> Franjas de Reserva</h2>
                <p className="text-gray-500">Configure las franjas horarias específicas disponibles para reservas...</p>
              </div>
              <button onClick={() => setShowTimeSlotsSection(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"><span className="text-lg">+</span> Añadir Franja</button>
            </div>
            {/* Filtro por día */}
            <div className="mb-4 flex gap-2 items-center">
              <label className="font-medium text-gray-700">Filtrar por día:</label>
              <select value={selectedDay} onChange={e => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="border rounded px-2 py-1">
                <option value="all">Todos</option>
                {DAYS_OF_WEEK.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const filteredSlots = selectedDay === 'all' ? timeSlots : timeSlots.filter(s => s.day_of_week === selectedDay);
                if (filteredSlots.length === 0) {
                  return (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-gray-500 mb-4">No hay franjas horarias configuradas</p>
                      <button onClick={() => setShowTimeSlotsSection(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded">Añadir primera franja</button>
                    </div>
                  );
                }
                return filteredSlots.map(slot => (
                  <div key={slot.id} className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 relative border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">{DAYS_OF_WEEK[slot.day_of_week]} - {slot.start_time?.substring(0,5)}</span>
                      <span className="ml-auto text-xs text-gray-500">{slot.is_active ? 'Activo' : 'Inactivo'}</span>
                      <button onClick={() => slot.id && deleteTimeSlot(slot.id)} className="ml-2 text-red-500 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="text-sm text-gray-600">Máx. {slot.max_party_size} personas | {slot.max_reservations} reservas</div>
                  </div>
                ));
              })()}
            </div>
            {timeSlots.length > 0 && (
              <div className="flex justify-end mt-8">
                <button type="button" onClick={() => toast.success('Franjas guardadas correctamente')} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow">Guardar Todas las Franjas</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna derecha: Vista previa */}
      <div className="w-full md:w-1/3 space-y-8">
        {/* Vista previa horario general */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><CalendarIcon className="w-5 h-5 text-green-600" /> Horario del Restaurante</h3>
          <ul className="divide-y divide-gray-100">
            {DAYS_OF_WEEK.map((day, idx) => {
              const hour = openingHours.find(h => h.day_of_week === idx) || { opens_at: "12:00", closes_at: (idx === 5 || idx === 6) ? "00:00" : "23:00", is_closed: idx === 0 };
              return (
                <li key={idx} className={`flex items-center justify-between py-1 ${hour.is_closed ? 'text-gray-400' : ''}`}>
                  <span>{day}</span>
                  {hour.is_closed ? <span>Cerrado</span> : <span>{hour.opens_at?.substring(0,5)} - {hour.closes_at?.substring(0,5)}</span>}
                </li>
              );
            })}
          </ul>
        </div>
        {/* Vista previa reserva cliente */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-green-600" /> Vista de Reserva (Cliente)</h3>
          <div className="mb-3 flex gap-2">
            <select value={previewDay} onChange={e => setPreviewDay(Number(e.target.value))} className="border rounded px-2 py-1">
              {DAYS_OF_WEEK.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
            <input type="number" min={1} max={20} value={previewPeople} onChange={e => setPreviewPeople(Number(e.target.value))} className="border rounded px-2 py-1 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Mostrar solo franjas activas, del día seleccionado y que permitan el número de personas
              const slots = timeSlots.filter(s => s.day_of_week === previewDay && s.is_active && previewPeople <= s.max_party_size);
              if (slots.length === 0) return <span className="text-gray-400">No hay horarios disponibles para este día</span>;
              return slots.map(slot => (
                <button key={slot.id} className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">{slot.start_time?.substring(0,5)}</button>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Modal de gestión de franjas (idéntico reservas, solo si showTimeSlotsSection) */}
      {showTimeSlotsSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
            <button onClick={() => setShowTimeSlotsSection(false)} className="button-outline absolute top-2 right-2"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold mb-4">Añadir Nueva Franja Horaria</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Día de la semana</label>
                <select value={newSlot.day_of_week ?? 1} onChange={e => setNewSlot(prev => ({ ...prev, day_of_week: Number(e.target.value) }))} className="border rounded px-2 py-1 w-full">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora inicio</label>
                <input type="time" name="start_time" value={newSlot.start_time} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora fin</label>
                <input type="time" name="end_time" value={newSlot.end_time || ''} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. personas por reserva</label>
                <input type="number" name="max_party_size" min={1} value={newSlot.max_party_size} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. número de reservas</label>
                <input type="number" name="max_reservations" min={1} value={newSlot.max_reservations} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowTimeSlotsSection(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded">Cancelar</button>
              <button type="button" onClick={addTimeSlot} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded">Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
