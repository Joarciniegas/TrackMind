"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";

interface TimelineEntry {
  id: number;
  status: string;
  user_name: string;
  note: string;
  created_at: string;
}

interface Vehicle {
  id: number;
  vin: string;
  stock_no: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
  miles: number;
  status: string;
  auction: string;
  payment_method: string;
  flooring_company: string | null;
  purchase_price: number;
  transport_cost: number;
  recon_cost: number;
  photo_url: string | null;
  notes: string;
  timeline: TimelineEntry[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  SUBASTA: { label: "Subasta", color: "text-white", bg: "bg-indigo-500" },
  TRANSITO: { label: "En Tránsito", color: "text-white", bg: "bg-amber-500" },
  RECIBIDO: { label: "Recibido", color: "text-white", bg: "bg-blue-500" },
  RECON: { label: "En Recon", color: "text-white", bg: "bg-purple-500" },
  LISTO: { label: "Listo", color: "text-white", bg: "bg-green-500" },
  EXHIBICION: { label: "En Exhibición", color: "text-white", bg: "bg-cyan-500" },
  VENDIDO: { label: "Vendido", color: "text-white", bg: "bg-emerald-600" },
};

const statusFlow = ["SUBASTA", "TRANSITO", "RECIBIDO", "RECON", "LISTO", "EXHIBICION", "VENDIDO"];

export default function VehicleDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, permissions } = useUser();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
        } else {
          setVehicle(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push("/");
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!vehicle) return null;

  const totalInvested = (vehicle.purchase_price || 0) + (vehicle.transport_cost || 0) + (vehicle.recon_cost || 0);
  const currentStatus = statusConfig[vehicle.status] || statusConfig.SUBASTA;

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/vehicles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setVehicle({ ...vehicle, status: newStatus });
        // Reload to get updated timeline
        const updated = await fetch(`/api/vehicles/${params.id}`).then(r => r.json());
        setVehicle(updated);
      }
    } catch {
      alert("Error al actualizar");
    }
    setShowStatusModal(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await fetch(`/api/vehicles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: vehicle.notes ? `${vehicle.notes}\n${newNote}` : newNote }),
      });
      setVehicle({ ...vehicle, notes: vehicle.notes ? `${vehicle.notes}\n${newNote}` : newNote });
      setNewNote("");
    } catch {
      alert("Error al agregar nota");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicle.id.toString());

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setVehicle({ ...vehicle, photo_url: data.url });
      } else {
        const error = await response.json();
        alert(error.error || "Error al subir foto");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setUploading(false);
    }
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
          {permissions.canEdit && (
            <Link
              href={`/vehicle/${vehicle.id}/edit`}
              className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm"
            >
              Editar
            </Link>
          )}
        </div>
      </header>

      {/* Photo */}
      <div className="bg-gray-300 h-48 flex items-center justify-center relative">
        {vehicle.photo_url ? (
          <img src={vehicle.photo_url} alt="Vehicle" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-gray-500 text-sm">Sin foto</p>
          </div>
        )}
        {/* Upload button */}
        {permissions.canEdit && (
          <label className="absolute bottom-3 right-3 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition">
            {uploading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Status Button */}
      <div className="px-4 -mt-6 relative z-10">
        {permissions.canChangeStatus ? (
          <button
            onClick={() => setShowStatusModal(true)}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${currentStatus.bg} ${currentStatus.color}`}
          >
            {currentStatus.label}
            <span className="ml-2">▼</span>
          </button>
        ) : (
          <div className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg text-center ${currentStatus.bg} ${currentStatus.color}`}>
            {currentStatus.label}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="px-4 mt-4 space-y-4">
        {/* Vehicle Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Información</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Stock #</span>
              <p className="font-medium">{vehicle.stock_no || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Color</span>
              <p className="font-medium">{vehicle.color || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Millas</span>
              <p className="font-medium">{vehicle.miles?.toLocaleString() || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Trim</span>
              <p className="font-medium">{vehicle.trim || "-"}</p>
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Costos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Compra ({vehicle.auction || "N/A"})</span>
              <span className="font-medium">${(vehicle.purchase_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transporte</span>
              <span className="font-medium">${(vehicle.transport_cost || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recon</span>
              <span className="font-medium">${(vehicle.recon_cost || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-semibold">Total Invertido</span>
              <span className="font-bold text-green-600">${totalInvested.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 text-sm">Pago: </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              vehicle.payment_method === "CASH" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {vehicle.payment_method || "N/A"}
            </span>
            {vehicle.payment_method === "FLOORING" && vehicle.flooring_company && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                {vehicle.flooring_company}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Notas</h2>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{vehicle.notes || "Sin notas"}</p>
          {permissions.canAddNotes && (
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
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Historial</h2>
          <div className="space-y-3">
            {vehicle.timeline && vehicle.timeline.length > 0 ? (
              vehicle.timeline.map((entry, i) => (
                <div key={entry.id || i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[entry.status]?.bg || "bg-gray-300"}`} />
                    {i < vehicle.timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{statusConfig[entry.status]?.label || entry.status}</span>
                      <span className="text-gray-400 text-xs">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-500 text-xs">{entry.note}</p>
                    <p className="text-gray-400 text-xs">por {entry.user_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Sin historial</p>
            )}
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
