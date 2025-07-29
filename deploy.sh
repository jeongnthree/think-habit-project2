#!/bin/bash

# Think-Habit Project 자동 배포 스크립트
# Usage: ./deploy.sh

set -e  # 에러 발생시 스크립트 중단

echo "🚀 Think-Habit Project 배포 시작..."

# 1. 환경 체크
echo "📋 환경 체크 중..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되지 않았습니다."
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. 타입 체크
echo "🔍 TypeScript 타입 체크 중..."
npm run type-check

# 4. 린트 체크
echo "🔍 ESLint 체크 중..."
npm run lint

# 5. 빌드 테스트
echo "🏗️ 프로덕션 빌드 테스트 중..."
npm run build

# 6. Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI 설치 중..."
    npm install -g vercel
fi

# 7. 환경 변수 체크
echo "🔐 환경 변수 체크 중..."
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local 파일이 없습니다."
    echo "📝 .env.example을 참고하여 .env.local을 생성하세요."
    echo "또는 Vercel Dashboard에서 환경 변수를 설정하세요."
fi

# 8. 배포 실행
echo "🚀 Vercel에 배포 중..."
echo "📝 배포 중에 프로젝트 설정을 묻는다면:"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo "   - Install Command: npm install"
echo ""

# 사용자에게 배포 타입 선택 요청
echo "배포 타입을 선택하세요:"
echo "1) 개발용 배포 (미리보기)"
echo "2) 프로덕션 배포"
read -p "선택 (1 또는 2): " choice

case $choice in
    1)
        echo "🔧 개발용 배포 시작..."
        vercel
        ;;
    2)
        echo "🌟 프로덕션 배포 시작..."
        vercel --prod
        ;;
    *)
        echo "❌ 잘못된 선택입니다. 1 또는 2를 선택하세요."
        exit 1
        ;;
esac

echo ""
echo "🎉 배포 완료!"
echo "📱 배포된 사이트를 확인하세요."
echo "🔧 문제가 있다면 BUILD_INSTRUCTIONS.md를 참고하세요."