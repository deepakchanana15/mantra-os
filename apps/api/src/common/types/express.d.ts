import { Membership, Permission, Role, RolePermission, User } from "@mantra-os/db";

type MembershipWithRole = Membership & {
  role: Role & { rolePermissions: (RolePermission & { permission: Permission })[] };
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
      organizationId?: string;
      membership?: MembershipWithRole;
    }
  }
}

export {};
