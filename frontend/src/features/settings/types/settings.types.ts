export interface TenantSettings {
  maxUsers: number;
  maxProjects: number;
  allowedPlugins: string[];
}

export interface UpdateTenantSettingsData {
  maxUsers?: number;
  maxProjects?: number;
  allowedPlugins?: string[];
}
