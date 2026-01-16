import type { User } from "@/types/api";

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === "admin";
};

/**
 * Check if user is a superuser
 */
export const isSuperUser = (user: User | null): boolean => {
  return user?.role === "superuser";
};

/**
 * Check if user is admin or superuser
 */
export const isAdminOrSuperUser = (user: User | null): boolean => {
  return isAdmin(user) || isSuperUser(user);
};

/**
 * Check if user can access admin pages
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdminOrSuperUser(user);
};

/**
 * Check if user can edit roles (only superusers)
 */
export const canEditRoles = (user: User | null): boolean => {
  return isSuperUser(user);
};
