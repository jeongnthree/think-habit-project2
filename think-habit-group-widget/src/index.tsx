import ReactDOM from 'react-dom/client';
import { ThinkHabitWidget } from './components/ThinkHabitWidget';
import './styles/index.css';

// 위젯 초기화 함수
function initThinkHabitWidget(containerId: string, config: any) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(<ThinkHabitWidget config={config} />);
}

// 전역 객체에 위젯 함수 등록
(window as any).ThinkHabitWidget = {
  init: initThinkHabitWidget,
};

// 자동 초기화 (data-think-habit-widget 속성이 있는 요소)
document.addEventListener('DOMContentLoaded', () => {
  const widgets = document.querySelectorAll('[data-think-habit-widget]');
  widgets.forEach(element => {
    const config = JSON.parse(element.getAttribute('data-config') || '{}');
    const root = ReactDOM.createRoot(element as HTMLElement);
    root.render(<ThinkHabitWidget config={config} />);
  });
});
