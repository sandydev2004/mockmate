import { UserRole } from "@/types";

export type AdminRole = "support" | "admin" | "super_admin";
export type AllRole = "user" | AdminRole;

export type AdminPermission =
  | "users.view"
  | "users.view_sensitive"
  | "users.credits_small"
  | "users.credits_large"
  | "users.suspend"
  | "users.delete"
  | "users.restore"
  | "interviews.view"
  | "interviews.raw_data"
  | "settings.view"
  | "settings.edit"
  | "kill_switch.edit"
  | "export.run"
  | "roles.manage"
  | "audit.view"
  | "audit.verify"
  | "approvals.manage";

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  support: [
    "users.view",
    "users.credits_small",
    "interviews.view",
    "audit.view",
  ],
  admin: [
    "users.view",
    "users.credits_small",
    "users.credits_large",
    "users.suspend",
    "users.delete",
    "users.restore",
    "interviews.view",
    "settings.view",
    "export.run",
    "audit.view",
  ],
  super_admin: [
    "users.view",
    "users.view_sensitive",
    "users.credits_small",
    "users.credits_large",
    "users.suspend",
    "users.delete",
    "users.restore",
    "interviews.view",
    "interviews.raw_data",
    "settings.view",
    "settings.edit",
    "kill_switch.edit",
    "export.run",
    "roles.manage",
    "audit.view",
    "audit.verify",
    "approvals.manage",
  ],
};

/**
 * Checks if a given role is one of the administrative roles (support, admin, super_admin).
 */
export function isAdminRole(role?: string | null): role is AdminRole {
  return role === "support" || role === "admin" || role === "super_admin";
}

/**
 * Checks if a given role is strictly super_admin.
 */
export function isSuperAdmin(role?: string | null): boolean {
  return role === "super_admin";
}

/**
 * Checks if a given role has a specific permission.
 */
export function hasPermission(role: string | null | undefined, permission: AdminPermission): boolean {
  if (!role || !isAdminRole(role)) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
