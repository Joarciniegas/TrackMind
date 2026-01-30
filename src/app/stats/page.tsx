"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  totalInvested: number;
  avgCost: number;
  avgDays: number;
}

const statusConfig: Record<string, { label: string; bg: string }> = {
  SUBASTA: { label: "Subasta", bg: "bg-indigo-500" },
  TRANSITO: { label: "En Tránsito", bg: "bg-amber-500" },
  RECIBIDO: { label: "Recibido", bg: "bg-blue-500" },
  RECON: { label: "En Recon", bg: "bg-purple-500" },
  LISTO: { label: "Listo", bg: "bg-green-500" },
  EXHIBICION: { label: "En Exhibición", bg: "bg-cyan-500" },
  VENDIDO: { label: "Vendido", bg: "bg-emerald-600" },
};

export default function StatsPage() {
  const { user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold">Estadísticas</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Vehículos</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Invertido</p>
            <p className="text-2xl font-bold text-green-600">
              ${(stats?.totalInvested || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Costo Promedio</p>
            <p className="text-2xl font-bold text-blue-600">
              ${(stats?.avgCost || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Días Promedio</p>
            <p className="text-3xl font-bold text-amber-600">{stats?.avgDays || 0}</p>
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Por Estado</h2>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = stats?.byStatus[key] || 0;
              const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{config.label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.bg} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory Value by Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">En Inventario</span>
              <span className="font-semibold">
                {(stats?.total || 0) - (stats?.byStatus?.VENDIDO || 0)} vehículos
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vendidos</span>
              <span className="font-semibold text-emerald-600">
                {stats?.byStatus?.VENDIDO || 0} vehículos
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Listos para Venta</span>
              <span className="font-semibold text-green-600">
                {(stats?.byStatus?.LISTO || 0) + (stats?.byStatus?.EXHIBICION || 0)} vehículos
              </span>
            </div>
          </div>
        </div>
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
          <Link href="/vehicle/new" className="flex flex-col items-center py-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Agregar</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center py-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Stats</span>
          </Link>
          <Link href="/config" className="flex flex-col items-center py-2 text-blue-600">
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
