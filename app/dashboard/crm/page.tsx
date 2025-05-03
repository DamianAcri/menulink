// Página simple de CRM para listar y añadir clientes manualmente
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveAs } from 'file-saver';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  reservation_count?: number;
  last_reservations?: { id: string; reservation_date: string; reservation_time: string; status: string }[];
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Añadir filtro de búsqueda
  const [search, setSearch] = useState('');

  // Obtener el restaurant_id del usuario autenticado
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Buscar el restaurante del usuario
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (data) setRestaurantId(data.id);
    };
    fetchRestaurantId();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    // Traer clientes y para cada uno, contar reservas y traer últimas 3
    (async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (data) {
        // Para cada cliente, obtener reservas
        const customersWithStats = await Promise.all(
          data.map(async (c: Customer) => {
            const { count } = await supabase
              .from('reservations')
              .select('id', { count: 'exact', head: true })
              .eq('restaurant_id', restaurantId)
              .eq('customer_email', c.email);
            const { data: lastRes } = await supabase
              .from('reservations')
              .select('id, reservation_date, reservation_time, status')
              .eq('restaurant_id', restaurantId)
              .eq('customer_email', c.email)
              .order('reservation_date', { ascending: false })
              .order('reservation_time', { ascending: false })
              .limit(3);
            return {
              ...c,
              reservation_count: count || 0,
              last_reservations: lastRes || [],
            };
          })
        );
        setCustomers(customersWithStats);
      }
      setLoading(false);
    })();
  }, [restaurantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Modificar handleSubmit para evitar duplicados por email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.first_name || !form.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    if (!restaurantId) {
      setError('No se ha encontrado el restaurante.');
      return;
    }
    // Validar teléfono (mínimo 7 dígitos)
    if (form.phone && form.phone.replace(/\D/g, '').length < 7) {
      setError('El teléfono debe tener al menos 7 dígitos.');
      return;
    }
    // Comprobar si ya existe cliente por email
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('email', form.email)
      .maybeSingle();
    if (existing) {
      setError('Ya existe un cliente con ese email.');
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .insert({
        first_name: form.first_name,
        last_name: form.last_name || '',
        email: form.email,
        phone: form.phone || null,
        notes: form.notes || null,
        restaurant_id: restaurantId,
      })
      .select('*')
      .single();
    if (error) {
      setError('Error al guardar el cliente.');
    } else {
      setSuccess('Cliente añadido correctamente.');
      setCustomers([data, ...customers]);
      setForm({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
    }
  };

  // Edición
  const startEdit = (c: Customer) => {
    setEditId(c.id);
    setEditForm({ ...c });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const saveEdit = async () => {
    if (!editId) return;
    const { first_name, last_name, email, phone, notes } = editForm;
    const { error } = await supabase
      .from('customers')
      .update({ first_name, last_name, email, phone, notes })
      .eq('id', editId);
    if (!error) {
      setCustomers(cs => cs.map(c => c.id === editId ? { ...c, ...editForm } : c));
      setSuccess('Cliente actualizado');
      setEditId(null);
    } else {
      setError('Error al actualizar');
    }
  };
  // Eliminación
  const deleteCustomer = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      setCustomers(cs => cs.filter(c => c.id !== id));
      setSuccess('Cliente eliminado');
    } else {
      setError('Error al eliminar');
    }
    setDeletingId(null);
  };

  // Exportar clientes a CSV
  const exportCSV = () => {
    const header = ['Nombre', 'Apellidos', 'Email', 'Teléfono', 'Notas'];
    const rows = filteredCustomers.map(c => [
      c.first_name,
      c.last_name,
      c.email,
      c.phone || '',
      c.notes || ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x => `"${(x || '').replace(/"/g, '""')}` ).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `clientes_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Filtro por clientes con reservas activas
  const [onlyWithReservations, setOnlyWithReservations] = useState(false);
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesReservations = !onlyWithReservations || (c.reservation_count && c.reservation_count > 0);
    return matchesSearch && matchesReservations;
  });

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">CRM - Clientes</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellidos o email..."
            className="border px-2 py-1 w-full"
          />
        </div>
        <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Exportar clientes</button>
      </div>
      <div className="mb-2 flex gap-2 items-center">
        <label className="text-xs flex items-center gap-1">
          <input type="checkbox" checked={onlyWithReservations} onChange={e => setOnlyWithReservations(e.target.checked)} />
          Mostrar solo clientes con reservas
        </label>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombre" className="border px-2 py-1 w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Apellidos</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellidos" className="border px-2 py-1 w-full" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono (opcional)" className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Notas internas</label>
          <textarea name="notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Cliente habitual, llamar para confirmar, alergias..." className="border px-2 py-1 w-full" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Añadir cliente</button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
      </form>
      <h2 className="font-semibold mb-2">Clientes registrados</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : filteredCustomers.length === 0 ? (
        <div>No hay clientes aún.</div>
      ) : (
        <ul className="divide-y">
          {filteredCustomers.map(c => (
            <li key={c.id} className="py-4">
              {editId === c.id ? (
                <div className="space-y-1 bg-gray-50 p-2 rounded">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                      <input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} placeholder="Nombre" className="border px-2 py-1 w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Apellidos</label>
                      <input name="last_name" value={editForm.last_name || ''} onChange={handleEditChange} placeholder="Apellidos" className="border px-2 py-1 w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                    <input name="email" value={editForm.email || ''} onChange={handleEditChange} placeholder="Email" className="border px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
                    <input name="phone" value={editForm.phone || ''} onChange={handleEditChange} placeholder="Teléfono" className="border px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notas internas</label>
                    <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} placeholder="Notas" className="border px-2 py-1 w-full" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar</button>
                    <button type="button" onClick={cancelEdit} className="bg-gray-300 px-3 py-1 rounded">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-lg">{c.first_name} {c.last_name}</div>
                      <div className="text-sm text-gray-600"><span className="font-semibold">Email:</span> {c.email}</div>
                      <div className="text-sm text-gray-600"><span className="font-semibold">Teléfono:</span> {c.phone || '-'}</div>
                      {c.notes && <div className="text-xs text-gray-700 mt-1">📝 {c.notes}</div>}
                      <div className="text-xs text-gray-500">Alta: {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-blue-600 text-xs">Editar</button>
                      <button onClick={() => { if(window.confirm('¿Seguro que quieres eliminar este cliente?')) deleteCustomer(c.id); }} className="text-red-600 text-xs" disabled={deletingId === c.id}>{deletingId === c.id ? 'Eliminando...' : 'Eliminar'}</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Reservas: {c.reservation_count || 0}</div>
                  {c.last_reservations && c.last_reservations.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">Últimas reservas:
                      <ul className="list-disc ml-4">
                        {c.last_reservations.map(r => (
                          <li key={r.id}>{new Date(r.reservation_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} {r.reservation_time?.slice(0,5)}h - <span className="capitalize">{r.status}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
    </div>
  );
}
