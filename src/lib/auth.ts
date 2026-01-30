// Tipos de roles
export type Role = 'ADMIN' | 'OPERADOR' | 'VISOR' | 'PENDIENTE';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string | null;
  role: Role;
}

// Permisos por rol
export const permissions = {
  ADMIN: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canChangeStatus: true,
    canAddNotes: true,
    canViewPrices: true,
    canEditPrices: true,
  },
  OPERADOR: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canChangeStatus: true,
    canAddNotes: true,
    canViewPrices: true,
    canEditPrices: false,
  },
  VISOR: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canChangeStatus: false,
    canAddNotes: false,
    canViewPrices: true,
    canEditPrices: false,
  },
};

export function getPermissions(role: Role) {
  return permissions[role] || permissions.VISOR;
}

// Generar ID de sesión aleatorio
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
