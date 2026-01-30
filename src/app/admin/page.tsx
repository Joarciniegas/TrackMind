"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";

interface UserData {
  id: number;
  email: string;
  name: string;
  picture: string | null;
  role: string;
  created_at: string;
  last_login: string | null;
}

const roleConfig: Record<string, { label: string; bg: string; color: string }> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", color: "text-amber-700" },
  ADMIN: { label: "Admin", bg: "bg-red-100", color: "text-red-700" },
  OPERADOR: { label: "Operador", bg: "bg-blue-100", color: "text-blue-700" },
  VISOR: { label: "Visor", bg: "bg-gray-100", color: "text-gray-700" },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading, permissions } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (!userLoading && user?.role !== "ADMIN") {
      router.push("/");
      return;
    }

    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [user, userLoading, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      console.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!editingUser || !selectedRole) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (res.ok) {
        setUsers(users.map(u =>
          u.id === editingUser.id ? { ...u, role: selectedRole } : u
        ));
        setEditingUser(null);
      } else {
        const error = await res.json();
        alert(error.error || "Error al actualizar");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const error = await res.json();
        alert(error.error || "Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  if (userLoading || loading) {
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
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Administrar Usuarios</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Los usuarios nuevos entran como <strong className="text-amber-600">Pendiente</strong> y no pueden acceder hasta que los apruebes.
          Cambia su rol a Admin, Operador o Visor para darles acceso.
        </p>

        {users.map((u) => {
          const role = roleConfig[u.role] || roleConfig.VISOR;
          const isCurrentUser = u.id === user?.id;

          return (
            <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {u.picture ? (
                    <img src={u.picture} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                      {u.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-400">(tú)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${role.bg} ${role.color}`}>
                      {role.label}
                    </span>
                    {u.last_login && (
                      <span className="text-xs text-gray-400">
                        Último acceso: {new Date(u.last_login).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {!isCurrentUser && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setSelectedRole(u.role);
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg"
                    >
                      Cambiar Rol
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">No hay usuarios</p>
        )}
      </div>

      {/* Modal para cambiar rol */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-4 safe-bottom">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Cambiar Rol</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 text-2xl">&times;</button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Cambiando rol de <strong>{editingUser.name}</strong>
            </p>

            <div className="space-y-2 mb-4">
              {Object.entries(roleConfig)
                .filter(([key]) => key !== "PENDIENTE")
                .map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between ${
                    selectedRole === key ? config.bg : "bg-gray-50"
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${selectedRole === key ? config.color : "text-gray-900"}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {key === "ADMIN" && "Acceso total: crear, editar, eliminar"}
                      {key === "OPERADOR" && "Solo cambiar estado y agregar notas"}
                      {key === "VISOR" && "Solo puede ver, sin modificar nada"}
                    </p>
                  </div>
                  {selectedRole === key && (
                    <svg className={`w-5 h-5 ${config.color}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleRoleChange}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
            >
              Guardar Cambio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
