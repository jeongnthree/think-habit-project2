'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * OAuth 콜백 페이지 (클라이언트 사이드)
 * URL fragment에서 access_token을 처리하기 위함
 */
export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 클라이언트 사이드 OAuth 콜백 처리 시작');
        console.log('💡 콜백 페이지가 마운트됨 - 이 로그가 보이면 콜백 페이지에 도달함');
        
        // URL에서 파라미터와 fragment 모두 확인
        const currentUrl = window.location.href;
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const redirectTo = searchParams.get('redirectTo') || '/dashboard';
        
        console.log('전체 URL:', currentUrl);
        console.log('Hash params:', Array.from(hashParams.entries()));
        console.log('Search params:', Array.from(searchParams.entries()));

        // Fragment에서 access_token 확인 (implicit flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('🔍 토큰 확인:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          hashParamsSize: hashParams.size,
          searchParamsSize: searchParams.size,
          hashContent: window.location.hash,
          allHashParams: Array.from(hashParams.entries())
        });
        
        if (accessToken) {
          console.log('✅ Fragment에서 access_token 발견, 세션 설정 중...');
          
          try {
            // 토큰을 사용해 세션 설정 (타임아웃 추가)
            console.log('📞 setSession 호출 시작...');
            
            const setSessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('setSession timeout')), 5000)
            );
            
            const { data, error: sessionError } = await Promise.race([
              setSessionPromise,
              timeoutPromise
            ]) as any;
            
            console.log('📞 setSession 호출 완료:', { success: !sessionError, hasUser: !!data?.user });

            if (sessionError) {
              if (sessionError.message === 'setSession timeout') {
                console.log('⏰ setSession 타임아웃 발생, 세션 확인으로 우회');
                // 타임아웃 발생 시 현재 세션 확인
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (currentSession) {
                  console.log('✅ 현재 세션 확인됨, 리디렉션 진행');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  router.push(redirectTo);
                  return;
                }
              }
              console.error('❌ 세션 설정 실패:', sessionError);
              setError('인증 처리 중 오류가 발생했습니다.');
              return;
            }

            if (data.user) {
              console.log('✅ 사용자 인증 성공:', data.user.email);
              console.log('👤 사용자 데이터:', data.user);
            
              // 임시로 사용자 프로필 처리 건너뛰기 (로그인 성공 우선)
              console.log('⚠️ 사용자 프로필 처리 건너뛰고 바로 리디렉션');

              console.log('🚀 리디렉션 준비:', redirectTo);
              
              // 세션 확인
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              console.log('🔍 현재 세션 상태:', !!currentSession);
              
              // URL hash 제거하고 리디렉션
              window.history.replaceState({}, document.title, window.location.pathname);
              
              console.log('🔄 리디렉션 실행 중...');
              
              // 세션이 있을 때만 리디렉션
              if (currentSession) {
                router.push(redirectTo);
              } else {
                console.log('❌ 세션이 없어서 리디렉션 취소');
                setError('세션 생성에 실패했습니다.');
              }
              return;
            }
          } catch (authErr) {
            console.error('❌ 인증 처리 중 예외 발생:', authErr);
            
            // setSession 타임아웃인 경우 세션 확인으로 우회
            if (authErr instanceof Error && authErr.message === 'setSession timeout') {
              console.log('⏰ setSession 타임아웃 발생, 세션 확인으로 우회');
              
              try {
                // getSession도 타임아웃 처리
                const getSessionPromise = supabase.auth.getSession();
                const sessionTimeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('getSession timeout')), 3000)
                );
                
                const { data: { session: currentSession } } = await Promise.race([
                  getSessionPromise,
                  sessionTimeoutPromise
                ]) as any;
                
                console.log('🔍 현재 세션 확인:', !!currentSession);
                
                if (currentSession) {
                  console.log('✅ 현재 세션 확인됨, 리디렉션 진행');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  router.push(redirectTo);
                  return;
                } else {
                  console.log('❌ 세션이 없음, 강제 리디렉션');
                }
              } catch (sessionCheckErr) {
                console.error('❌ 세션 확인 중 오류:', sessionCheckErr);
                console.log('⚠️ 세션 확인 실패, Auth 상태 기반 강제 리디렉션');
              }
              
              // Auth state가 SIGNED_IN이므로 강제 리디렉션
              console.log('🚀 Auth 상태 기반 강제 리디렉션 시도');
              setTimeout(() => {
                console.log('⏰ 3초 후 강제 리디렉션 실행');
                window.history.replaceState({}, document.title, window.location.pathname);
                router.push(redirectTo);
              }, 3000);
              
              return; // 에러 표시하지 않고 리턴
            }
            
            setError('인증 처리 중 오류가 발생했습니다.');
            return;
          }
        }

        // access_token이 없을 경우 처리
        if (!accessToken) {
          console.log('❌ Fragment에 access_token이 없음');
          console.log('🔍 URL 전체 분석:', {
            href: window.location.href,
            hash: window.location.hash, 
            search: window.location.search,
            pathname: window.location.pathname
          });
          
          // 잠시 대기 후 다시 확인 (DOM 업데이트 대기)
          setTimeout(() => {
            console.log('⏰ 1초 후 재확인:', {
              hash: window.location.hash,
              hasToken: window.location.hash.includes('access_token')
            });
            
            if (window.location.hash.includes('access_token')) {
              console.log('🔄 토큰 발견됨, 페이지 새로고침');
              window.location.reload();
            } else {
              console.log('❌ 여전히 토큰 없음, 로그인 페이지로 이동');
              setError('인증 토큰을 받지 못했습니다.');
            }
          }, 1000);
        }

        // 기존 authorization code flow는 더 이상 사용하지 않음
        console.log('❌ Fragment와 Authorization code flow 모두 실패');
        setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');

      } catch (err) {
        console.error('❌ OAuth 콜백 처리 중 예외:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">로그인 완료, 리디렉션 중...</p>
      </div>
    </div>
  );
}