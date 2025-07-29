import React, { useCallback, useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import {
  JournalProgress,
  StructuredJournalContent,
  TodoItem,
  TodoTemplate,
} from "../../types/journal";
import { JournalCompletionDialog } from "./JournalCompletionDialog";
import "./StructuredJournalEditor.css";
import { TodoTemplateSelector } from "./TodoTemplateSelector";

interface StructuredJournalEditorProps {
  initialContent?: Partial<StructuredJournalContent>;
  onSave: (content: StructuredJournalContent) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StructuredJournalEditor: React.FC<
  StructuredJournalEditorProps
> = ({ initialContent, onSave, onCancel, isLoading = false }) => {
  const [content, setContent] = useState<StructuredJournalContent>({
    title: initialContent?.title || "",
    date: initialContent?.date || new Date(),
    todos: initialContent?.todos || [],
    notes: initialContent?.notes || "",
    mood: initialContent?.mood,
    tags: initialContent?.tags || [],
    templateId: initialContent?.templateId,
  });

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TodoTemplate | null>(
    null,
  );
  const [newTodoText, setNewTodoText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [progress, setProgress] = useState<JournalProgress>({
    totalTodos: 0,
    completedTodos: 0,
    completionPercentage: 0,
  });

  // 자동 저장 설정
  const { lastSaved, isSaving, hasUnsavedChanges } = useAutoSave(content, {
    onSave: async (data) => {
      // 드래프트로 저장하는 로직 (실제 저장과는 별도)
      localStorage.setItem("journal-draft", JSON.stringify(data));
    },
    delay: 2000,
  });

  // 진행률 계산
  useEffect(() => {
    const totalTodos = content.todos.length;
    const completedTodos = content.todos.filter(
      (todo) => todo.completed,
    ).length;
    const completionPercentage =
      totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    setProgress({
      totalTodos,
      completedTodos,
      completionPercentage,
    });
  }, [content.todos]);

  // 템플릿 적용
  const applyTemplate = useCallback((template: TodoTemplate | null) => {
    if (template) {
      const newTodos: TodoItem[] = template.items.map((item) => ({
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: item.text,
        completed: false,
        createdAt: new Date(),
        priority: item.priority,
        category: item.category,
      }));

      setContent((prev) => ({
        ...prev,
        todos: [...prev.todos, ...newTodos],
        templateId: template.id,
      }));
    }
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  }, []);

  // Todo 항목 추가
  const addTodo = useCallback(() => {
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date(),
        priority: "medium",
      };

      setContent((prev) => ({
        ...prev,
        todos: [...prev.todos, newTodo],
      }));
      setNewTodoText("");
    }
  }, [newTodoText]);

  // Todo 항목 토글
  const toggleTodo = useCallback((todoId: string) => {
    setContent((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: !todo.completed ? new Date() : undefined,
            }
          : todo,
      ),
    }));
  }, []);

  // Todo 항목 삭제
  const deleteTodo = useCallback((todoId: string) => {
    setContent((prev) => ({
      ...prev,
      todos: prev.todos.filter((todo) => todo.id !== todoId),
    }));
  }, []);

  // Todo 항목 수정
  const updateTodoText = useCallback((todoId: string, newText: string) => {
    setContent((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === todoId ? { ...todo, text: newText } : todo,
      ),
    }));
  }, []);

  // 우선순위 변경
  const updateTodoPriority = useCallback(
    (todoId: string, priority: "low" | "medium" | "high") => {
      setContent((prev) => ({
        ...prev,
        todos: prev.todos.map((todo) =>
          todo.id === todoId ? { ...todo, priority } : todo,
        ),
      }));
    },
    [],
  );

  // 태그 추가
  const addTag = useCallback(() => {
    if (tagInput.trim() && !content.tags.includes(tagInput.trim())) {
      setContent((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  }, [tagInput, content.tags]);

  // 태그 삭제
  const removeTag = useCallback((tag: string) => {
    setContent((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  // 저장 처리
  const handleSave = () => {
    setShowCompletionDialog(true);
  };

  const handleConfirmSave = async () => {
    try {
      await onSave(content);
      // 드래프트 삭제
      localStorage.removeItem("journal-draft");
      setShowCompletionDialog(false);
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Enter" && newTodoText.trim()) {
          e.preventDefault();
          addTodo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, addTodo, newTodoText]);

  const moodEmojis = {
    "very-bad": "😢",
    bad: "😕",
    neutral: "😐",
    good: "😊",
    "very-good": "😄",
  };

  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  };

  return (
    <div className="structured-journal-editor">
      {/* 헤더 */}
      <div className="editor-header">
        <div className="header-left">
          <input
            type="text"
            placeholder="일지 제목을 입력하세요"
            value={content.title}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, title: e.target.value }))
            }
            className="title-input"
            disabled={isLoading}
          />
          <div className="save-status">
            {isSaving && <span className="saving">저장 중...</span>}
            {!isSaving && lastSaved && (
              <span className="saved">
                {new Date(lastSaved).toLocaleTimeString()} 자동 저장됨
              </span>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="unsaved">저장되지 않은 변경사항</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="template-button"
            disabled={isLoading}
          >
            📝 템플릿
          </button>
        </div>
      </div>

      {/* 진행률 표시 */}
      {content.todos.length > 0 && (
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              진행률: {progress.completedTodos}/{progress.totalTodos} (
              {progress.completionPercentage}%)
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="editor-content">
        {/* Todo 섹션 */}
        <div className="todos-section">
          <div className="section-header">
            <h3>할 일 목록</h3>
            <span className="todo-count">{content.todos.length}개</span>
          </div>

          {/* Todo 추가 */}
          <div className="add-todo">
            <input
              type="text"
              placeholder="새로운 할 일을 입력하세요"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTodo();
                }
              }}
              className="todo-input"
              disabled={isLoading}
            />
            <button
              onClick={addTodo}
              disabled={!newTodoText.trim() || isLoading}
              className="add-todo-button"
            >
              추가
            </button>
          </div>

          {/* Todo 목록 */}
          <div className="todos-list">
            {content.todos.map((todo, index) => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                index={index}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdateText={updateTodoText}
                onUpdatePriority={updateTodoPriority}
                disabled={isLoading}
              />
            ))}

            {content.todos.length === 0 && (
              <div className="empty-todos">
                <p>아직 할 일이 없습니다.</p>
                <p>위에서 새로운 할 일을 추가하거나 템플릿을 사용해보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 메모 섹션 */}
        <div className="notes-section">
          <div className="section-header">
            <h3>메모</h3>
          </div>
          <textarea
            placeholder="오늘의 생각, 느낌, 배운 점 등을 자유롭게 기록해보세요..."
            value={content.notes}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="notes-textarea"
            rows={6}
            disabled={isLoading}
          />
        </div>

        {/* 기분 및 태그 섹션 */}
        <div className="metadata-section">
          <div className="mood-section">
            <h4>오늘의 기분</h4>
            <div className="mood-selector">
              {Object.entries(moodEmojis).map(([mood, emoji]) => (
                <button
                  key={mood}
                  className={`mood-button ${content.mood === mood ? "selected" : ""}`}
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      mood: prev.mood === mood ? undefined : (mood as any),
                    }))
                  }
                  disabled={isLoading}
                  title={mood}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="tags-section">
            <h4>태그</h4>
            <div className="tags-input">
              <input
                type="text"
                placeholder="태그 추가"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isLoading}
              />
              <button onClick={addTag} disabled={!tagInput.trim() || isLoading}>
                추가
              </button>
            </div>
            <div className="tags-list">
              {content.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="editor-actions">
        <button
          onClick={onCancel}
          className="cancel-button"
          disabled={isLoading}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="save-button"
          disabled={isLoading || !content.title.trim()}
        >
          {isLoading ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* 템플릿 선택 모달 */}
      {showTemplateSelector && (
        <TodoTemplateSelector
          selectedTemplate={selectedTemplate}
          onTemplateSelect={applyTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* 완료 확인 다이얼로그 */}
      {showCompletionDialog && (
        <JournalCompletionDialog
          content={content}
          progress={progress}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowCompletionDialog(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Todo 항목 컴포넌트
interface TodoItemProps {
  todo: TodoItem;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdatePriority: (id: string, priority: "low" | "medium" | "high") => void;
  disabled?: boolean;
}

const TodoItemComponent: React.FC<TodoItemProps> = ({
  todo,
  index,
  onToggle,
  onDelete,
  onUpdateText,
  onUpdatePriority,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== todo.text) {
      onUpdateText(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  };

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <div className="todo-main">
        <button
          className="todo-checkbox"
          onClick={() => onToggle(todo.id)}
          disabled={disabled}
        >
          {todo.completed ? "✓" : ""}
        </button>

        {isEditing ? (
          <div className="todo-edit">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
              className="todo-edit-input"
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleSaveEdit} className="save-edit">
                ✓
              </button>
              <button onClick={handleCancelEdit} className="cancel-edit">
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="todo-content">
            <span
              className="todo-text"
              onClick={() => !disabled && setIsEditing(true)}
            >
              {todo.text}
            </span>
            {todo.priority && (
              <span
                className="todo-priority"
                style={{ backgroundColor: priorityColors[todo.priority] }}
              >
                {todo.priority === "high"
                  ? "높음"
                  : todo.priority === "medium"
                    ? "보통"
                    : "낮음"}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="todo-actions">
        <select
          value={todo.priority || "medium"}
          onChange={(e) => onUpdatePriority(todo.id, e.target.value as any)}
          className="priority-select"
          disabled={disabled}
        >
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
        </select>
        <button
          onClick={() => onDelete(todo.id)}
          className="delete-todo"
          disabled={disabled}
          title="삭제"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
