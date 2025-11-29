import { TenantConfig } from "./types";

/**
 * Tenant configuration loader
 * In production, this would load from a database or external service
 */
export class TenantConfigLoader {
  private tenants: Map<string, TenantConfig> = new Map();

  constructor() {
    this.loadDefaultTenants();
  }

  /**
   * Load default tenants from environment or hardcoded config
   */
  private loadDefaultTenants() {
    // Default tenant for testing
    const defaultTenant: TenantConfig = {
      tenantId: "default",
      name: "Default Tenant",
      slack: {
        botToken: process.env.SLACK_BOT_TOKEN || "",
        appToken: process.env.SLACK_APP_TOKEN || "",
        signingSecret: process.env.SLACK_SIGNING_SECRET || "",
        enabled: !!process.env.SLACK_BOT_TOKEN,
      },
      web: {
        enabled: true,
      },
      discord: {
        token: process.env.DISCORD_TOKEN,
        enabled: !!process.env.DISCORD_TOKEN,
      },
      agentConfig: {
        invokeUrl: process.env.AGENT_INVOKE_URL || "http://localhost:3000/api/chat",
        timeout: 30000,
      },
    };

    this.tenants.set("default", defaultTenant);

    // Add any additional tenants from environment
    // Format: TENANTS_JSON='[{"tenantId":"tenant1","name":"Tenant 1",...}]'
    try {
      const tenantsJson = process.env.TENANTS_JSON;
      if (tenantsJson) {
        const additionalTenants = JSON.parse(tenantsJson) as TenantConfig[];
        additionalTenants.forEach((tenant) => {
          this.tenants.set(tenant.tenantId, tenant);
        });
      }
    } catch (error) {
      console.warn("Failed to parse TENANTS_JSON:", error);
    }
  }

  /**
   * Get tenant configuration by ID
   */
  getTenant(tenantId: string): TenantConfig | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Get all tenants
   */
  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Register a new tenant
   */
  registerTenant(config: TenantConfig): void {
    this.tenants.set(config.tenantId, config);
  }

  /**
   * List all tenant IDs
   */
  listTenantIds(): string[] {
    return Array.from(this.tenants.keys());
  }

  /**
   * Validate tenant configuration
   */
  validateTenant(tenantId: string): boolean {
    const tenant = this.getTenant(tenantId);
    if (!tenant) return false;

    // Check at least one adapter is enabled
    const hasEnabledAdapter =
      (tenant.web?.enabled === true) ||
      (tenant.slack?.enabled === true && !!tenant.slack.botToken) ||
      (tenant.discord?.enabled === true && !!tenant.discord.token);

    return hasEnabledAdapter;
  }
}

// Global instance
export const tenantConfigLoader = new TenantConfigLoader();
