import React, { useEffect, useState } from "react";
import { JournalPlatformConfig } from "../../services/MultiPlatformSyncService";
import {
  ContentFilter,
  FilterRule,
} from "../../services/platforms/PlatformAdapter";
import "./PlatformSpecificSettings.css";

interface PlatformSpecificSettingsProps {
  journalId: string;
  platformConfigs: Map<string, JournalPlatformConfig>;
  onConfigChange: (platformId: string, config: JournalPlatformConfig) => void;
  availablePlatforms: Array<{ id: string; name: string; type: string }>;
}

export const PlatformSpecificSettings: React.FC<
  PlatformSpecificSettingsProps
> = ({ journalId, platformConfigs, onConfigChange, availablePlatforms }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (availablePlatforms.length > 0 && !selectedPlatform) {
      setSelectedPlatform(availablePlatforms[0].id);
    }
  }, [availablePlatforms, selectedPlatform]);

  const currentConfig = selectedPlatform
    ? platformConfigs.get(selectedPlatform)
    : null;
  const selectedPlatformInfo = availablePlatforms.find(
    (p) => p.id === selectedPlatform,
  );

  const handleConfigUpdate = (updates: Partial<JournalPlatformConfig>) => {
    if (!selectedPlatform || !currentConfig) return;

    const updatedConfig: JournalPlatformConfig = {
      ...currentConfig,
      ...updates,
    };

    onConfigChange(selectedPlatform, updatedConfig);
  };

  const handlePrivacyChange = (
    privacy: "public" | "private" | "group-only",
  ) => {
    handleConfigUpdate({ privacy });
  };

  const handleContentFilterChange = (filter: Partial<ContentFilter>) => {
    if (!currentConfig) return;

    const updatedFilter: ContentFilter = {
      ...currentConfig.contentFilter,
      ...filter,
    };

    handleConfigUpdate({ contentFilter: updatedFilter });
  };

  const handleTagsChange = (tags: string[]) => {
    handleConfigUpdate({ tags });
  };

  const addCustomRule = () => {
    if (!currentConfig) return;

    const newRule: FilterRule = {
      field: "content",
      condition: "contains",
      value: "",
      action: "exclude",
    };

    const updatedRules = [...currentConfig.contentFilter.customRules, newRule];
    handleContentFilterChange({ customRules: updatedRules });
  };

  const updateCustomRule = (index: number, rule: FilterRule) => {
    if (!currentConfig) return;

    const updatedRules = [...currentConfig.contentFilter.customRules];
    updatedRules[index] = rule;
    handleContentFilterChange({ customRules: updatedRules });
  };

  const removeCustomRule = (index: number) => {
    if (!currentConfig) return;

    const updatedRules = currentConfig.contentFilter.customRules.filter(
      (_, i) => i !== index,
    );
    handleContentFilterChange({ customRules: updatedRules });
  };

  if (!currentConfig || !selectedPlatformInfo) {
    return (
      <div className="platform-settings-empty">
        <p>플랫폼을 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="platform-specific-settings">
      <div className="settings-header">
        <h3>플랫폼별 설정</h3>
        <div className="platform-selector">
          <label htmlFor="platform-select">플랫폼 선택:</label>
          <select
            id="platform-select"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="platform-select"
          >
            {availablePlatforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name} (
                {platform.type === "think-habit" ? "공식" : "단체"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-content">
        {/* 기본 설정 */}
        <div className="setting-section">
          <h4>기본 설정</h4>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={currentConfig.enabled}
                onChange={(e) =>
                  handleConfigUpdate({ enabled: e.target.checked })
                }
              />
              이 플랫폼에 동기화
            </label>
          </div>

          <div className="setting-item">
            <label htmlFor="custom-title">커스텀 제목 (선택사항):</label>
            <input
              id="custom-title"
              type="text"
              value={currentConfig.customTitle || ""}
              onChange={(e) =>
                handleConfigUpdate({ customTitle: e.target.value })
              }
              placeholder="기본 제목 사용"
              className="setting-input"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="priority">동기화 우선순위:</label>
            <select
              id="priority"
              value={currentConfig.priority}
              onChange={(e) =>
                handleConfigUpdate({ priority: parseInt(e.target.value) })
              }
              className="setting-select"
            >
              <option value={1}>낮음</option>
              <option value={2}>보통</option>
              <option value={3}>높음</option>
            </select>
          </div>
        </div>

        {/* 프라이버시 설정 */}
        <div className="setting-section">
          <h4>프라이버시 설정</h4>

          <div className="privacy-options">
            <label className="privacy-option">
              <input
                type="radio"
                name={`privacy-${selectedPlatform}`}
                value="public"
                checked={currentConfig.privacy === "public"}
                onChange={() => handlePrivacyChange("public")}
              />
              <span className="privacy-label">
                <strong>공개</strong>
                <small>모든 사용자가 볼 수 있습니다</small>
              </span>
            </label>

            <label className="privacy-option">
              <input
                type="radio"
                name={`privacy-${selectedPlatform}`}
                value="private"
                checked={currentConfig.privacy === "private"}
                onChange={() => handlePrivacyChange("private")}
              />
              <span className="privacy-label">
                <strong>비공개</strong>
                <small>본인만 볼 수 있습니다</small>
              </span>
            </label>

            {selectedPlatformInfo.type === "group" && (
              <label className="privacy-option">
                <input
                  type="radio"
                  name={`privacy-${selectedPlatform}`}
                  value="group-only"
                  checked={currentConfig.privacy === "group-only"}
                  onChange={() => handlePrivacyChange("group-only")}
                />
                <span className="privacy-label">
                  <strong>단체 전용</strong>
                  <small>단체 구성원만 볼 수 있습니다</small>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* 콘텐츠 필터링 */}
        <div className="setting-section">
          <h4>콘텐츠 필터링</h4>

          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={currentConfig.contentFilter.excludePersonalNotes}
                onChange={(e) =>
                  handleContentFilterChange({
                    excludePersonalNotes: e.target.checked,
                  })
                }
              />
              개인 노트 제외
            </label>

            <label className="filter-option">
              <input
                type="checkbox"
                checked={currentConfig.contentFilter.excludePhotos}
                onChange={(e) =>
                  handleContentFilterChange({ excludePhotos: e.target.checked })
                }
              />
              사진 제외
            </label>
          </div>

          <div className="setting-item">
            <label htmlFor="exclude-tags">제외할 태그:</label>
            <TagInput
              tags={currentConfig.contentFilter.excludeTags}
              onChange={(tags) =>
                handleContentFilterChange({ excludeTags: tags })
              }
              placeholder="제외할 태그 입력"
            />
          </div>
        </div>

        {/* 태그 설정 */}
        <div className="setting-section">
          <h4>태그 설정</h4>

          <div className="setting-item">
            <label htmlFor="platform-tags">이 플랫폼용 추가 태그:</label>
            <TagInput
              tags={currentConfig.tags}
              onChange={handleTagsChange}
              placeholder="플랫폼별 태그 추가"
            />
          </div>
        </div>

        {/* 고급 설정 */}
        <div className="setting-section">
          <div className="section-header">
            <h4>고급 설정</h4>
            <button
              type="button"
              className="toggle-advanced"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "접기" : "펼치기"}
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-settings">
              <div className="setting-item">
                <label>커스텀 필터 규칙:</label>
                <div className="custom-rules">
                  {currentConfig.contentFilter.customRules.map(
                    (rule, index) => (
                      <CustomRuleEditor
                        key={index}
                        rule={rule}
                        onChange={(updatedRule) =>
                          updateCustomRule(index, updatedRule)
                        }
                        onRemove={() => removeCustomRule(index)}
                      />
                    ),
                  )}
                  <button
                    type="button"
                    className="add-rule-btn"
                    onClick={addCustomRule}
                  >
                    + 규칙 추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 태그 입력 컴포넌트
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      onChange([...tags, newTag]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="tag-input">
      <div className="tag-list">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(index)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          className="tag-input-field"
        />
      </div>
    </div>
  );
};

// 커스텀 규칙 에디터
interface CustomRuleEditorProps {
  rule: FilterRule;
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
}

const CustomRuleEditor: React.FC<CustomRuleEditorProps> = ({
  rule,
  onChange,
  onRemove,
}) => {
  return (
    <div className="custom-rule">
      <select
        value={rule.field}
        onChange={(e) => onChange({ ...rule, field: e.target.value })}
        className="rule-field"
      >
        <option value="content">내용</option>
        <option value="title">제목</option>
        <option value="tags">태그</option>
      </select>

      <select
        value={rule.condition}
        onChange={(e) =>
          onChange({ ...rule, condition: e.target.value as any })
        }
        className="rule-condition"
      >
        <option value="contains">포함</option>
        <option value="equals">일치</option>
        <option value="startsWith">시작</option>
        <option value="endsWith">끝</option>
      </select>

      <input
        type="text"
        value={rule.value}
        onChange={(e) => onChange({ ...rule, value: e.target.value })}
        placeholder="값 입력"
        className="rule-value"
      />

      <select
        value={rule.action}
        onChange={(e) => onChange({ ...rule, action: e.target.value as any })}
        className="rule-action"
      >
        <option value="exclude">제외</option>
        <option value="replace">대체</option>
        <option value="anonymize">익명화</option>
      </select>

      <button
        type="button"
        className="remove-rule"
        onClick={onRemove}
        title="규칙 삭제"
      >
        🗑️
      </button>
    </div>
  );
};
