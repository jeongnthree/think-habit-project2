// src/renderer/App.tsx
import * as React from "react";
import { useEffect, useState } from "react";
import { WebsiteSync } from "../components/WebsiteSync";
import { useAuth } from "../hooks/useAuth";
import { useJournalService } from "../hooks/useJournalService";
import { SafeImageUploadService } from "../services/SafeImageUploadService";
import { platformService } from "../services/platform";
import { Page, AppJournal } from "../types/app";
import "./App.css";

// 로그인 페이지 컴포넌트
const LoginPage: React.FC = () => {
  const { loginWithGoogle, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      console.log('🔐 Google 로그인 시도');
      const result = await loginWithGoogle();
      if (!result.success) {
        console.error('❌ Google 로그인 실패:', result.error);
      }
    } catch (err) {
      console.error('❌ Google 로그인 오류:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Think-Habit Journal</h1>
          <p>생각습관 개선을 위한 훈련 일지</p>
        </div>
        
        <div className="login-content">
          <div className="login-form">
            <h2>로그인</h2>
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}
            
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="btn btn-google"
            >
              {isLoggingIn ? (
                <>
                  <div className="loading-spinner small"></div>
                  Google 로그인 중...
                </>
              ) : (
                <>
                  🔐 Google로 로그인
                </>
              )}
            </button>
            
            <div className="login-info">
              <p>※ Google 계정으로 안전하게 로그인하세요</p>
              <p>웹 버전과 자동으로 동기화됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const [platformName, setPlatformName] = useState<string>("");
  const { user, isAuthenticated, loading, error, loginWithGoogle, logout } = useAuth();
  
  // Journal service hook
  const { journals, stats, loading: journalsLoading, error: journalsError, createJournal, getSyncStatus } = useJournalService(user?.id);

  // 일지 작성 관련 상태들
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // 앱 정보 가져오기
  useEffect(() => {
    const getAppInfo = async () => {
      try {
        const version = await platformService.appInfo.getVersion();
        const platform = await platformService.appInfo.getPlatformName();

        setAppVersion(version);
        setPlatformName(platform);
      } catch (error) {
        console.error("앱 정보 가져오기 실패:", error);
      }
    };

    getAppInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>앱을 시작하고 있습니다...</p>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지 표시
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 페이지 렌더링
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return renderDashboard();
      case "journal-list":
        return renderJournalList();
      case "journal-create":
        return renderJournalCreate();
      default:
        return renderDashboard();
    }
  };

  const renderSidebar = () => (
    <div className="sidebar">
      <h3 className="sidebar-title">Think-Habit Journal</h3>
      <div className="version-info">
        v{appVersion} {platformName ? `(${platformName})` : ""}
      </div>
      
      {/* 사용자 정보 표시 */}
      {user && (
        <div className="user-info">
          <div className="user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
            <div className="auth-source">
              🔐 Google 로그인
            </div>
          </div>
        </div>
      )}
      <nav className="sidebar-nav">
        <div
          onClick={() => setCurrentPage("dashboard")}
          className={`nav-item ${currentPage === "dashboard" ? "active" : ""}`}
        >
          📊 대시보드
        </div>
        <div
          onClick={() => setCurrentPage("journal-list")}
          className={`nav-item ${currentPage === "journal-list" ? "active" : ""}`}
        >
          📝 일지 목록
        </div>
        <div
          onClick={() => setCurrentPage("journal-create")}
          className={`nav-item ${currentPage === "journal-create" ? "active" : ""}`}
        >
          ➕ 일지 작성
        </div>
        <div onClick={handleLogout} className="nav-item logout">
          🚪 로그아웃
        </div>
      </nav>
    </div>
  );

  const renderDashboard = () => {
    const syncStatus = getSyncStatus();
    
    return (
      <div className="main-content">
        <h1 className="page-title">
          대시보드 {user && <span className="welcome-text">- 환영합니다, {user.name}님!</span>}
        </h1>
        
        {journalsError && (
          <div className="error-message" style={{ marginBottom: '16px' }}>
            ❌ {journalsError}
          </div>
        )}
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3 className="card-title primary">총 일지 수</h3>
            <p className="card-value">{stats.totalJournals}</p>
          </div>
          <div className="dashboard-card">
            <h3 className="card-title success">이번 주 작성</h3>
            <p className="card-value">{stats.weeklyJournals}</p>
          </div>
          <div className="dashboard-card">
            <h3 className="card-title warning">동기화 상태</h3>
            <p className="card-status">
              {syncStatus.isOnline ? '온라인' : '오프라인'}
            </p>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              동기화 대기: {stats.pendingJournals}개
            </div>
            <button
              onClick={() => {
                const details = journals
                  .map(
                    (j) =>
                      `${j.title}: 타입=${j.type}, 동기화=${j.syncStatus}, 즐겨찾기=${j.isFavorite}`,
                  )
                  .join("\n");

                alert(
                  `📊 일지 상세 정보:\n\n총 일지: ${stats.totalJournals}개\n이번 주: ${stats.weeklyJournals}개\n동기화된 일지: ${stats.syncedJournals}개\n동기화 대기: ${stats.pendingJournals}개\n\n--- 일지 목록 ---\n${details}`,
                );
              }}
              className="btn btn-secondary"
              style={{ marginTop: "8px", fontSize: "12px" }}
            >
              📊 일지 상태 확인
            </button>
          </div>
          
          <div className="dashboard-card">
            <h3 className="card-title info">동기화된 일지</h3>
            <p className="card-value">{stats.syncedJournals}</p>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              {syncStatus.syncInProgress ? '동기화 중...' : '동기화 완료'}
            </div>
          </div>
        </div>
      </div>

        {/* 웹사이트 동기화 섹션 */}
        <div className="sync-section">
          <WebsiteSync />
        </div>
      </div>
    );
  };

  const renderJournalList = () => (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">일지 목록</h1>
        <button
          onClick={() => setCurrentPage("journal-create")}
          className="btn btn-primary"
        >
          새 일지 작성
        </button>
      </div>

      {journalsLoading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>일지를 불러오는 중...</p>
        </div>
      ) : journals.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">아직 작성된 일지가 없습니다.</p>
          <p className="empty-subtitle">첫 번째 일지를 작성해보세요!</p>
        </div>
      ) : (
        <div className="journals-list">
          {journals.map((journal) => (
            <div key={journal.id} className="journal-item">
              <div className="journal-header">
                <h3 className="journal-title">{journal.title}</h3>
                <div className="journal-meta">
                  <span className="journal-type">{journal.type === 'structured' ? '구조화' : '사진'}</span>
                  <span className="journal-date">
                    {new Date(journal.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`journal-status ${journal.syncStatus}`}>
                    {journal.syncStatus === 'synced' ? '동기화됨' : 
                     journal.syncStatus === 'pending' ? '동기화 대기' : '로컬'}
                  </span>
                </div>
              </div>
              {journal.isFavorite && (
                <div className="journal-favorite">⭐ 즐겨찾기</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 이미지 선택 처리
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log("📁 파일 선택됨:", files?.length || 0, "개");

    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - selectedImages.length); // 최대 5개
    console.log("🖼️ 처리할 이미지:", newImages.length, "개");

    const newImageUrls: string[] = [];

    newImages.forEach((file, index) => {
      console.log(
        `📷 이미지 ${index + 1}:`,
        file.name,
        file.size,
        "bytes",
        file.type,
      );

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImageUrls.push(e.target.result as string);
          console.log(
            `✅ 미리보기 생성 완료 ${newImageUrls.length}/${newImages.length}`,
          );

          if (newImageUrls.length === newImages.length) {
            setImagePreviewUrls((prev) => [...prev, ...newImageUrls]);
            console.log("🎯 모든 미리보기 완료");
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedImages((prev) => {
      const updated = [...prev, ...newImages];
      console.log("💾 선택된 이미지 총 개수:", updated.length);
      return updated;
    });
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Supabase Storage에 이미지 업로드
  const uploadImagesToStorage = async (
    images: File[],
    journalId: string,
  ): Promise<string[]> => {
    console.log("🔄 이미지 업로드 시작:", images.length, "개 파일");

    try {
      console.log("📤 SafeImageUploadService 사용 (보안 강화)");
      const userId = "8236e966-ba4c-46d8-9cda-19bc67ec305d"; // 실제 사용자 ID
      const uploadResults = await SafeImageUploadService.uploadImages(
        images,
        userId,
      );
      const successfulUrls: string[] = [];

      uploadResults.forEach((result, index) => {
        if (result.success && result.url) {
          console.log(`✅ 이미지 ${index + 1} 업로드 성공:`, result.url);
          successfulUrls.push(result.url);
        } else {
          console.error(`❌ 이미지 ${index + 1} 업로드 실패:`, result.error);
        }
      });

      console.log("🎯 업로드 완료:", successfulUrls.length, "개 성공");
      return successfulUrls;
    } catch (error) {
      console.error("❌ 이미지 업로드 서비스 오류:", error);
      return [];
    }
  };

  const handleSaveJournal = async () => {
    if (!journalTitle.trim() || !journalContent.trim()) {
      setSaveMessage({
        type: "error",
        text: "제목과 내용을 모두 입력해주세요.",
      });
      return;
    }

    if (!user?.id) {
      setSaveMessage({
        type: "error",
        text: "사용자 정보를 찾을 수 없습니다.",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      console.log("📝 일지 저장 시작");
      console.log("🖼️ 선택된 이미지 개수:", selectedImages.length);

      // Supabase Storage에 이미지 업로드 (기존 로직 유지)
      const imageUrls =
        selectedImages.length > 0
          ? await uploadImagesToStorage(selectedImages, `journal-${Date.now()}`)
          : [];

      console.log("📤 업로드된 이미지 URL:", imageUrls);

      // 구조화된 일지 콘텐츠 생성
      const journalData = {
        type: 'structured' as const,
        title: journalTitle,
        content: {
          notes: journalContent,
          tasks: [],
          completionRate: 0,
          images: imageUrls
        },
        tags: ['desktop-app']
      };

      // 데이터베이스에 저장
      const savedJournal = await createJournal(journalData);

      if (savedJournal) {
        setSaveMessage({
          type: "success",
          text: "✅ 일지가 저장되었습니다!",
        });

        // 3초 후 대시보드로 이동
        setTimeout(() => {
          // 폼 초기화
          setJournalTitle("");
          setJournalContent("");
          setSelectedImages([]);
          setImagePreviewUrls([]);
          setSaveMessage(null);
          setCurrentPage("dashboard");
        }, 2000);
      } else {
        throw new Error("일지 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("일지 저장 오류:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "일지 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderJournalCreate = () => {
    return (
      <div className="main-content">
        <h1 className="page-title">새 일지 작성</h1>

        <div className="journal-form">
          {/* 저장 메시지 표시 */}
          {saveMessage && (
            <div
              className={`message ${saveMessage.type === "success" ? "message-success" : "message-error"}`}
            >
              {saveMessage.text}
            </div>
          )}

          <div className="journal-type-selector">
            <h3>일지 유형 선택</h3>
            <div className="type-options">
              <div className="type-option selected">
                <h4>📝 구조화된 일지</h4>
                <p>체크리스트와 템플릿을 활용한 일지</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              placeholder="일지 제목을 입력하세요"
              className="form-input"
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label>내용 *</label>
            <textarea
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="오늘의 생각과 경험을 기록해보세요..."
              rows={8}
              className="form-textarea"
              disabled={isSaving}
            />
          </div>

          {/* 이미지 업로드 섹션 */}
          <div className="form-group">
            <label>사진 첨부 (최대 5개)</label>
            <div className="image-upload-section">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={isSaving || selectedImages.length >= 5}
                className="image-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="image-upload-button">
                📷 사진 선택 ({selectedImages.length}/5)
              </label>

              {/* 이미지 미리보기 */}
              {imagePreviewUrls.length > 0 && (
                <div className="image-preview-container">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="image-preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="image-remove-button"
                        disabled={isSaving}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSaving}
              />{" "}
              공개 일지 (커뮤니티에 공유됩니다)
            </label>
          </div>

          <div className="form-actions">
            <button
              onClick={() => setCurrentPage("journal-list")}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              취소
            </button>
            <button
              onClick={handleSaveJournal}
              className="btn btn-success"
              disabled={
                isSaving || !journalTitle.trim() || !journalContent.trim()
              }
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="app-layout">
        {renderSidebar()}
        {renderPage()}
      </div>
    </div>
  );
};

export default App;
