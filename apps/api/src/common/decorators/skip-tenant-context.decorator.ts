import { SetMetadata } from "@nestjs/common";

export const SKIP_TENANT_CONTEXT = "skipTenantContext";

/**
 * For the small set of routes that run after auth but before an
 * organization is selected — e.g. "list my organizations" for the org
 * switcher. Everything else requires a validated X-Organization-Id.
 */
export const SkipTenantContext = () => SetMetadata(SKIP_TENANT_CONTEXT, true);
