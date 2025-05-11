"use client";

import type React from "react";
import { useState } from "react";
import { Search, Plus, Download, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  notas: string;
  fechaAlta: string;
  reservas: {
    fecha: string;
    estado: string;
  }[];
}

export default function CRM() {
  const [mostrarSoloConReservas, setMostrarSoloConReservas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    notas: "",
  });

  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "1",
      nombre: "cosiña",
      apellidos: "",
      email: "cosil@gmail.com",
      telefono: "31231231",
      notas: "",
      fechaAlta: "8 de mayo de 2025, 18:39",
      reservas: [
        {
          fecha: "10 de mayo de 2025 13:00h",
          estado: "Pending",
        },
      ],
    },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoCliente({
      ...nuevoCliente,
      [name]: value,
    });
  };

  const handleAñadirCliente = () => {
    const id = Date.now().toString();
    const fechaActual = new Date().toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const cliente: Cliente = {
      id,
      ...nuevoCliente,
      fechaAlta: fechaActual,
      reservas: [],
    };

    setClientes([...clientes, cliente]);
    setNuevoCliente({
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      notas: "",
    });
    setMostrarFormulario(false);
  };

  const handleEliminarCliente = (id: string) => {
    setClientes(clientes.filter((cliente) => cliente.id !== id));
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const coincideBusqueda =
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase());

    if (mostrarSoloConReservas) {
      return coincideBusqueda && cliente.reservas.length > 0;
    }

    return coincideBusqueda;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">CRM - Clientes</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar por nombre, apellidos o email..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? "Cancelar" : "Nuevo cliente"}
            </Button>
            <Button className="flex-1 sm:flex-none" style={{ backgroundColor: "var(--accent)" }}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="mostrarReservas"
            checked={mostrarSoloConReservas}
            onCheckedChange={(checked) => setMostrarSoloConReservas(checked as boolean)}
          />
          <label htmlFor="mostrarReservas" className="text-sm">
            Mostrar solo clientes con reservas
          </label>
        </div>
      </header>

      {mostrarFormulario && (
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h2 className="text-lg font-medium mb-4">Añadir nuevo cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Nombre</label>
              <Input name="nombre" value={nuevoCliente.nombre} onChange={handleInputChange} placeholder="Nombre" />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Apellidos</label>
              <Input
                name="apellidos"
                value={nuevoCliente.apellidos}
                onChange={handleInputChange}
                placeholder="Apellidos"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500 mb-1 block">Email</label>
              <Input
                name="email"
                value={nuevoCliente.email}
                onChange={handleInputChange}
                placeholder="Email"
                type="email"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500 mb-1 block">Teléfono</label>
              <Input
                name="telefono"
                value={nuevoCliente.telefono}
                onChange={handleInputChange}
                placeholder="Teléfono (opcional)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-500 mb-1 block">Notas internas</label>
              <Textarea
                name="notas"
                value={nuevoCliente.notas}
                onChange={handleInputChange}
                placeholder="Ej: Cliente habitual, llamar para confirmar, alergias..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <Button onClick={handleAñadirCliente} style={{ backgroundColor: "var(--accent)" }}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir cliente
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium mb-4">Clientes registrados</h2>

        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay clientes que coincidan con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">
                        {cliente.nombre} {cliente.apellidos}
                      </h3>
                      {cliente.reservas.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {cliente.reservas.length} reserva(s)
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span> {cliente.email}
                      </div>
                      <div>
                        <span className="text-gray-500">Teléfono:</span> {cliente.telefono}
                      </div>
                      <div>
                        <span className="text-gray-500">Alta:</span> {cliente.fechaAlta}
                      </div>
                      <div>
                        <span className="text-gray-500">Reservas:</span> {cliente.reservas.length}
                      </div>
                    </div>
                    {cliente.reservas.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="font-medium">Últimas reservas:</div>
                        <ul className="list-disc list-inside">
                          {cliente.reservas.map((reserva, index) => (
                            <li key={index}>
                              {reserva.fecha} - {reserva.estado}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 self-start sm:self-center">
                    <Button variant="outline" onClick={() => {}}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" onClick={() => handleEliminarCliente(cliente.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
