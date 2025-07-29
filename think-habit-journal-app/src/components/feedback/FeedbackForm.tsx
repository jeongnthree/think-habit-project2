import React, { useState } from "react";
import { FeedbackData, feedbackService } from "../../services/FeedbackService";
import "./FeedbackForm.css";

interface FeedbackFormProps {
  onSubmit?: (feedbackId: string) => void;
  onCancel?: () => void;
  initialType?: FeedbackData["type"];
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  onCancel,
  initialType = "other",
}) => {
  const [formData, setFormData] = useState({
    type: initialType,
    title: "",
    description: "",
    rating: 0,
    email: "",
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const feedbackTypes = [
    {
      value: "bug",
      label: "🐛 버그 신고",
      description: "오류나 문제점을 신고해주세요",
    },
    {
      value: "feature",
      label: "💡 기능 제안",
      description: "새로운 기능을 제안해주세요",
    },
    {
      value: "improvement",
      label: "🔧 개선 사항",
      description: "기존 기능의 개선점을 알려주세요",
    },
    { value: "other", label: "💬 기타", description: "기타 의견이나 문의사항" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTemplateLoad = () => {
    let template;
    if (formData.type === "bug") {
      template = feedbackService.createBugReportTemplate();
    } else if (formData.type === "feature") {
      template = feedbackService.createFeatureRequestTemplate();
    } else {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      title: template.title || "",
      description: template.description || "",
    }));
  };

  const handleScreenshot = async () => {
    try {
      const screenshotData = await feedbackService.captureScreenshot();
      if (screenshotData) {
        setScreenshot(screenshotData);
      } else {
        alert("스크린샷 캡처가 지원되지 않습니다.");
      }
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      alert("스크린샷 캡처에 실패했습니다.");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "내용을 입력해주세요.";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 주소를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const feedbackId = await feedbackService.submitFeedback({
        ...formData,
        screenshot: screenshot || undefined,
      });

      onSubmit?.(feedbackId);

      // 폼 초기화
      setFormData({
        type: "other",
        title: "",
        description: "",
        rating: 0,
        email: "",
      });
      setScreenshot(null);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("피드백 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find((t) => t.value === formData.type);

  return (
    <div className="feedback-form-container">
      <div className="feedback-form">
        <div className="form-header">
          <h2>피드백 보내기</h2>
          <p>여러분의 소중한 의견을 들려주세요!</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 피드백 타입 선택 */}
          <div className="form-group">
            <label className="form-label">피드백 유형</label>
            <div className="feedback-types">
              {feedbackTypes.map((type) => (
                <div
                  key={type.value}
                  className={`feedback-type ${
                    formData.type === type.value ? "selected" : ""
                  }`}
                  onClick={() => handleInputChange("type", type.value)}
                >
                  <div className="type-header">
                    <span className="type-label">{type.label}</span>
                  </div>
                  <div className="type-description">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 템플릿 로드 버튼 */}
          {(formData.type === "bug" || formData.type === "feature") && (
            <div className="form-group">
              <button
                type="button"
                className="template-btn"
                onClick={handleTemplateLoad}
              >
                📝 {formData.type === "bug" ? "버그 신고" : "기능 제안"} 템플릿
                사용
              </button>
            </div>
          )}

          {/* 제목 */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? "error" : ""}`}
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="피드백 제목을 입력해주세요"
              maxLength={100}
            />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
          </div>

          {/* 내용 */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              내용 *
            </label>
            <textarea
              id="description"
              className={`form-textarea ${errors.description ? "error" : ""}`}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="자세한 내용을 입력해주세요"
              rows={8}
              maxLength={2000}
            />
            <div className="character-count">
              {formData.description.length}/2000
            </div>
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
          </div>

          {/* 평점 (개선사항이나 기타인 경우) */}
          {(formData.type === "improvement" || formData.type === "other") && (
            <div className="form-group">
              <label className="form-label">전체적인 만족도</label>
              <div className="rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${formData.rating >= star ? "filled" : ""}`}
                    onClick={() => handleInputChange("rating", star)}
                  >
                    ⭐
                  </button>
                ))}
                <span className="rating-text">
                  {formData.rating > 0 && (
                    <>
                      {formData.rating}/5 -{" "}
                      {
                        ["매우 불만족", "불만족", "보통", "만족", "매우 만족"][
                          formData.rating - 1
                        ]
                      }
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* 스크린샷 */}
          <div className="form-group">
            <label className="form-label">스크린샷 (선택사항)</label>
            <div className="screenshot-container">
              <button
                type="button"
                className="screenshot-btn"
                onClick={handleScreenshot}
              >
                📷 스크린샷 캡처
              </button>
              {screenshot && (
                <div className="screenshot-preview">
                  <img src={screenshot} alt="Screenshot" />
                  <button
                    type="button"
                    className="remove-screenshot"
                    onClick={() => setScreenshot(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              이메일 (선택사항)
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="답변을 받고 싶으시면 이메일을 입력해주세요"
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
            <div className="form-hint">
              이메일을 입력하시면 피드백에 대한 답변을 받으실 수 있습니다.
            </div>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            {onCancel && (
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "전송 중..." : "피드백 보내기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
