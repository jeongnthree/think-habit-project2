import { MultiPlatformDatabaseService } from "./MultiPlatformDatabaseService";
import { MultiPlatformSyncService } from "./MultiPlatformSyncService";
import {
  GroupConfig,
  GroupPlatformAdapter,
} from "./platforms/GroupPlatformAdapter";
import { Template } from "./platforms/PlatformAdapter";

// 그룹 가입 결과
export interface GroupJoinResult {
  success: boolean;
  groupInfo?: GroupInfo;
  templates?: Template[];
  error?: string;
}

// 그룹 정보
export interface GroupInfo {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  authType: "oauth" | "api-key" | "custom";
  features: GroupFeature[];
  membershipStatus: "pending" | "active" | "inactive";
  joinedAt?: Date;
  memberCount?: number;
  adminContact?: string;
}

export interface GroupFeature {
  name: string;
  enabled: boolean;
  description: string;
  config?: any;
}

// 그룹 탈퇴 옵션
export interface LeaveGroupOptions {
  deleteData: boolean; // 그룹 플랫폼에서 데이터 삭제 여부
  exportData: boolean; // 데이터 내보내기 여부
  reason?: string; // 탈퇴 사유
}

// 그룹 코드 검증 결과
interface GroupCodeValidation {
  valid: boolean;
  groupConfig?: GroupConfig;
  error?: string;
}

export class GroupManagementService {
  private multiSyncService: MultiPlatformSyncService;
  private joinedGroups: Map<string, GroupInfo> = new Map();
  private dbService?: MultiPlatformDatabaseService;

  constructor(multiSyncService: MultiPlatformSyncService) {
    this.multiSyncService = multiSyncService;
    this.loadJoinedGroups();
  }

  setDatabaseService(dbService: MultiPlatformDatabaseService): void {
    this.dbService = dbService;
    this.loadJoinedGroups();
  }

