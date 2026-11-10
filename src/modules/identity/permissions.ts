export type StaffRole = "admin" | "agent";

export type StaffPermission =
  | "organization.resource.read"
  | "assigned.resource.read"
  | "identity.staff.manage";

const rolePermissions: Readonly<Record<StaffRole, readonly StaffPermission[]>> =
  {
    admin: ["organization.resource.read"],
    agent: ["assigned.resource.read"],
  };

export function hasStaffPermission(
  role: StaffRole,
  permission: StaffPermission,
): boolean {
  if (permission === "identity.staff.manage") return false;
  return rolePermissions[role].includes(permission);
}
