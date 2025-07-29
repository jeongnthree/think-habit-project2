// components/journal/StructuredJournalForm.tsx
// 구조화된 일지 (To-Do List) 작성을 위한 메인 폼 컴포넌트

"use client";

import { cn } from "@/utils";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileText,
  Lightbulb,
  Plus,
  Save,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";

import { AutoSaveIndicator, useAutoSave } from "@/hooks/useAutoSave";
import type {
  CreateJournalDto,
  Journal,
  StructuredContent,
  TodoItem,
} from "@/shared/types";
import { ProgressBar } from "./ProgressBar";
import { TaskItem } from "./TaskItem";

interface StructuredJournalFormProps {
  initialJournal?: Journal;
  onSave?: (journal: Journal) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  mode?: "create" | "edit";
}

export const StructuredJournalForm: React.FC<StructuredJournalFormProps> = ({
  initialJournal,
  onSave,
  onCancel,
  className,
  mode = "create",
}) => {
  const router = useRouter();

  // 폼 상태
  const [title, setTitle] = useState(initialJournal?.title || "");
  const [tasks, setTasks] = useState<TodoItem[]>(
    initialJournal?.content && "tasks" in initialJournal.content
      ? initialJournal.content.tasks
      : [],
  );
  const [notes, setNotes] = useState(
    initialJournal?.content && "tasks" in initialJournal.content
      ? initialJournal.content.notes
      : "",
  );
  const [newTaskText, setNewTaskText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 진행률 계산
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // 자동 저장용 데이터 구성
  const journalData = {
    title,
    content: {
      tasks,
      notes,
      completionRate,
      totalTasks: tasks.length,
      completedTasks,
    } as StructuredContent,
  };

  // 자동 저장 함수
  const handleAutoSave = useCallback(
    async (data: typeof journalData) => {
      if (!data.title.trim() && data.content.tasks.length === 0) return;

      try {
        if (mode === "edit" && initialJournal && onSave) {
          const updatedJournal: Journal = {
            ...initialJournal,
            title: data.title,
            content: data.content,
            updatedAt: new Date(),
          };
          await onSave(updatedJournal);
        } else if (mode === "create") {
          // 새 일지 생성 API 호출
          const response = await fetch("/api/journals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "structured",
              title:
                data.title ||
                `${new Date().toLocaleDateString("ko-KR")} 훈련 계획`,
              content: data.content,
            } as CreateJournalDto),
          });

          if (!response.ok) {
            throw new Error("일지 저장에 실패했습니다");
          }
        }
      } catch (error) {
        console.error("Auto save failed:", error);
        throw error;
      }
    },
    [mode, initialJournal, onSave],
  );

  // 자동 저장 훅
  const autoSaveState = useAutoSave(journalData, {
    onSave: handleAutoSave,
    enabled: true,
    delay: 3000,
  });

  // 할 일 추가
  const addTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: TodoItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newTaskText.trim(),
      completed: false,
      priority: "medium",
      createdAt: new Date(),
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskText("");
  };

  // Enter 키로 할 일 추가
  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  };

  // 할 일 업데이트
  const updateTask = (taskId: string, updates: Partial<TodoItem>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task,
      ),
    );
  };

  // 할 일 삭제
  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // 할 일 완료 토글
  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date() : undefined,
            }
          : task,
      ),
    );
  };

  // 드래그 앤 드롭 처리
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newTasks = Array.from(tasks);
    const [reorderedTask] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, reorderedTask);

    setTasks(newTasks);
  };

  // 수동 저장
  const handleManualSave = async () => {
    setIsSubmitting(true);
    try {
      await autoSaveState.save();
      router.push("/journal");
    } catch (error) {
      console.error("Manual save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/journal");
    }
  };

  // 기본 제목 설정
  useEffect(() => {
    if (!title && mode === "create") {
      setTitle(`${new Date().toLocaleDateString("ko-KR")} 훈련 계획`);
    }
  }, [title, mode]);

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" ? "새 구조화된 일지" : "일지 편집"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveIndicator state={autoSaveState} />
          <button
            onClick={handleManualSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "저장 중..." : "저장하고 완료"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 폼 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 제목 입력 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4 inline mr-2" />
              일지 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="오늘의 훈련 계획을 입력하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* 할 일 목록 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                <Target className="w-4 h-4 inline mr-2" />할 일 목록
              </label>
              <span className="text-sm text-gray-500">
                {tasks.length}개 항목
              </span>
            </div>

            {/* 진행률 */}
            {tasks.length > 0 && (
              <div className="mb-6">
                <ProgressBar
                  completed={completedTasks}
                  total={tasks.length}
                  color="blue"
                  showStats={true}
                  animated={true}
                />
              </div>
            )}

            {/* 새 할 일 추가 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleNewTaskKeyDown}
                placeholder="새 할 일을 입력하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 할 일 목록 (드래그 앤 드롭) */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tasks">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-2 min-h-[100px] p-2 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-blue-50",
                    )}
                  >
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <TaskItem
                              task={task}
                              index={index}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={provided.dragHandleProps}
                              onUpdate={updateTask}
                              onDelete={deleteTask}
                              onToggleComplete={toggleTaskComplete}
                              showPriority={true}
                              showDueDate={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>아직 할 일이 없습니다</p>
                        <p className="text-sm">
                          위에서 새 할 일을 추가해보세요
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* 노트 영역 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FileText className="w-4 h-4 inline mr-2" />
              메모 및 추가 내용
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="훈련 계획에 대한 추가 메모나 생각을 자유롭게 작성하세요..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
            />
            <div className="mt-2 text-sm text-gray-500">
              {notes.length}/2000 글자
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 진행 상황 요약 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4">📊 진행 상황</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">전체 할 일</span>
                <span className="font-medium text-blue-900">
                  {tasks.length}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">완료됨</span>
                <span className="font-medium text-blue-900">
                  {completedTasks}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">진행률</span>
                <span className="font-bold text-blue-900">
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* 팁 */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">
              <Lightbulb className="w-4 h-4 inline mr-2" />
              💡 작성 팁
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• 구체적이고 실행 가능한 목표로 작성하세요</li>
              <li>• 우선순위를 설정하여 중요한 일부터 처리하세요</li>
              <li>• 마감일을 설정하면 더 체계적으로 관리할 수 있어요</li>
              <li>• 드래그로 순서를 바꿀 수 있습니다</li>
              <li>• Ctrl+S로 언제든 수동 저장 가능합니다</li>
            </ul>
          </div>

          {/* 단축키 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">⌨️ 단축키</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>할 일 추가</span>
                <code className="bg-white px-1 rounded">Enter</code>
              </div>
              <div className="flex justify-between">
                <span>저장</span>
                <code className="bg-white px-1 rounded">Ctrl+S</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