  // 그룹 코드로 그룹 가입
  async joinGroup(
    groupCode: string,
    userCredentials?: any,
  ): Promise<GroupJoinResult> {
    try {
      console.log(`Attempting to join group with code: ${groupCode}`);

      // 1. 그룹 코드 검증
      const validation = await this.validateGroupCode(groupCode);
      if (!validation.valid || !validation.groupConfig) {
        return {
          success: false,
          error: validation.error || "Invalid group code",
        };
      }

      const groupConfig = validation.groupConfig;

      // 2. 이미 가입된 그룹인지 확인
      if (this.joinedGroups.has(groupConfig.id)) {
        return {
          success: false,
          error: "Already joined this group",
        };
      }

      // 3. 그룹 연결 테스트
      const connectionTest = await this.testGroupConnection(groupConfig);
      if (!connectionTest) {
        return {
          success: false,
          error: "Failed to connect to group platform",
        };
      }

      // 4. 그룹 어댑터 생성
      const adapter = new GroupPlatformAdapter(groupConfig);

      // 5. 인증 (필요한 경우)
      if (userCredentials) {
        const authResult = await adapter.authenticate(userCredentials);
        if (!authResult.success) {
          return {
            success: false,
            error: authResult.error || "Authentication failed",
          };
        }
      }

      // 6. 플랫폼 정보 조회
      const platformInfo = await adapter.getPlatformInfo();

      // 7. 그룹 템플릿 다운로드
      const templates = await adapter.getTemplates();

      // 8. 어댑터 등록
      await this.multiSyncService.registerPlatform(adapter);

      // 9. 그룹 정보 저장
      const groupInfo: GroupInfo = {
        id: groupConfig.id,
        name: groupConfig.name,
        description: groupConfig.description,
        apiEndpoint: groupConfig.apiEndpoint,
        authType: groupConfig.authType,
        features: platformInfo.features.map((f) => ({
          name: f.name,
          enabled: f.enabled,
          description: f.description,
          config: f.config,
        })),
        membershipStatus: "active",
        joinedAt: new Date(),
      };

      this.joinedGroups.set(groupInfo.id, groupInfo);
      await this.saveGroupInfo(groupInfo);
      await this.saveGroupTemplates(groupInfo.id, templates);

      console.log(`Successfully joined group: ${groupInfo.name}`);

      return {
        success: true,
        groupInfo,
        templates,
      };
    } catch (error) {
      console.error("Failed to join group:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 그룹 탈퇴
  async leaveGroup(groupId: string, options: LeaveGroupOptions): Promise<void> {
    const groupInfo = this.joinedGroups.get(groupId);
    if (!groupInfo) {
      throw new Error("Group not found");
    }

    console.log(`Leaving group: ${groupInfo.name}`);

    try {
      // 1. 데이터 내보내기 (요청된 경우)
      if (options.exportData) {
        await this.exportGroupData(groupId);
      }

      // 2. 그룹 플랫폼에서 데이터 삭제 (요청된 경우)
      if (options.deleteData) {
        await this.deleteGroupJournals(groupId);
      }

      // 3. 탈퇴 알림 (가능한 경우)
      await this.notifyGroupLeave(groupId, options.reason);

      // 4. 어댑터 등록 해제
      await this.multiSyncService.unregisterPlatform(groupId);

      // 5. 로컬 데이터 정리
      await this.cleanupGroupData(groupId);

      // 6. 그룹 정보 제거
      this.joinedGroups.delete(groupId);
      await this.removeGroupInfo(groupId);

      console.log(`Successfully left group: ${groupInfo.name}`);
    } catch (error) {
      console.error(`Failed to leave group ${groupInfo.name}:`, error);
      throw error;
    }
  }

  // 가입된 그룹 목록 조회
  getJoinedGroups(): GroupInfo[] {
    return Array.from(this.joinedGroups.values());
  }

  // 특정 그룹 정보 조회
  getGroupInfo(groupId: string): GroupInfo | undefined {
    return this.joinedGroups.get(groupId);
  }

  // 그룹 연결 상태 확인
  async checkGroupConnections(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const checkPromises = Array.from(this.joinedGroups.keys()).map(
      async (groupId) => {
        try {
          const adapter = this.multiSyncService.getAdapter(groupId);
          if (adapter) {
            const isConnected = await adapter.validateConnection();
            results.set(groupId, isConnected);
          } else {
            results.set(groupId, false);
          }
        } catch (error) {
          console.error(`Connection check failed for group ${groupId}:`, error);
          results.set(groupId, false);
        }
      },
    );

    await Promise.allSettled(checkPromises);

    return results;
  }

  // 그룹 템플릿 동기화
  async syncGroupTemplates(groupId?: string): Promise<void> {
    const groupIds = groupId ? [groupId] : Array.from(this.joinedGroups.keys());

    for (const id of groupIds) {
      try {
        const adapter = this.multiSyncService.getAdapter(id);
        if (adapter) {
          const templates = await adapter.getTemplates();
          await this.saveGroupTemplates(id, templates);
          console.log(
            `Templates synced for group ${id}: ${templates.length} templates`,
          );
        }
      } catch (error) {
        console.error(`Failed to sync templates for group ${id}:`, error);
      }
    }
  }

  // 그룹 설정 업데이트
  async updateGroupSettings(
    groupId: string,
    settings: Partial<GroupInfo>,
  ): Promise<void> {
    const groupInfo = this.joinedGroups.get(groupId);
    if (!groupInfo) {
      throw new Error("Group not found");
    }

    const updatedInfo = { ...groupInfo, ...settings };
    this.joinedGroups.set(groupId, updatedInfo);
    await this.saveGroupInfo(updatedInfo);
  }

  // Private methods

  private async validateGroupCode(
    groupCode: string,
  ): Promise<GroupCodeValidation> {
    try {
      // 그룹 코드 형식 검증 (예: GROUP-ABC123)
      if (!groupCode.match(/^GROUP-[A-Z0-9]{6}$/)) {
        return {
          valid: false,
          error: "Invalid group code format",
        };
      }

      // 그룹 정보 조회 API 호출 (Think-Habit 서버)
      const response = await fetch(
        `${process.env.THINK_HABIT_API_URL}/groups/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: groupCode }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          valid: false,
          error: error.message || "Group code validation failed",
        };
      }

      const groupData = await response.json();

      const groupConfig: GroupConfig = {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        apiEndpoint: groupData.apiEndpoint,
        authType: groupData.authType,
        authConfig: groupData.authConfig,
        features: groupData.features || [],
        customHeaders: groupData.customHeaders,
      };

      return {
        valid: true,
        groupConfig,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async testGroupConnection(config: GroupConfig): Promise<boolean> {
    return await GroupPlatformAdapter.testConnection(config);
  }

  private async deleteGroupJournals(groupId: string): Promise<void> {
    // TODO: 그룹 플랫폼에서 사용자의 모든 일지 삭제
    const adapter = this.multiSyncService.getAdapter(groupId);
    if (!adapter) {
      return;
    }

    // 실제 구현에서는 사용자의 모든 일지 ID를 조회하고 삭제
    console.log(`Deleting journals from group ${groupId}`);
  }

  private async exportGroupData(groupId: string): Promise<void> {
    // TODO: 그룹 관련 데이터 내보내기
    console.log(`Exporting data for group ${groupId}`);
  }

  private async notifyGroupLeave(
    groupId: string,
    reason?: string,
  ): Promise<void> {
    try {
      const adapter = this.multiSyncService.getAdapter(groupId);
      if (!adapter) {
        return;
      }

      // 그룹 플랫폼에 탈퇴 알림 (지원하는 경우)
      // 실제 구현에서는 플랫폼별 API 호출
      console.log(`Notifying group ${groupId} of leave request`);
    } catch (error) {
      console.error(`Failed to notify group leave for ${groupId}:`, error);
    }
  }

  private async cleanupGroupData(groupId: string): Promise<void> {
    // 로컬 그룹 관련 데이터 정리
    await this.removeGroupTemplates(groupId);
    console.log(`Cleaned up local data for group ${groupId}`);
  }

  // 데이터베이스 관련 메서드들
  private async loadJoinedGroups(): Promise<void> {
    if (!this.dbService) return;

    try {
      const groups = await this.dbService.getAllGroupInfo();
      this.joinedGroups.clear();

      for (const group of groups) {
        this.joinedGroups.set(group.id, group);
      }
    } catch (error) {
      console.error("Failed to load joined groups:", error);
    }
  }

  private async saveGroupInfo(groupInfo: GroupInfo): Promise<void> {
    if (this.dbService) {
      await this.dbService.saveGroupInfo(groupInfo);
    }
  }

  private async removeGroupInfo(groupId: string): Promise<void> {
    if (this.dbService) {
      await this.dbService.deleteGroupInfo(groupId);
    }
  }

  private async saveGroupTemplates(
    groupId: string,
    templates: Template[],
  ): Promise<void> {
    if (this.dbService) {
      await this.dbService.saveTemplates(groupId, templates);
    }
  }

  private async removeGroupTemplates(groupId: string): Promise<void> {
    if (this.dbService) {
      // 템플릿 삭제는 플랫폼 설정 삭제 시 CASCADE로 처리됨
      // 별도 처리가 필요한 경우 여기에 구현
    }
  }
}
