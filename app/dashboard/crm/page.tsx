// Página simple de CRM para listar y añadir clientes manualmente
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.first_name || !form.last_name || !form.email) {
      setError('Nombre, apellidos y email son obligatorios.');
      return;
    }
    if (!restaurantId) {
      setError('No se ha encontrado el restaurante.');
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .insert({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        restaurant_id: restaurantId,
      })
      .select('*')
      .single();
    if (error) {
      setError('Error al guardar el cliente.');
    } else {
      setSuccess('Cliente añadido correctamente.');
      setCustomers([data, ...customers]);
      setForm({ first_name: '', last_name: '', email: '', phone: '' });
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

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">CRM - Clientes</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <div className="flex gap-2">
          <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombre" className="border px-2 py-1 flex-1" />
          <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellidos" className="border px-2 py-1 flex-1" />
        </div>
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border px-2 py-1 w-full" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono (opcional)" className="border px-2 py-1 w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Añadir cliente</button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
      </form>
      <h2 className="font-semibold mb-2">Clientes registrados</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : customers.length === 0 ? (
        <div>No hay clientes aún.</div>
      ) : (
        <ul className="divide-y">
          {customers.map(c => (
            <li key={c.id} className="py-4">
              {editId === c.id ? (
                <div className="space-y-1 bg-gray-50 p-2 rounded">
                  <div className="flex gap-2">
                    <input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} placeholder="Nombre" className="border px-2 py-1 flex-1" />
                    <input name="last_name" value={editForm.last_name || ''} onChange={handleEditChange} placeholder="Apellidos" className="border px-2 py-1 flex-1" />
                  </div>
                  <input name="email" value={editForm.email || ''} onChange={handleEditChange} placeholder="Email" className="border px-2 py-1 w-full" />
                  <input name="phone" value={editForm.phone || ''} onChange={handleEditChange} placeholder="Teléfono" className="border px-2 py-1 w-full" />
                  <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} placeholder="Notas" className="border px-2 py-1 w-full" />
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar</button>
                    <button type="button" onClick={cancelEdit} className="bg-gray-300 px-3 py-1 rounded">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{c.first_name} {c.last_name}</div>
                      <div className="text-sm text-gray-600">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                      <div className="text-xs text-gray-500">Alta: {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-blue-600 text-xs">Editar</button>
                      <button onClick={() => { if(window.confirm('¿Eliminar cliente?')) deleteCustomer(c.id); }} className="text-red-600 text-xs" disabled={deletingId === c.id}>{deletingId === c.id ? 'Eliminando...' : 'Eliminar'}</button>
                    </div>
                  </div>
                  {c.notes && <div className="text-xs text-gray-700 mt-1">📝 {c.notes}</div>}
                  <div className="text-xs text-gray-500 mt-1">Reservas: {c.reservation_count || 0}</div>
                  {c.last_reservations && c.last_reservations.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">Últimas reservas:
                      <ul className="list-disc ml-4">
                        {c.last_reservations.map(r => (
                          <li key={r.id}>{new Date(r.reservation_date).toLocaleDateString()} {r.reservation_time?.slice(0,5)} - {r.status}</li>
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
