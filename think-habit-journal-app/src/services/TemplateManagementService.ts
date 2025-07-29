import { MultiPlatformDatabaseService } from "./MultiPlatformDatabaseService";
import { MultiPlatformSyncService } from "./MultiPlatformSyncService";
import { Template } from "./platforms/PlatformAdapter";

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: Template[];
}

export class TemplateManagementService {
  private dbService?: MultiPlatformDatabaseService;
  private syncService: MultiPlatformSyncService;
  private templateCache: Map<string, Template[]> = new Map();

  constructor(syncService: MultiPlatformSyncService) {
    this.syncService = syncService;
  }

  setDatabaseService(dbService: MultiPlatformDatabaseService): void {
    this.dbService = dbService;
    this.loadTemplateCache();
  }

  // 사용 가능한 모든 템플릿 조회
  async getAvailableTemplates(platformId?: string): Promise<Template[]> {
    if (platformId) {
      return this.getPlatformTemplates(platformId);
    }

    const allTemplates: Template[] = [];
    const platforms = this.syncService.getRegisteredPlatforms();

    for (const platform of platforms) {
      const templates = await this.getPlatformTemplates(platform.id);
      allTemplates.push(
        ...templates.map((t) => ({
          ...t,
          platformId: platform.id,
          platformName: platform.name,
        })),
      );
    }

    return allTemplates;
  }

  // 특정 플랫폼의 템플릿 조회
  async getPlatformTemplates(platformId: string): Promise<Template[]> {
    if (this.templateCache.has(platformId)) {
      return this.templateCache.get(platformId)!;
    }

    if (!this.dbService) {
      return [];
    }

    try {
      const templates = await this.dbService.getTemplates(platformId);
      this.templateCache.set(platformId, templates);
      return templates;
    } catch (error) {
      console.error(
        `Failed to get templates for platform ${platformId}:`,
        error,
      );
      return [];
    }
  }

  // 템플릿 동기화
  async syncAllTemplates(): Promise<void> {
    const platforms = this.syncService.getRegisteredPlatforms();
    const syncPromises = platforms.map((platform) =>
      this.syncPlatformTemplates(platform.id),
    );

    await Promise.allSettled(syncPromises);
    console.log(`Template sync completed for ${platforms.length} platforms`);
  }

  async syncPlatformTemplates(platformId: string): Promise<void> {
    try {
      const adapter = this.syncService.getAdapter(platformId);
      if (!adapter) return;

      const latestTemplates = await adapter.getTemplates();

      if (this.dbService) {
        await this.dbService.saveTemplates(platformId, latestTemplates);
      }

      this.templateCache.set(platformId, latestTemplates);
      console.log(
        `Templates synced for ${adapter.name}: ${latestTemplates.length} templates`,
      );
    } catch (error) {
      console.error(
        `Failed to sync templates for platform ${platformId}:`,
        error,
      );
    }
  }

  private async loadTemplateCache(): Promise<void> {
    if (!this.dbService) return;

    try {
      const platforms = this.syncService.getRegisteredPlatforms();
      for (const platform of platforms) {
        const templates = await this.dbService.getTemplates(platform.id);
        this.templateCache.set(platform.id, templates);
      }
    } catch (error) {
      console.error("Failed to load template cache:", error);
    }
  }
}
