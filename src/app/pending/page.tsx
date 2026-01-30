"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";

export default function PendingPage() {
  const router = useRouter();
  const { user, loading, logout } = useUser();

  useEffect(() => {
    // Si no está pendiente, redirigir a inicio
    if (!loading && user && user.role !== "PENDIENTE") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-500 to-amber-700 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-white mb-2">Pendiente de Aprobación</h1>
        <p className="text-amber-100">Tu cuenta está esperando ser aprobada</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center text-gray-500 font-bold text-2xl ${user?.picture ? 'hidden' : ''}`}>
            {user?.name?.charAt(0) || "?"}
          </div>
        </div>
        <p className="font-semibold text-gray-900">{user?.name}</p>
        <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

        <p className="text-gray-600 text-sm mb-6">
          Un administrador debe aprobar tu cuenta antes de que puedas acceder al sistema.
        </p>

        <button
          onClick={logout}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <p className="text-amber-200 text-sm mt-8">
        © {new Date().getFullYear()} BizMind AI Agency
      </p>
    </div>
  );
}
