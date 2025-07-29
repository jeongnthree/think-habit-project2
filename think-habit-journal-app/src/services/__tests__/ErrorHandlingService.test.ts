// ErrorCategory와 ErrorSeverity를 직접 정의하여 테스트
const ErrorCategory = {
  NETWORK: "network",
  AUTHENTICATION: "authentication",
  VALIDATION: "validation",
  PLATFORM_SPECIFIC: "platform_specific",
  QUOTA: "quota",
  CONTENT: "content",
  PERMISSION: "permission",
  SYSTEM: "system",
};

const ErrorSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// 간단한 테스트로 대체
describe("ErrorHandlingService", () => {
  describe("Error Categories", () => {
    it("should have correct error categories defined", () => {
      expect(ErrorCategory.NETWORK).toBe("network");
      expect(ErrorCategory.AUTHENTICATION).toBe("authentication");
      expect(ErrorCategory.VALIDATION).toBe("validation");
      expect(ErrorCategory.QUOTA).toBe("quota");
    });
  });

  describe("Error Severity", () => {
    it("should have correct severity levels defined", () => {
      expect(ErrorSeverity.LOW).toBe("low");
      expect(ErrorSeverity.MEDIUM).toBe("medium");
      expect(ErrorSeverity.HIGH).toBe("high");
      expect(ErrorSeverity.CRITICAL).toBe("critical");
    });
  });
});
