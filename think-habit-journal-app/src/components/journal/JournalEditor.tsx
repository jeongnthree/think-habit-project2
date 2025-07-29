import React, { useEffect, useState } from "react";
import {
  JournalPlatformConfig,
  MultiPlatformJournal,
} from "../../services/MultiPlatformSyncService";
import { MultiPlatformSyncStatus } from "../sync/MultiPlatformSyncStatus";
import "./JournalEditor.css";
import { PlatformSpecificSettings } from "./PlatformSpecificSettings";

interface JournalEditorProps {
  journal: MultiPlatformJournal;
  onSave: (journal: MultiPlatformJournal) => Promise<void>;
  onCancel: () => void;
  availablePlatforms: Array<{ id: string; name: string; type: string }>;
  isEditing?: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  journal,
  onSave,
  onCancel,
  availablePlatforms,
  isEditing = false,
}) => {
  const [currentJournal, setCurrentJournal] =
    useState<MultiPlatformJournal>(journal);
  const [activeTab, setActiveTab] = useState<"content" | "platforms" | "sync">(
    "content",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(
      JSON.stringify(currentJournal) !== JSON.stringify(journal),
    );
  }, [currentJournal, journal]);

  const handleJournalChange = (updates: Partial<MultiPlatformJournal>) => {
    setCurrentJournal((prev) => ({ ...prev, ...updates }));
  };

  const handlePlatformConfigChange = (
    platformId: string,
    config: JournalPlatformConfig,
  ) => {
    const updatedConfigs = new Map(currentJournal.platformConfigs);
    updatedConfigs.set(platformId, config);

    setCurrentJournal((prev) => ({
      ...prev,
      platformConfigs: updatedConfigs,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(currentJournal);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save journal:", error);
      alert("일지 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?")
      ) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const initializePlatformConfigs = () => {
    const updatedConfigs = new Map(currentJournal.platformConfigs);

    availablePlatforms.forEach((platform) => {
      if (!updatedConfigs.has(platform.id)) {
        const defaultConfig: JournalPlatformConfig = {
          platformId: platform.id,
          enabled: true,
          privacy: platform.type === "group" ? "group-only" : "public",
          autoSync: true,
          contentFilter: {
            excludePersonalNotes: false,
            excludePhotos: false,
            excludeTags: [],
            customRules: [],
          },
          tags: [],
          priority: 2,
        };
        updatedConfigs.set(platform.id, defaultConfig);
      }
    });

    setCurrentJournal((prev) => ({
      ...prev,
      platformConfigs: updatedConfigs,
    }));
  };

  useEffect(() => {
    initializePlatformConfigs();
  }, [availablePlatforms]);

  const getEnabledPlatformsCount = () => {
    return Array.from(currentJournal.platformConfigs.values()).filter(
      (config) => config.enabled,
    ).length;
  };

  const getSyncStatusSummary = () => {
    const statuses = Array.from(currentJournal.platformStatus.values());
    const synced = statuses.filter((s) => s.status === "synced").length;
    const failed = statuses.filter((s) => s.status === "failed").length;
    const pending = statuses.filter((s) => s.status === "pending").length;

    return { synced, failed, pending, total: statuses.length };
  };

  const syncSummary = getSyncStatusSummary();

  return (
    <div className="journal-editor">
      <div className="editor-header">
        <div className="header-info">
          <h2>{isEditing ? "일지 수정" : "새 일지 작성"}</h2>
          <div className="header-stats">
            <span className="platform-count">
              {getEnabledPlatformsCount()}개 플랫폼에 동기화
            </span>
            {isEditing && syncSummary.total > 0 && (
              <span className="sync-summary">
                동기화: {syncSummary.synced}/{syncSummary.total}
                {syncSummary.failed > 0 && (
                  <span className="failed-count">
                    {" "}
                    ({syncSummary.failed}개 실패)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {hasUnsavedChanges && (
            <span className="unsaved-indicator">저장되지 않음</span>
          )}
          <button
            className="cancel-btn"
            onClick={handleCancel}
            disabled={isSaving}
          >
            취소
          </button>
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          내용 작성
        </button>
        <button
          className={`tab ${activeTab === "platforms" ? "active" : ""}`}
          onClick={() => setActiveTab("platforms")}
        >
          플랫폼 설정
          <span className="tab-badge">{getEnabledPlatformsCount()}</span>
        </button>
        {isEditing && (
          <button
            className={`tab ${activeTab === "sync" ? "active" : ""}`}
            onClick={() => setActiveTab("sync")}
          >
            동기화 상태
            {syncSummary.failed > 0 && (
              <span className="tab-badge error">{syncSummary.failed}</span>
            )}
          </button>
        )}
      </div>

      <div className="editor-content">
        {activeTab === "content" && (
          <div className="content-editor">
            <div className="basic-info">
              <div className="form-group">
                <label htmlFor="journal-title">제목</label>
                <input
                  id="journal-title"
                  type="text"
                  value={currentJournal.title}
                  onChange={(e) =>
                    handleJournalChange({ title: e.target.value })
                  }
                  placeholder="일지 제목을 입력하세요"
                  className="title-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="journal-type">일지 유형</label>
                <select
                  id="journal-type"
                  value={currentJournal.type}
                  onChange={(e) =>
                    handleJournalChange({
                      type: e.target.value as "structured" | "photo",
                    })
                  }
                  className="type-select"
                  disabled={isEditing} // 수정 시에는 타입 변경 불가
                >
                  <option value="structured">구조화된 일지</option>
                  <option value="photo">사진 일지</option>
                </select>
              </div>
            </div>

            <div className="content-area">
              {currentJournal.type === "structured" ? (
                <StructuredContentEditor
                  content={currentJournal.content}
                  onChange={(content) => handleJournalChange({ content })}
                />
              ) : (
                <PhotoContentEditor
                  content={currentJournal.content}
                  onChange={(content) => handleJournalChange({ content })}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "platforms" && (
          <PlatformSpecificSettings
            journalId={currentJournal.id}
            platformConfigs={currentJournal.platformConfigs}
            onConfigChange={handlePlatformConfigChange}
            availablePlatforms={availablePlatforms}
          />
        )}

        {activeTab === "sync" && isEditing && (
          <div className="sync-status-tab">
            <MultiPlatformSyncStatus
              journal={currentJournal}
              onRetrySync={(platformIds) => {
                // 재시도 로직 구현
                console.log("Retrying sync for platforms:", platformIds);
              }}
              onViewPlatform={(platformId, url) => {
                window.open(url, "_blank");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 구조화된 콘텐츠 에디터 (간단한 구현)
interface StructuredContentEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const StructuredContentEditor: React.FC<StructuredContentEditorProps> = ({
  content,
  onChange,
}) => {
  const handleTodoChange = (index: number, updates: any) => {
    const updatedTodos = [...(content.todos || [])];
    updatedTodos[index] = { ...updatedTodos[index], ...updates };
    onChange({ ...content, todos: updatedTodos });
  };

  const addTodo = () => {
    const newTodo = { id: Date.now().toString(), text: "", completed: false };
    onChange({ ...content, todos: [...(content.todos || []), newTodo] });
  };

  const removeTodo = (index: number) => {
    const updatedTodos = (content.todos || []).filter(
      (_: any, i: number) => i !== index,
    );
    onChange({ ...content, todos: updatedTodos });
  };

  return (
    <div className="structured-editor">
      <div className="todos-section">
        <h3>할 일 목록</h3>
        {(content.todos || []).map((todo: any, index: number) => (
          <div key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(e) =>
                handleTodoChange(index, { completed: e.target.checked })
              }
            />
            <input
              type="text"
              value={todo.text}
              onChange={(e) =>
                handleTodoChange(index, { text: e.target.value })
              }
              placeholder="할 일을 입력하세요"
              className="todo-input"
            />
            <button
              type="button"
              onClick={() => removeTodo(index)}
              className="remove-todo"
            >
              삭제
            </button>
          </div>
        ))}
        <button type="button" onClick={addTodo} className="add-todo">
          + 할 일 추가
        </button>
      </div>

      <div className="notes-section">
        <h3>노트</h3>
        <textarea
          value={content.notes || ""}
          onChange={(e) => onChange({ ...content, notes: e.target.value })}
          placeholder="추가 노트를 입력하세요"
          className="notes-textarea"
          rows={6}
        />
      </div>
    </div>
  );
};

// 사진 콘텐츠 에디터 (간단한 구현)
interface PhotoContentEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const PhotoContentEditor: React.FC<PhotoContentEditorProps> = ({
  content,
  onChange,
}) => {
  return (
    <div className="photo-editor">
      <div className="photos-section">
        <h3>사진</h3>
        <div className="photo-upload-area">
          <p>사진 업로드 기능은 별도 컴포넌트에서 구현됩니다.</p>
        </div>
      </div>

      <div className="description-section">
        <h3>설명</h3>
        <textarea
          value={content.description || ""}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="사진에 대한 설명을 입력하세요"
          className="description-textarea"
          rows={6}
        />
      </div>
    </div>
  );
};
