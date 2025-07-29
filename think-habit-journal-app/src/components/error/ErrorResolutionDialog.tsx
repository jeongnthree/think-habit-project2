import React, { useEffect, useState } from "react";
import {
  ErrorHandlingService,
  ErrorResolutionWorkflow,
  PlatformError,
  ResolutionStep,
} from "../../services/ErrorHandlingService";
import "./ErrorResolutionDialog.css";

interface ErrorResolutionDialogProps {
  error: PlatformError;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
  errorHandlingService: ErrorHandlingService;
}

export const ErrorResolutionDialog: React.FC<ErrorResolutionDialogProps> = ({
  error,
  isOpen,
  onClose,
  onResolved,
  errorHandlingService,
}) => {
  const [workflow, setWorkflow] = useState<ErrorResolutionWorkflow | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<ResolutionStep | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && error) {
      const newWorkflow = errorHandlingService.createResolutionWorkflow(
        error.id,
      );
      setWorkflow(newWorkflow);
      setCurrentStep(newWorkflow.steps[0] || null);
    }
  }, [isOpen, error, errorHandlingService]);

  const handleStepAction = async () => {
    if (!workflow || !currentStep) return;

    setIsProcessing(true);

    try {
      let success = false;

      // 자동화된 액션 실행
      if (currentStep.automatedAction) {
        success = await currentStep.automatedAction();
      } else if (currentStep.userInput) {
        // 사용자 입력 검증
        if (
          currentStep.userInput.validation &&
          !currentStep.userInput.validation(userInput)
        ) {
          alert("입력값이 올바르지 않습니다.");
          setIsProcessing(false);
          return;
        }
        success = true;
      } else {
        success = true;
      }

      if (success) {
        // 현재 단계 완료 표시
        currentStep.isCompleted = true;

        // 다음 단계로 이동
        const nextStepIndex = workflow.currentStepIndex + 1;
        if (nextStepIndex < workflow.steps.length) {
          workflow.currentStepIndex = nextStepIndex;
          setCurrentStep(workflow.steps[nextStepIndex]);
        } else {
          // 모든 단계 완료
          workflow.isCompleted = true;
          errorHandlingService.resolveError(error.id);
          onResolved();
        }

        setUserInput("");
      }
    } catch (err) {
      console.error("Step execution failed:", err);
      alert("단계 실행 중 오류가 발생했습니다.");
    }

    setIsProcessing(false);
  };

  const handleSkipStep = () => {
    if (!workflow || !currentStep || !currentStep.isSkippable) return;

    const nextStepIndex = workflow.currentStepIndex + 1;
    if (nextStepIndex < workflow.steps.length) {
      workflow.currentStepIndex = nextStepIndex;
      setCurrentStep(workflow.steps[nextStepIndex]);
    } else {
      workflow.isCompleted = true;
      onClose();
    }
  };

  const renderUserInput = () => {
    if (!currentStep?.userInput) return null;

    const { type, prompt, options } = currentStep.userInput;

    switch (type) {
      case "text":
        return (
          <div className="user-input-section">
            <label>{prompt}</label>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="입력해주세요..."
            />
          </div>
        );

      case "select":
        return (
          <div className="user-input-section">
            <label>{prompt}</label>
            <select
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            >
              <option value="">선택해주세요</option>
              {options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case "confirm":
        return (
          <div className="user-input-section">
            <p>{prompt}</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div className="error-resolution-dialog-overlay">
      <div className="error-resolution-dialog">
        <div className="dialog-header">
          <h2>오류 해결 가이드</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="error-info">
          <div className="error-summary">
            <h3>
              {error.platformName} - {error.userFriendlyMessage}
            </h3>
            <p className="error-category">카테고리: {error.category}</p>
            <p className="error-severity severity-{error.severity}">
              심각도: {error.severity}
            </p>
          </div>

          <div className="error-suggestions">
            <h4>권장 해결 방법:</h4>
            <ul>
              {error.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="workflow-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(workflow.currentStepIndex / workflow.steps.length) * 100}%`,
              }}
            />
          </div>
          <p className="progress-text">
            단계 {workflow.currentStepIndex + 1} / {workflow.steps.length}
          </p>
          <p className="estimated-time">
            예상 소요 시간: {workflow.estimatedTimeToResolve}분
          </p>
        </div>

        {currentStep && (
          <div className="current-step">
            <h3>{currentStep.title}</h3>
            <p>{currentStep.description}</p>

            {renderUserInput()}

            <div className="step-actions">
              <button
                className="primary-button"
                onClick={handleStepAction}
                disabled={isProcessing}
              >
                {isProcessing ? "처리 중..." : "실행"}
              </button>

              {currentStep.isSkippable && (
                <button
                  className="secondary-button"
                  onClick={handleSkipStep}
                  disabled={isProcessing}
                >
                  건너뛰기
                </button>
              )}
            </div>
          </div>
        )}

        <div className="workflow-steps">
          <h4>해결 단계:</h4>
          <ol>
            {workflow.steps.map((step, index) => (
              <li
                key={step.id}
                className={`
                  step-item
                  ${step.isCompleted ? "completed" : ""}
                  ${index === workflow.currentStepIndex ? "current" : ""}
                `}
              >
                <span className="step-title">{step.title}</span>
                {step.isCompleted && <span className="checkmark">✓</span>}
              </li>
            ))}
          </ol>
        </div>

        {workflow.isCompleted && (
          <div className="completion-message">
            <h3>✅ 오류가 해결되었습니다!</h3>
            <p>문제가 지속되면 고객 지원팀에 문의해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
