# 🎯 Think-Habit Group Widget

Think-Habit 그룹 활동을 위한 임베드 가능한 React 위젯입니다. 일지 작성, 순위표, 활동 피드, 격려 시스템 등의 기능을 제공합니다.

## ✨ 주요 기능

- 📊 **실시간 그룹 통계** - 참가자 수, 진행률, 활동 현황
- 🏆 **순위표** - 점수 기반 참가자 순위 및 연속 기록
- 📝 **일지 작성** - 카테고리별 구조화된 일지 작성 폼
- 💬 **격려 시스템** - 동료 간 격려 메시지 전송
- 📋 **활동 피드** - 최근 그룹 활동 실시간 업데이트
- 🎨 **테마 지원** - 라이트/다크/자동 테마
- 📱 **반응형 디자인** - 모바일 및 데스크톱 최적화
- 🔧 **커스터마이징** - 다양한 설정 옵션 및 스타일 커스터마이징

## 🚀 빠른 시작

### CDN을 통한 사용

```html
<!-- CSS 로드 -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/think-habit-group-widget@latest/dist/style.css"
/>

<!-- 위젯 컨테이너 -->
<div
  data-think-habit-widget
  data-config='{
  "groupId": "your-group-id",
  "theme": "light",
  "height": 500,
  "showLeaderboard": true,
  "showRecentActivity": true,
  "showJournalForm": true
}'
></div>

<!-- JavaScript 로드 -->
<script src="https://cdn.jsdelivr.net/npm/think-habit-group-widget@latest/dist/index.umd.js"></script>
```

### NPM을 통한 설치

```bash
npm install think-habit-group-widget
```

```jsx
import { ThinkHabitWidget } from 'think-habit-group-widget';
import 'think-habit-group-widget/dist/style.css';

function App() {
  return (
    <ThinkHabitWidget
      config={{
        groupId: 'your-group-id',
        theme: 'light',
        height: 500,
        showLeaderboard: true,
        showRecentActivity: true,
        showJournalForm: true,
        apiEndpoint: 'https://your-api.com/api',
      }}
    />
  );
}
```

### JavaScript로 동적 생성

```javascript
ThinkHabitWidget.init('widget-container', {
  groupId: 'your-group-id',
  theme: 'dark',
  height: 600,
  showLeaderboard: true,
  showRecentActivity: true,
  showJournalForm: true,
  enableNotifications: true,
  refreshInterval: 30,
  onEvent: event => {
    console.log('Widget event:', event);
  },
});
```

## ⚙️ 설정 옵션

| 옵션                  | 타입                        | 기본값  | 설명                                |
| --------------------- | --------------------------- | ------- | ----------------------------------- |
| `groupId`             | string                      | -       | 그룹 ID (필수)                      |
| `theme`               | 'light' \| 'dark' \| 'auto' | 'light' | 테마 설정                           |
| `height`              | number                      | -       | 위젯 높이 (px)                      |
| `width`               | number                      | -       | 위젯 너비 (px)                      |
| `showLeaderboard`     | boolean                     | true    | 순위표 표시 여부                    |
| `showRecentActivity`  | boolean                     | true    | 활동 피드 표시 여부                 |
| `showJournalForm`     | boolean                     | true    | 일지 작성 폼 표시 여부              |
| `showStats`           | boolean                     | true    | 통계 표시 여부                      |
| `showProgress`        | boolean                     | true    | 진행률 표시 여부                    |
| `showEncouragement`   | boolean                     | true    | 격려 시스템 표시 여부               |
| `maxParticipants`     | number                      | 10      | 순위표 최대 표시 인원               |
| `refreshInterval`     | number                      | 0       | 자동 새로고침 간격 (초, 0=비활성화) |
| `enableNotifications` | boolean                     | true    | 알림 활성화 여부                    |
| `enableRealtime`      | boolean                     | false   | 실시간 업데이트 활성화              |
| `apiEndpoint`         | string                      | -       | API 엔드포인트 URL                  |
| `language`            | 'ko' \| 'en'                | 'ko'    | 언어 설정                           |
| `customStyles`        | object                      | -       | 커스텀 CSS 스타일                   |
| `onEvent`             | function                    | -       | 이벤트 핸들러                       |

## 📡 이벤트

위젯에서 발생하는 다양한 이벤트를 처리할 수 있습니다:

```javascript
const config = {
  // ... 기타 설정
  onEvent: event => {
    switch (event.type) {
      case 'journal_submitted':
        console.log('새 일지 작성:', event.data);
        break;
      case 'encouragement_sent':
        console.log('격려 메시지 전송:', event.data);
        break;
      case 'data_refreshed':
        console.log('데이터 새로고침:', event.data);
        break;
      case 'error_occurred':
        console.error('오류 발생:', event.data.error);
        break;
      case 'user_joined':
        console.log('새 사용자 참여:', event.data);
        break;
    }
  },
};
```

## 🎨 테마 커스터마이징

### CSS 변수를 통한 커스터마이징

```css
.think-habit-widget {
  --primary-color: #your-color;
  --success-color: #your-success-color;
  --error-color: #your-error-color;
  --border-radius: 12px;
}
```

### 인라인 스타일 커스터마이징

```javascript
const config = {
  customStyles: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
};
```

## 🔌 API 연동

위젯은 다음 API 엔드포인트를 사용합니다:

### 그룹 데이터 조회

```
GET /groups/{groupId}/stats
```

### 일지 제출

```
POST /groups/{groupId}/journals
Content-Type: application/json

{
  "title": "일지 제목",
  "content": "일지 내용",
  "category": "감정 관리",
  "mood": "good",
  "tags": ["성장", "감사"],
  "isPublic": true
}
```

### 격려 메시지 전송

```
POST /groups/{groupId}/encouragements
Content-Type: application/json

{
  "toUserId": "target-user-id",
  "message": "격려 메시지",
  "type": "encouragement"
}
```

## 📱 반응형 디자인

위젯은 다양한 화면 크기에 자동으로 적응합니다:

- **데스크톱**: 전체 기능 표시
- **태블릿**: 적응형 레이아웃
- **모바일**: 컴팩트 모드, 터치 최적화

## ♿ 접근성

- 키보드 네비게이션 지원
- 스크린 리더 호환
- 고대비 모드 지원
- 애니메이션 감소 옵션 지원

## 🛠️ 개발

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/think-habit/group-widget.git
cd group-widget

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 라이브러리 빌드
npm run build:lib
```

### 테스트

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:coverage

# 테스트 UI
npm run test:ui
```

### Storybook

```bash
# Storybook 시작
npm run storybook

# Storybook 빌드
npm run build-storybook
```

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

- 📧 이메일: support@think-habit.com
- 🐛 버그 리포트: [GitHub Issues](https://github.com/think-habit/group-widget/issues)
- 📖 문서: [위키](https://github.com/think-habit/group-widget/wiki)

## 🔄 변경 로그

### v1.0.0

- 초기 릴리스
- 기본 위젯 기능 구현
- 테마 지원
- 반응형 디자인
- API 연동

---

Made with ❤️ by Think-Habit Team
