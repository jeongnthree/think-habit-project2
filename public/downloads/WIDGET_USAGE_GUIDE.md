# 🎯 Think-Habit 그룹 위젯 사용 가이드

## 📥 설치 방법

### 1. 다운로드한 파일 압축 해제
```bash
# 다운로드한 think-habit-group-widget.zip 압축 해제
# 압축 해제 후 폴더로 이동
cd think-habit-group-widget
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행 (테스트용)
```bash
npm run dev
# http://localhost:5173 에서 위젯 미리보기 가능
```

## 🌐 웹사이트에 위젯 추가하기

### 방법 1: HTML 직접 삽입 (가장 간단)

```html
<!DOCTYPE html>
<html>
<head>
    <title>우리 단체 홈페이지</title>
</head>
<body>
    <h1>우리 단체 Think-Habit 활동</h1>
    
    <!-- 위젯을 표시할 위치 -->
    <div id="think-habit-widget-container" 
         style="width: 100%; max-width: 800px; margin: 0 auto;">
    </div>

    <!-- 위젯 스크립트 (페이지 하단에 추가) -->
    <script>
        // 위젯 설정
        const widgetConfig = {
            groupId: 'your-group-id',     // 단체 ID (Think-Habit에서 발급)
            theme: 'light',               // 테마: light, dark, auto
            height: 600,                  // 높이 (픽셀)
            showLeaderboard: true,        // 순위표 표시
            showRecentActivity: true,     // 활동 피드 표시
            showJournalForm: true,        // 일지 작성 폼 표시
            language: 'ko',               // 언어 설정
            apiEndpoint: 'https://think-habit.com/api'  // API 주소
        };

        // 위젯 로드 및 초기화
        (function() {
            const script = document.createElement('script');
            script.src = 'https://think-habit.com/widget/index.js';
            script.onload = function() {
                ThinkHabitWidget.init('think-habit-widget-container', widgetConfig);
            };
            document.body.appendChild(script);

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://think-habit.com/widget/style.css';
            document.head.appendChild(link);
        })();
    </script>
</body>
</html>
```

### 방법 2: iframe으로 삽입

```html
<!-- iframe으로 위젯 삽입 -->
<iframe 
    src="https://think-habit.com/widget?groupId=your-group-id&theme=light"
    width="100%" 
    height="600"
    frameborder="0"
    style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>
```

### 방법 3: WordPress 사이트에 추가

1. WordPress 관리자 페이지 로그인
2. 외모 > 위젯 또는 페이지 편집기로 이동
3. HTML 블록 추가
4. 위의 HTML 코드 붙여넣기

### 방법 4: 자체 호스팅 (고급)

1. 빌드된 파일 생성:
```bash
npm run build
```

2. `dist` 폴더의 파일들을 웹서버에 업로드

3. 웹사이트에 추가:
```html
<link rel="stylesheet" href="/path/to/your/widget/style.css">
<div id="think-habit-widget"></div>
<script src="/path/to/your/widget/index.js"></script>
<script>
    ThinkHabitWidget.init('think-habit-widget', {
        groupId: 'your-group-id',
        // ... 기타 설정
    });
</script>
```

## ⚙️ 위젯 설정 옵션

### 필수 설정
- `groupId`: Think-Habit에서 발급받은 단체 고유 ID

### 선택 설정
- `theme`: 'light', 'dark', 'auto' (기본값: 'light')
- `height`: 위젯 높이 (기본값: 자동)
- `width`: 위젯 너비 (기본값: 100%)
- `showLeaderboard`: 순위표 표시 여부 (기본값: true)
- `showRecentActivity`: 활동 피드 표시 여부 (기본값: true)
- `showJournalForm`: 일지 작성 폼 표시 여부 (기본값: true)
- `language`: 'ko' 또는 'en' (기본값: 'ko')

## 🎨 스타일 커스터마이징

### CSS로 스타일 변경
```css
/* 위젯 컨테이너 스타일 */
#think-habit-widget-container {
    border: 2px solid #your-color;
    border-radius: 12px;
    padding: 20px;
    background-color: #f9fafb;
}

/* 위젯 색상 변경 */
.think-habit-widget {
    --primary-color: #your-brand-color;
    --success-color: #your-success-color;
    --error-color: #your-error-color;
}
```

## 📱 반응형 디자인

위젯은 자동으로 화면 크기에 맞춰 조정됩니다:
- 데스크톱: 전체 레이아웃
- 태블릿: 2열 레이아웃
- 모바일: 1열 레이아웃

## 🔒 보안 설정

1. **도메인 제한**: Think-Habit 관리 페이지에서 위젯을 사용할 도메인 등록
2. **API 키**: 필요한 경우 API 키 설정
3. **HTTPS 사용**: 보안을 위해 HTTPS 사이트에서만 사용 권장

## ❓ 자주 묻는 질문

**Q: 위젯이 표시되지 않아요**
- A: groupId가 올바른지 확인하세요
- A: 콘솔에서 에러 메시지 확인
- A: 도메인이 Think-Habit에 등록되어 있는지 확인

**Q: 한국어가 표시되지 않아요**
- A: language: 'ko' 설정 확인

**Q: 위젯 크기를 조정하고 싶어요**
- A: height, width 옵션 사용 또는 CSS로 조정

## 📞 지원

- 기술 지원: support@think-habit.com
- 문서: https://docs.think-habit.com/widget
- 커뮤니티: https://community.think-habit.com