import React from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: 'student' | 'teacher' | 'admin';
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole = 'student' }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={userRole} />
      <main className="flex-1">
        {children}
      </main>
      
      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              © 2024 Think-Habit Lite. 모든 권리 보유.
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">
                도움말
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                개인정보처리방침
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                이용약관
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};