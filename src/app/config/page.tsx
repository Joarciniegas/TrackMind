"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/ServiceWorker";

export default function ConfigPage() {
  const { user, loading: userLoading, logout } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsAvailable, setNotificationsAvailable] = useState(true);

  useEffect(() => {
    // Verificar si las notificaciones están habilitadas
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Verificar si VAPID keys están configuradas
    fetch("/api/push/vapid-public-key")
      .then((res) => res.json())
      .then((data) => {
        setNotificationsAvailable(!!data.publicKey);
      })
      .catch(() => setNotificationsAvailable(false));
  }, []);

  const toggleNotifications = async () => {
    setNotificationsLoading(true);
    try {
      if (notificationsEnabled) {
        await unsubscribeFromPush();
        setNotificationsEnabled(false);
      } else {
        const subscription = await subscribeToPush();
        setNotificationsEnabled(!!subscription);
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    }
    setNotificationsLoading(false);
  };

  if (userLoading) {
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
        <h1 className="text-xl font-bold">Configuración</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 font-bold text-2xl">{user?.name?.charAt(0) || "?"}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                user?.role === "ADMIN" ? "bg-red-100 text-red-700" :
                user?.role === "OPERADOR" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Administrar Usuarios</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Notificaciones */}
          <button
            onClick={toggleNotifications}
            disabled={notificationsLoading || !notificationsAvailable}
            className="flex items-center justify-between p-4 border-b border-gray-100 w-full text-left active:bg-gray-50 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationsEnabled ? "bg-green-100" : "bg-gray-100"}`}>
                <svg className={`w-5 h-5 ${notificationsEnabled ? "text-green-600" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-gray-900">Notificaciones</span>
                <p className="text-xs text-gray-500">
                  {!notificationsAvailable
                    ? "No configuradas"
                    : notificationsEnabled
                    ? "Activadas"
                    : "Desactivadas"}
                </p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
              !notificationsAvailable ? "bg-gray-200" : notificationsEnabled ? "bg-green-500" : "bg-gray-300"
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-gray-900">TrackMind</span>
                <p className="text-xs text-gray-500">v1.0.0 - South Pro Motors</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 p-4 w-full text-left active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="font-medium text-red-600">Cerrar Sesión</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          © {new Date().getFullYear()} BizMind AI Agency
        </p>
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
