'use client';

import { DiagnosticTemplateList } from '@/components/diagnosis/DiagnosticTemplateList';
import { DiagnosticTemplate } from '@/types/diagnosis';
import { useRouter } from 'next/navigation';

export default function DiagnosisPage() {
  const router = useRouter();

  const handleSelectTemplate = (template: DiagnosticTemplate) => {
    // 템플릿 선택 시 바로 세션 페이지로 이동 (간단한 해결책)
    const mockSessionId = `session_${Date.now()}`;
    router.push(
      `/diagnosis/session/${mockSessionId}?templateId=${template.id}`
    );
  };

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      <DiagnosticTemplateList
        onSelectTemplate={handleSelectTemplate}
        showStartButton={true}
      />
    </div>
  );
}
