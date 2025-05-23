// ...existing code...
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  roles?: string[]; // Array of role names (staff, admin, supervisor)
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface UserRole {
  userId: number;
  roleId: number;
}
// ...existing code...
