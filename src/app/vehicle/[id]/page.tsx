"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  SUBASTA: { label: "Subasta", color: "text-white", bg: "bg-indigo-500" },
  TRANSITO: { label: "En Tránsito", color: "text-white", bg: "bg-amber-500" },
  RECIBIDO: { label: "Recibido", color: "text-white", bg: "bg-blue-500" },
  RECON: { label: "En Recon", color: "text-white", bg: "bg-purple-500" },
  PIEZAS: { label: "Esperando Piezas", color: "text-white", bg: "bg-red-500" },
  LISTO: { label: "Listo", color: "text-white", bg: "bg-green-500" },
  EXHIBICION: { label: "En Exhibición", color: "text-white", bg: "bg-cyan-500" },
  VENDIDO: { label: "Vendido", color: "text-white", bg: "bg-emerald-600" },
};

const statusFlow = ["SUBASTA", "TRANSITO", "RECIBIDO", "RECON", "PIEZAS", "LISTO", "EXHIBICION", "VENDIDO"];

// Mock data
const mockVehicle = {
  id: 1,
  vin: "123456",
  stock_no: "STK001",
  year: 2020,
  make: "Toyota",
  model: "Camry",
  trim: "SE",
  color: "Blanco",
  miles: 45000,
  status: "RECON",
  auction: "Manheim",
  payment_method: "CASH",
  purchase_price: 15000,
  transport_cost: 400,
  recon_cost: 1200,
  photo_url: null,
  notes: "Necesita frenos y aceite",
  date_arrived: "2026-01-25",
  timeline: [
    { date: "2026-01-20", status: "SUBASTA", user: "Jorge", note: "Comprado en Manheim" },
    { date: "2026-01-22", status: "TRANSITO", user: "Jorge", note: "En camino" },
    { date: "2026-01-25", status: "RECIBIDO", user: "Maria", note: "Llegó al taller" },
    { date: "2026-01-26", status: "RECON", user: "Pedro", note: "Iniciando inspección" },
  ],
};

export default function VehicleDetail() {
  const params = useParams();
  const [vehicle, setVehicle] = useState(mockVehicle);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  const totalInvested = vehicle.purchase_price + vehicle.transport_cost + vehicle.recon_cost;

  const handleStatusChange = (newStatus: string) => {
    setVehicle({ ...vehicle, status: newStatus });
    setShowStatusModal(false);
    // TODO: API call
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    // TODO: API call
    setNewNote("");
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              <p className="text-blue-200 text-sm">VIN: {vehicle.vin}</p>
            </div>
          </div>
          <Link href={`/vehicle/${params.id}/edit`} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Photo */}
      <div className="bg-gray-300 h-48 flex items-center justify-center">
        {vehicle.photo_url ? (
          <img src={vehicle.photo_url} alt="Vehicle" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <button className="mt-2 text-blue-600 font-medium">Subir Foto</button>
          </div>
        )}
      </div>

      {/* Status Button */}
      <div className="px-4 -mt-6 relative z-10">
        <button
          onClick={() => setShowStatusModal(true)}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${statusConfig[vehicle.status].bg} ${statusConfig[vehicle.status].color}`}
        >
          {statusConfig[vehicle.status].label}
          <span className="ml-2">▼</span>
        </button>
      </div>

      {/* Info Cards */}
      <div className="px-4 mt-4 space-y-4">
        {/* Vehicle Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Información</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Stock #</span>
              <p className="font-medium">{vehicle.stock_no}</p>
            </div>
            <div>
              <span className="text-gray-500">Color</span>
              <p className="font-medium">{vehicle.color}</p>
            </div>
            <div>
              <span className="text-gray-500">Millas</span>
              <p className="font-medium">{vehicle.miles.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Trim</span>
              <p className="font-medium">{vehicle.trim}</p>
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Costos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Compra ({vehicle.auction})</span>
              <span className="font-medium">${vehicle.purchase_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transporte</span>
              <span className="font-medium">${vehicle.transport_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recon</span>
              <span className="font-medium">${vehicle.recon_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-semibold">Total Invertido</span>
              <span className="font-bold text-green-600">${totalInvested.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-sm">Pago: </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              vehicle.payment_method === "CASH" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {vehicle.payment_method}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Notas</h2>
          <p className="text-gray-600 text-sm">{vehicle.notes || "Sin notas"}</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Agregar nota..."
              className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm"
            />
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Historial</h2>
          <div className="space-y-3">
            {vehicle.timeline.map((entry, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${statusConfig[entry.status]?.bg || "bg-gray-300"}`} />
                  {i < vehicle.timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{statusConfig[entry.status]?.label}</span>
                    <span className="text-gray-400 text-xs">{entry.date}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{entry.note}</p>
                  <p className="text-gray-400 text-xs">por {entry.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-4 safe-bottom">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Cambiar Estado</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statusFlow.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`py-3 rounded-xl font-semibold text-sm transition ${
                    vehicle.status === status
                      ? `${statusConfig[status].bg} ${statusConfig[status].color}`
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
