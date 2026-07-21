import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "./permission-keys";
import { rolesFor } from "./roles-for";

describe("rolesFor", () => {
  it("restricts org_settings and members management to Owner and Admin only", () => {
    expect(rolesFor("org_settings", "update")).toEqual(["owner", "admin"]);
    expect(rolesFor("members", "read")).toEqual(["owner", "admin"]);
  });

  it("restricts deletion_grants:manage to Owner only — the delegation power itself", () => {
    expect(rolesFor("deletion_grants", "manage")).toEqual(["owner"]);
  });

  it("opens global master data (companies/countries/brands/websites) reads to all roles but restricts writes to Owner/Admin", () => {
    for (const resource of ["companies", "countries", "brands", "websites"]) {
      expect(rolesFor(resource, "read")).toEqual(["owner", "admin", "manager", "member", "viewer"]);
      expect(rolesFor(resource, "create")).toEqual(["owner", "admin"]);
    }
  });

  it("gives everyone including Viewer read access to reports", () => {
    expect(rolesFor("reports", "read")).toEqual(["owner", "admin", "manager", "member", "viewer"]);
  });

  it("gives Viewer read-only access to CRUD-group resources, not write", () => {
    const readers = rolesFor("customers", "read");
    const writers = rolesFor("customers", "create");
    expect(readers).toContain("viewer");
    expect(writers).not.toContain("viewer");
  });

  it("gives Owner/Admin/Manager/Member — but not Viewer — every delete-type key (DeletionGuardService is the real gate)", () => {
    const deleters = rolesFor("customers", "delete");
    expect(deleters).toEqual(["owner", "admin", "manager", "member"]);
  });

  it("gives everyone read access to inventory stock, but only write access to adjust it", () => {
    expect(rolesFor("inventory", "read")).toContain("viewer");
    expect(rolesFor("inventory", "adjust")).not.toContain("viewer");
  });

  it("covers every permission key in the actual catalog without throwing or returning an empty set", () => {
    for (const key of Object.values(PERMISSIONS)) {
      const [resource, action] = key.split(":");
      const roles = rolesFor(resource, action);
      expect(roles.length).toBeGreaterThan(0);
    }
  });
});
