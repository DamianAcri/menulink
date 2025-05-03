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
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setCustomers(data);
        setLoading(false);
      });
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

  return (
    <div className="max-w-xl mx-auto py-8">
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
            <li key={c.id} className="py-2">
              <div className="font-medium">{c.first_name} {c.last_name}</div>
              <div className="text-sm text-gray-600">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
