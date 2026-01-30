"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";

interface Vehicle {
  id: number;
  vin: string;
  year: number;
  make: string;
  model: string;
  status: string;
  purchase_price: number;
  transport_cost: number;
  recon_cost: number;
  photo_url: string | null;
  created_at: string;
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

function getDaysAgo(dateString: string): number {
  const created = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function Home() {
  const { user, loading: userLoading, permissions, logout } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === "ALL" || v.status === filter;
    const matchesSearch =
      search === "" ||
      v.vin?.includes(search) ||
      v.make?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Mostrar loading mientras verifica usuario
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🧠 TrackMind</h1>
          <div className="flex items-center gap-3">
            {permissions.canCreate && (
              <Link
                href="/vehicle/new"
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm"
              >
                + Nuevo
              </Link>
            )}
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-blue-500 overflow-hidden border-2 border-white"
              >
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{user?.name?.charAt(0) || "?"}</span>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Administrar Usuarios
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <input
          type="text"
          placeholder="Buscar VIN, marca, modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-gray-100 rounded-xl text-base"
        />
      </div>

      {/* Status Filters */}
      <div className="px-4 py-3 bg-white border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Todos ({vehicles.length})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === key
                  ? `${config.bg} ${config.color}`
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {config.label} ({counts[key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle List */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay vehículos
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const status = statusConfig[vehicle.status] || statusConfig.SUBASTA;
            const totalCost = (vehicle.purchase_price || 0) + (vehicle.transport_cost || 0) + (vehicle.recon_cost || 0);
            const days = getDaysAgo(vehicle.created_at);
            return (
              <Link
                key={vehicle.id}
                href={`/vehicle/${vehicle.id}`}
                className="block bg-white rounded-xl shadow-sm active:bg-gray-50 overflow-hidden"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                    {vehicle.photo_url ? (
                      <img
                        src={vehicle.photo_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-base truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-gray-500 text-sm">
                          VIN: {vehicle.vin}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400 text-xs">
                        {days}d
                      </span>
                      <span className="font-semibold text-green-600 text-sm">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 safe-bottom">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center py-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Inicio</span>
          </Link>
          <Link href="/vehicle/new" className="flex flex-col items-center py-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Agregar</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center py-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Stats</span>
          </Link>
          <Link href="/config" className="flex flex-col items-center py-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Config</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
