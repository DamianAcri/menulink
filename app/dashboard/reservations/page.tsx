"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Plus, Settings, Users, Filter, Search, X, MoreHorizontal, Check } from "lucide-react";
import { format, isSameDay, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";
import { useReservationToast } from "../layout";

type Reservation = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

type Restaurant = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [newReservation, setNewReservation] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    party_size: 2,
    reservation_date: "",
    reservation_time: "",
    special_requests: "",
    addToCRM: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nuevos estados para la gestión de franjas horarias
  const [showTimeSlotsSection, setShowTimeSlotsSection] = useState(false);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(1); // Lunes por defecto
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [newSlot, setNewSlot] = useState({
    start_time: "13:00",
    end_time: "14:30",
    max_reservations: 4,
    max_party_size: 10,
    is_active: true
  });

  // UI state for tabs and calendar
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Estado para mostrar el diálogo de nueva reserva
  const [showNewReservationDialog, setShowNewReservationDialog] = useState(false);
  // Estado y lógica de búsqueda en el listado
  const [searchTerm, setSearchTerm] = useState("");
  // Filtrado de reservas para el listado
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || reservation.status === statusFilter;
    const matchesDate =
      !dateFilter || reservation.reservation_date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Eliminar duplicados por id (garantiza que cada reserva solo aparece una vez)
  const uniqueReservations = Array.from(
    new Map(filteredReservations.map(r => [r.id, r])).values()
  );

  const { setLastCreatedReservationId } = useReservationToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("Usuario autenticado en reservas:", user);
        if (!user) return;

        // Buscar el restaurante del usuario actual
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", user.id)
          .single();

        console.log("Restaurant data fetch result:", {
          restaurantData,
          restaurantError,
        });

        if (restaurantError && restaurantError.code !== "PGRST116") {
          console.error("Error fetching restaurant:", restaurantError);
          return;
        }

        // Si no hay restaurante, significa que es la primera vez que el usuario accede
        if (!restaurantData) {
          setIsLoading(false);
          return;
        }

        // Guardar el restaurante encontrado
        setRestaurant(restaurantData);

        console.log("ID del restaurante recuperado:", restaurantData.id);
        console.log("Tipo de dato del ID:", typeof restaurantData.id);

        // Verificar las políticas RLS activas
        console.log("Verificando políticas RLS activas...");
        try {
          const { data: policies, error: policiesError } =
            await supabase.rpc("get_policies");
          console.log("Políticas activas:", policies);
          console.log("Error al obtener políticas:", policiesError);
        } catch (e) {
          console.log("Error al verificar políticas RLS:", e);
        }

        // Cargar reservas para este restaurante
        fetchReservations(restaurantData.id);

        // Como prueba adicional, hacer una consulta directa a todas las reservas
        try {
          console.log("Haciendo consulta directa a todas las reservas...");
          const { data: allReservations, error: allReservationsError } =
            await supabase.from("reservations").select("*").limit(10);

          console.log("Todas las reservas (hasta 10):", allReservations);
          console.log(
            "Error al consultar todas las reservas:",
            allReservationsError
          );
        } catch (e) {
          console.log("Error en consulta directa:", e);
        }

        // Prueba específica para la reserva que sabemos que existe
        try {
          console.log("Buscando reserva por ID específico...");
          const { data: specificReservation, error: specificError } =
            await supabase
              .from("reservations")
              .select("*")
              .eq("id", "968ff243-5b14-4cf0-92b9-4e182db78c2d")
              .single();

          console.log("Reserva específica:", specificReservation);
          console.log("Error al buscar reserva específica:", specificError);
        } catch (e) {
          console.log("Error en consulta específica:", e);
        }
      } catch (error: unknown) {
        console.error("Error en página de reservas:", error);
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Efecto para suscripción en tiempo real y carga de reservas cuando cambia el restaurante
  // Eliminado: la suscripción global se gestiona en layout.tsx
  useEffect(() => {
    if (!restaurant) return;
    // Cargar reservas iniciales
    fetchReservations(restaurant.id);
  }, [restaurant]);

  // Efecto separado para actualizar cuando cambian los filtros
  useEffect(() => {
    if (restaurant) {
      fetchReservations(restaurant.id);
    }
  }, [statusFilter, dateFilter, restaurant]);

  // Efecto para cargar los time slots cuando se muestra la sección
  useEffect(() => {
    if (showTimeSlotsSection && restaurant) {
      loadTimeSlots();
    }
  }, [showTimeSlotsSection, restaurant, selectedDay]);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  const fetchReservations = async (restaurantId: string) => {
    if (!restaurantId) return;

    setIsLoading(true);
    try {
      // Log para depuración
      console.log('Filtro de estado actual:', statusFilter);
      let query = supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId);
      // Solo permitir valores válidos
      const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
      if (statusFilter !== "all" && validStatuses.includes(statusFilter)) {
        query = query.eq("status", statusFilter);
      }
      if (dateFilter) {
        query = query.eq("reservation_date", dateFilter);
      }
      const { data, error } = await query;
      console.log('Reservas devueltas por Supabase:', data);
      if (error) throw error;
      // Ordenar por fecha de creación descendente (más nuevas arriba)
      const sortedReservations = (data || []).sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setReservations(sortedReservations);
    } catch (error: unknown) {
      console.error("Error al cargar reservas:", error);
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar los time slots
  const loadTimeSlots = async () => {
    if (!restaurant) return;
    
    try {
      const { data, error } = await supabase
        .from("reservation_time_slots")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("day_of_week", selectedDay)
        .order("start_time");
      
      if (error) throw error;
      
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error al cargar horarios disponibles:", error);
      toast.error("Error al cargar horarios");
    }
  };

  // Función para manejar cambios en el formulario de time slot
  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewSlot(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      // Convertir a número solo si el campo tiene valor, sino usar un valor predeterminado
      // para evitar el error NaN
      const numValue = value === '' ? '' : parseInt(value);
      setNewSlot(prev => ({ ...prev, [name]: numValue }));
    } else {
      setNewSlot(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función para manejar cambios en el formulario de edición de slot
  const handleEditSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditingSlot((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      // Convertir a número solo si el campo tiene valor, sino usar un valor predeterminado
      // para evitar el error NaN
      const numValue = value === '' ? '' : parseInt(value);
      setEditingSlot((prev: any) => ({ ...prev, [name]: numValue }));
    } else {
      setEditingSlot((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Función para añadir nuevo time slot
  const addTimeSlot = async () => {
    if (!restaurant) return;
    
    // Asegurarse de que los valores numéricos son válidos antes de enviar
    const dataToInsert = {
      restaurant_id: restaurant.id,
      day_of_week: selectedDay,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      max_reservations: Number(newSlot.max_reservations) || 1, // Usar 1 como valor predeterminado si es vacío o NaN
      max_party_size: Number(newSlot.max_party_size) || 1,
      is_active: newSlot.is_active
    };
    
    try {
      const { data, error } = await supabase
        .from("reservation_time_slots")
        .insert(dataToInsert)
        .select();
      
      if (error) throw error;
      
      toast.success("Horario añadido correctamente");
      loadTimeSlots();
      
      // Resetear el formulario
      setNewSlot({
        start_time: "13:00",
        end_time: "14:30",
        max_reservations: 4,
        max_party_size: 10,
        is_active: true
      });
    } catch (error) {
      console.error("Error al crear horario:", error);
      toast.error("Error al crear horario");
    }
  };

  // Función para preparar edición de slot
  const prepareEditSlot = (slot: any) => {
    setEditingSlot({ ...slot });
    setIsEditingSlot(true);
  };

  // Función para cancelar edición
  const cancelEditSlot = () => {
    setIsEditingSlot(false);
    setEditingSlot(null);
  };

  // Función para guardar cambios en slot
  const saveSlotChanges = async () => {
    if (!editingSlot || !editingSlot.id || !restaurant) return;
    
    // Asegurarse de que los valores numéricos son válidos antes de enviar
    const dataToUpdate = {
      start_time: editingSlot.start_time,
      end_time: editingSlot.end_time,
      max_reservations: Number(editingSlot.max_reservations) || 1,
      max_party_size: Number(editingSlot.max_party_size) || 1,
      is_active: editingSlot.is_active
    };
    
    try {
      // Simplificamos la consulta para evitar el error con app.current_restaurant
      const { error } = await supabase
        .from("reservation_time_slots")
        .update(dataToUpdate)
        .eq("id", editingSlot.id)
        .eq("restaurant_id", restaurant.id);
      
      if (error) throw error;
      
      toast.success("Horario actualizado correctamente");
      setIsEditingSlot(false);
      setEditingSlot(null);
      loadTimeSlots();
    } catch (error) {
      console.error("Error al actualizar horario:", error);
      toast.error("Error al actualizar horario");
    }
  };

  // Función para eliminar slot
  const deleteTimeSlot = async (slotId: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este horario? Las reservas existentes para este horario no se verán afectadas.");
    
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from("reservation_time_slots")
        .delete()
        .eq("id", slotId);
      
      if (error) throw error;
      
      toast.success("Horario eliminado correctamente");
      loadTimeSlots();
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      toast.error("Error al eliminar horario");
    }
  };

  // Nombres de los días de la semana
  const dayNames = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ];

  // Handler para el formulario de nueva reserva
  const handleReservationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      const inputElement = e.target as HTMLInputElement;
      setNewReservation((prev) => ({
        ...prev,
        [name]: inputElement.checked,
      }));
    } else {
      setNewReservation((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);
    if (!restaurant) {
      setFormError("No se ha encontrado el restaurante.");
      setIsSubmitting(false);
      return;
    }
    if (
      !newReservation.customer_name ||
      !newReservation.customer_email ||
      !newReservation.reservation_date ||
      !newReservation.reservation_time
    ) {
      setFormError("Nombre, email, fecha y hora son obligatorios.");
      setIsSubmitting(false);
      return;
    }
    // Crear la reserva
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        restaurant_id: restaurant.id,
        customer_name: newReservation.customer_name,
        customer_email: newReservation.customer_email,
        customer_phone: newReservation.customer_phone,
        party_size: newReservation.party_size,
        reservation_date: newReservation.reservation_date,
        reservation_time: newReservation.reservation_time,
        special_requests: newReservation.special_requests,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) {
      setFormError("Error al crear la reserva.");
      setIsSubmitting(false);
      return;
    }

    // Mostrar toast y guardar el ID para evitar duplicados
    if (data && data.id) {
      setLastCreatedReservationId(data.id);
      toast.success(
        <div>
          <b>¡Reserva creada correctamente!</b>
          <div>Cliente: {data.customer_name}</div>
          <div>Fecha: {data.reservation_date} {data.reservation_time?.slice(0,5)}</div>
          <div>Personas: {data.party_size}</div>
        </div>,
        { position: "bottom-right", duration: 7000 }
      );
    }

    // Enviar correo de nueva reserva (al restaurante y cliente)
    if (data && data.id) {
      try {
        await fetch('/api/email/new-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId: data.id })
        });
      } catch (err) {
        // No bloquear el flujo si falla el correo
        console.error('Error enviando correo de nueva reserva:', err);
      }
    }

    setFormSuccess("Reserva creada correctamente.");
    setIsSubmitting(false);
    // No añadir la reserva manualmente para evitar duplicados, solo limpiar el formulario
    // La suscripción en tiempo real recargará la lista automáticamente
    // setReservations((prev) => [data, ...prev]);
    // Si se marcó añadir al CRM, intentar añadir el cliente (si no existe)
    if (newReservation.addToCRM) {
      // Comprobar si ya existe el cliente
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("email", newReservation.customer_email)
        .maybeSingle();
      if (!existing) {
        // Separar nombre y apellidos (simple)
        const [first_name, ...rest] = newReservation.customer_name.trim().split(" ");
        const last_name = rest.join(" ") || "-";
        await supabase.from("customers").insert([
          {
            restaurant_id: restaurant.id,
            first_name,
            last_name,
            email: newReservation.customer_email,
            phone: newReservation.customer_phone || null,
          }
        ]);
      }
    }
    setNewReservation({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      party_size: 2,
      reservation_date: "",
      reservation_time: "",
      special_requests: "",
      addToCRM: true,
    });
  };

  // --- Calendar helpers ---
  function generateCalendarDays(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let firstDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
    let lastDayOfWeek = lastDayOfMonth.getDay() - 1;
    if (lastDayOfWeek < 0) lastDayOfWeek = 6;
    const daysFromPrevMonth = firstDayOfWeek;
    const daysFromNextMonth = 6 - lastDayOfWeek;
    const calendarDays = [];
    for (let i = daysFromPrevMonth; i > 0; i--) {
      calendarDays.push(new Date(year, month, 1 - i));
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      calendarDays.push(new Date(year, month, i));
    }
    for (let i = 1; i <= daysFromNextMonth; i++) {
      calendarDays.push(new Date(year, month + 1, i));
    }
    return calendarDays;
  }

  // Agrupa reservas por fecha (YYYY-MM-DD)
  const reservationsByDate = reservations.reduce((acc, r) => {
    const dateKey = r.reservation_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {} as Record<string, Reservation[]>);

  // Si no hay restaurante configurado, mostrar pantalla de welcome igual que en dashboard
  if (!isLoading && !restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Necesitas completar la configuración de tu restaurante
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Antes de gestionar reservas, completa la información básica de tu
          restaurante.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Ir al dashboard
        </button>
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tabs y acciones arriba */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-2 border-b w-full md:w-auto">
              <button onClick={() => setActiveTab('calendar')} className={`button-outline font-medium ${activeTab === 'calendar' ? 'border-b-2 border-primary text-primary' : ''}`}>Calendario</button>
              <button onClick={() => setActiveTab('list')} className={`button-outline font-medium ${activeTab === 'list' ? 'border-b-2 border-primary text-primary' : ''}`}>Listado</button>
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button onClick={() => setShowTimeSlotsSection(true)} className="button-outline flex items-center gap-1"><Clock className="h-4 w-4" />Gestionar horarios</button>
              <button onClick={() => setShowNewReservationDialog(true)} className="button-primary flex items-center gap-1"><Plus className="h-4 w-4" />Nueva reserva</button>
            </div>
          </div>

          {/* Modales */}
          {showNewReservationDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
                <button onClick={() => setShowNewReservationDialog(false)} className="button-outline absolute top-2 right-2"><X className="h-5 w-5" /></button>
                <h2 className="text-xl font-bold mb-2">Nueva Reserva</h2>
                <form onSubmit={handleCreateReservation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del cliente</label>
                    <input name="customer_name" value={newReservation.customer_name} onChange={handleReservationChange} placeholder="Nombre completo" className="border px-3 py-2 rounded w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="customer_email" type="email" value={newReservation.customer_email} onChange={handleReservationChange} placeholder="email@ejemplo.com" className="border px-3 py-2 rounded w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input name="customer_phone" value={newReservation.customer_phone} onChange={handleReservationChange} placeholder="Teléfono" className="border px-3 py-2 rounded w-full" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Fecha</label>
                      <input name="reservation_date" type="date" value={newReservation.reservation_date} onChange={handleReservationChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Hora</label>
                      <input name="reservation_time" type="time" value={newReservation.reservation_time} onChange={handleReservationChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número de personas</label>
                    <input name="party_size" type="number" min={1} value={newReservation.party_size} onChange={handleReservationChange} className="border px-3 py-2 rounded w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Petición especial (opcional)</label>
                    <textarea name="special_requests" value={newReservation.special_requests} onChange={handleReservationChange} className="border px-3 py-2 rounded w-full" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="addToCRM" checked={newReservation.addToCRM} onChange={handleReservationChange} />
                    Añadir cliente al CRM
                  </label>
                  <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Guardar reserva"}
                  </button>
                  {formError && <div className="text-red-600 text-sm">{formError}</div>}
                  {formSuccess && <div className="text-green-600 text-sm">{formSuccess}</div>}
                </form>
              </div>
            </div>
          )}
          {showTimeSlotsSection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative animate-fade-in overflow-y-auto max-h-[90vh]">
                <button onClick={() => setShowTimeSlotsSection(false)} className="button-outline absolute top-2 right-2"><X className="h-5 w-5" /></button>
                <h2 className="text-xl font-bold mb-2">Gestión de horarios</h2>
                {/* Selector de día */}
                <div className="mb-6">
                  <label htmlFor="day-selector" className="block text-sm font-medium text-gray-700">Seleccionar día</label>
                  <select
                    id="day-selector"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {dayNames.map((dayName, index) => (
                      <option key={index} value={index}>{dayName}</option>
                    ))}
                  </select>
                </div>
                {/* Tabla de horarios existentes */}
                <div className="bg-white overflow-hidden border border-gray-200 rounded-md mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora inicio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora fin</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Personas</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots.length > 0 ? (
                        timeSlots.map((slot) => (
                          <tr key={slot.id}>
                            <td className="px-4 py-2">{slot.start_time?.substring(0,5)}</td>
                            <td className="px-4 py-2">{slot.end_time?.substring(0,5)}</td>
                            <td className="px-4 py-2">{slot.max_reservations} reservas</td>
                            <td className="px-4 py-2">{slot.max_party_size} personas</td>
                            <td className="px-4 py-2">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={slot.is_active}
                                  onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    await supabase
                                      .from("reservation_time_slots")
                                      .update({ is_active: newValue })
                                      .eq("id", slot.id)
                                      .eq("restaurant_id", restaurant?.id);
                                    loadTimeSlots();
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{slot.is_active ? 'Activo' : 'Inactivo'}</span>
                              </label>
                            </td>
                            <td className="px-4 py-2">
                              <button onClick={() => prepareEditSlot(slot)} className="text-blue-600 hover:text-blue-900 mr-3 text-xs">Editar</button>
                              <button onClick={() => deleteTimeSlot(slot.id)} className="text-red-600 hover:text-red-900 text-xs">Eliminar</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-2 text-center text-gray-500">No hay horarios configurados para {dayNames[selectedDay]}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Formulario para añadir nuevo time slot */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-lg font-medium mb-3">Añadir nuevo horario para {dayNames[selectedDay]}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Hora de inicio</label>
                      <input type="time" name="start_time" value={newSlot.start_time} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hora de fin</label>
                      <input type="time" name="end_time" value={newSlot.end_time} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Capacidad (número de reservas)</label>
                      <input type="number" name="max_reservations" min={1} value={newSlot.max_reservations} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tamaño máximo de grupo</label>
                      <input type="number" name="max_party_size" min={1} value={newSlot.max_party_size} onChange={handleSlotChange} className="border px-3 py-2 rounded w-full" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="inline-flex items-center">
                      <input type="checkbox" name="is_active" checked={newSlot.is_active} onChange={handleSlotChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Activo</span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <button type="button" onClick={addTimeSlot} className="button-primary w-full">Añadir horario</button>
                  </div>
                </div>
                {/* Formulario para editar slot (opcional, si está activo) */}
                {isEditingSlot && editingSlot && (
                  <div className="bg-blue-50 p-4 rounded-md mt-6">
                    <h4 className="font-medium text-blue-900 mb-3">Editar horario</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Hora de inicio</label>
                        <input type="time" name="start_time" value={editingSlot.start_time} onChange={handleEditSlotChange} className="border px-3 py-2 rounded w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hora de fin</label>
                        <input type="time" name="end_time" value={editingSlot.end_time} onChange={handleEditSlotChange} className="border px-3 py-2 rounded w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacidad (número de reservas)</label>
                        <input type="number" name="max_reservations" min={1} value={editingSlot.max_reservations} onChange={handleEditSlotChange} className="border px-3 py-2 rounded w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tamaño máximo de grupo</label>
                        <input type="number" name="max_party_size" min={1} value={editingSlot.max_party_size} onChange={handleEditSlotChange} className="border px-3 py-2 rounded w-full" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="inline-flex items-center">
                        <input type="checkbox" name="is_active" checked={editingSlot.is_active} onChange={handleEditSlotChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Activo</span>
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={cancelEditSlot} className="button-outline">Cancelar</button>
                      <button type="button" onClick={saveSlotChanges} className="button-primary">Guardar cambios</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendario y Listado (igual que antes, pero sin header) */}
          {/* Calendario */}
          {activeTab === 'calendar' && (
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{format(calendarDate, "MMMM yyyy", { locale: es })}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="button-outline">Mes anterior</button>
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="button-outline">Mes siguiente</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 rounded-lg border bg-card p-4 shadow-sm">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day} className="text-center font-medium text-muted-foreground">{day}</div>
                ))}
                {generateCalendarDays(calendarDate).map((day, i) => {
                  const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                  const isSelected = isSameDay(day, calendarDate);
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayReservations = reservationsByDate[dateKey] || [];
                  const hasReservations = dayReservations.length > 0;
                  return (
                    <div
                      key={i}
                      className={`relative flex h-24 flex-col rounded-md border p-1 transition-all hover:bg-accent/50 ${!isCurrentMonth ? 'opacity-40' : ''} ${isToday(day) ? 'border-primary' : ''} ${isSelected ? 'bg-accent' : ''} ${hasReservations ? 'border-rose-200' : ''}`}
                      onClick={() => setCalendarDate(day)}
                    >
                      <div className="flex justify-between">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday(day) ? 'bg-primary text-primary-foreground font-bold' : ''}`}>{format(day, "d")}</span>
                        {hasReservations && (
                          <span className="flex h-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-xs font-medium text-rose-700">{dayReservations.length}</span>
                        )}
                      </div>
                      {hasReservations && (
                        <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                          {dayReservations.slice(0, 2).map((res, idx) => (
                            <div key={idx} className={`truncate rounded px-1 py-0.5 text-xs ${res.status === 'completed' ? 'bg-green-100 text-green-800' : res.status === 'pending' ? 'bg-amber-100 text-amber-800' : res.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}`}>{res.reservation_time.substring(0,5)} - {res.customer_name}</div>
                          ))}
                          {dayReservations.length > 2 && (
                            <div className="text-xs text-muted-foreground pl-1">+{dayReservations.length - 2} más</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Detalle de reservas del día seleccionado */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Reservas para {format(calendarDate, "PPP", { locale: es })}</h3>
                <div className="space-y-4">
                  {(reservationsByDate[format(calendarDate, 'yyyy-MM-dd')] || []).length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <CalendarIcon className="h-10 w-10 text-muted-foreground" />
                        <h3 className="font-medium">No hay reservas</h3>
                        <p className="text-sm text-muted-foreground">No hay reservas programadas para este día.</p>
                      </div>
                    </div>
                  ) : (
                    (reservationsByDate[format(calendarDate, 'yyyy-MM-dd')] || []).map((reservation, index) => (
                      <div key={reservation.id} className={`flex items-center justify-between rounded-lg border p-3 ${reservation.status === 'completed' ? 'border-green-200 bg-green-50' : reservation.status === 'pending' ? 'border-amber-200 bg-amber-50' : reservation.status === 'cancelled' ? 'border-red-200 bg-red-50' : ''}`}>
                        <div className="grid gap-1">
                          <div className="font-medium">{reservation.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{reservation.customer_email}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{reservation.reservation_time.substring(0,5)}</span>
                            <Users className="ml-2 h-3.5 w-3.5" />
                            <span>{reservation.party_size} personas</span>
                          </div>
                        </div>
                        <div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${reservation.status === 'completed' ? 'bg-green-100 text-green-700' : reservation.status === 'pending' ? 'bg-amber-100 text-amber-700' : reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}`}>{getStatusText(reservation.status)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Listado */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow p-6">
              {/* Filtros y búsqueda */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Buscar por cliente, email o teléfono..."
                    className="pl-8 border rounded px-2 py-2 w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Limpiar búsqueda</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="cancelled">Canceladas</option>
                    <option value="completed">Completadas</option>
                  </select>
                  <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border rounded px-3 py-2 text-sm" />
                  <button onClick={() => { setStatusFilter('all'); setDateFilter(''); }} className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800">Limpiar filtros</button>
                </div>
              </div>
              {/* Tabla de reservas */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uniqueReservations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="h-24 text-center">No se encontraron reservas.</td>
                      </tr>
                    ) : (
                      uniqueReservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatDate(reservation.reservation_date)}</div>
                            <div className="text-xs text-gray-500">{reservation.reservation_time.substring(0, 5)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{reservation.customer_name}</div>
                            <div className="text-xs text-gray-500">{reservation.customer_email}</div>
                            <div className="text-xs text-gray-500">{reservation.customer_phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reservation.party_size} {reservation.party_size === 1 ? "persona" : "personas"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(reservation.status)}`}>{getStatusText(reservation.status)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* Acciones dependen del estado */}
                            {reservation.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "confirmed")
                                  }
                                  className="text-green-600 hover:text-green-900 text-xs font-medium"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "cancelled")
                                  }
                                  className="text-red-600 hover:text-red-900 text-xs font-medium"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {reservation.status === "confirmed" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "completed")
                                  }
                                  className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                                >
                                  Marcar completada
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(reservation.id, "cancelled")
                                  }
                                  className="text-red-600 hover:text-red-900 text-xs font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            {(reservation.status === "cancelled" ||
                              reservation.status === "completed") && (
                              <div>
                                <button
                                  onClick={() => {
                                    const confirmMessage = `¿Estás seguro de que deseas eliminar esta reserva?`;
                                    if (window.confirm(confirmMessage)) {
                                      supabase
                                        .from("reservations")
                                        .delete()
                                        .eq("id", reservation.id)
                                        .then(({ error }) => {
                                          if (error) {
                                            toast.error(
                                              "Error al eliminar la reserva"
                                            );
                                            console.error(error);
                                          } else {
                                            toast.success(
                                              "Reserva eliminada correctamente"
                                            );
                                            setReservations((prev) =>
                                              prev.filter(
                                                (r) => r.id !== reservation.id
                                              )
                                            );
                                          }
                                        });
                                    }
                                  }}
                                  className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function getStatusText(status: string) {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "confirmed":
        return "Confirmada";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Completada";
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  async function handleStatusChange(
    reservationId: string,
    newStatus: "pending" | "confirmed" | "cancelled" | "completed"
  ) {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reservationId);

      if (error) throw error;

      setReservations((prev: Reservation[]) =>
        prev.map((res) =>
          res.id === reservationId ? { ...res, status: newStatus } : res
        )
      );

      toast.success("Estado de reserva actualizado");

      // Enviar correo de confirmación o cancelación al cliente
      if (newStatus === "confirmed" || newStatus === "cancelled") {
        try {
          await fetch("/api/email/reservation-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId, status: newStatus })
          });
        } catch (emailError) {
          console.error("Error enviando correo de estado de reserva:", emailError);
        }
      }

      // El resto de tu código permanece igual
      if (newStatus === "completed") {
        try {
          const response = await fetch("/api/email/send-thank-you", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reservationId }),
          });

          const data = await response.json();

          if (!response.ok && !data.already_sent) {
            console.error(
              "Error al enviar correo de agradecimiento:",
              data.error
            );

            toast.error(
              "La reserva se completó pero no se pudo enviar el correo de agradecimiento"
            );
          } else if (data.already_sent) {
            console.log(
              "El correo de agradecimiento ya había sido enviado anteriormente"
            );
          } else {
            console.log("Correo de agradecimiento enviado correctamente", data);

            toast.success("Correo de agradecimiento enviado al cliente");
          }
        } catch (emailError: unknown) {
          console.error(
            "Error en la solicitud de envío de correo:",
            emailError
          );
        }
      }
    } catch (error: unknown) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar estado de la reserva");
    }
  }
}
