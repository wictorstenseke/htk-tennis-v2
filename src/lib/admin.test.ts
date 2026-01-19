import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  canEditRoles,
  isAdmin,
  isAdminOrSuperUser,
  isSuperUser,
} from "@/lib/admin";
import { createMockUser } from "@/test/factories";

describe("admin role checking functions", () => {
  describe("isAdmin", () => {
    it("should return true when user has admin role", () => {
      const user = createMockUser({ role: "admin" });
      expect(isAdmin(user)).toBe(true);
    });

    it("should return false when user has superuser role", () => {
      const user = createMockUser({ role: "superuser" });
      expect(isAdmin(user)).toBe(false);
    });

    it("should return false when user has user role", () => {
      const user = createMockUser({ role: "user" });
      expect(isAdmin(user)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe("isSuperUser", () => {
    it("should return true when user has superuser role", () => {
      const user = createMockUser({ role: "superuser" });
      expect(isSuperUser(user)).toBe(true);
    });

    it("should return false when user has admin role", () => {
      const user = createMockUser({ role: "admin" });
      expect(isSuperUser(user)).toBe(false);
    });

    it("should return false when user has user role", () => {
      const user = createMockUser({ role: "user" });
      expect(isSuperUser(user)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(isSuperUser(null)).toBe(false);
    });
  });

  describe("isAdminOrSuperUser", () => {
    it("should return true when user has admin role", () => {
      const user = createMockUser({ role: "admin" });
      expect(isAdminOrSuperUser(user)).toBe(true);
    });

    it("should return true when user has superuser role", () => {
      const user = createMockUser({ role: "superuser" });
      expect(isAdminOrSuperUser(user)).toBe(true);
    });

    it("should return false when user has user role", () => {
      const user = createMockUser({ role: "user" });
      expect(isAdminOrSuperUser(user)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(isAdminOrSuperUser(null)).toBe(false);
    });
  });

  describe("canAccessAdmin", () => {
    it("should return true when user has admin role", () => {
      const user = createMockUser({ role: "admin" });
      expect(canAccessAdmin(user)).toBe(true);
    });

    it("should return true when user has superuser role", () => {
      const user = createMockUser({ role: "superuser" });
      expect(canAccessAdmin(user)).toBe(true);
    });

    it("should return false when user has user role", () => {
      const user = createMockUser({ role: "user" });
      expect(canAccessAdmin(user)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(canAccessAdmin(null)).toBe(false);
    });
  });

  describe("canEditRoles", () => {
    it("should return true when user has superuser role", () => {
      const user = createMockUser({ role: "superuser" });
      expect(canEditRoles(user)).toBe(true);
    });

    it("should return false when user has admin role", () => {
      const user = createMockUser({ role: "admin" });
      expect(canEditRoles(user)).toBe(false);
    });

    it("should return false when user has user role", () => {
      const user = createMockUser({ role: "user" });
      expect(canEditRoles(user)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(canEditRoles(null)).toBe(false);
    });
  });
});
