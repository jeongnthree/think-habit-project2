import React, { useState } from 'react';
import { Journal, JournalFormData } from '../types';
import { getMoodColor, getMoodEmoji } from '../utils';

interface JournalFormProps {
  theme: 'light' | 'dark';
  onSubmit: (data: JournalFormData) => Promise<void>;
  loading?: boolean;
}

export const JournalForm: React.FC<JournalFormProps> = ({
  theme,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    category: '감정 관리',
    mood: 'neutral',
    tags: [],
    isPublic: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    '감정 관리',
    '감사 일기',
    '목표 설정',
    '자기 성찰',
    '스트레스 관리',
    '인간관계',
    '성장 기록',
    '기타',
  ];

  const moods: Array<{ value: Journal['mood']; label: string }> = [
    { value: 'very-bad', label: '매우 나쁨' },
    { value: 'bad', label: '나쁨' },
    { value: 'neutral', label: '보통' },
    { value: 'good', label: '좋음' },
    { value: 'very-good', label: '매우 좋음' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      await onSubmit(formData);

      // 폼 초기화
      setFormData({
        title: '',
        content: '',
        category: '감정 관리',
        mood: 'neutral',
        tags: [],
        isPublic: true,
      });
      setTagInput('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to submit journal:', error);
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const isFormValid = formData.title.trim() && formData.content.trim();

  return (
    <div className='journal-form-section'>
      <div className='section-header'>
        <h4>✍️ 일지 작성</h4>
        <button
          type='button'
          className='expand-btn'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      <div
        className={`form-container ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <form onSubmit={handleSubmit} className='journal-form'>
          <div className='form-group'>
            <input
              type='text'
              placeholder='일지 제목을 입력하세요...'
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              className='title-input'
              maxLength={100}
              disabled={loading}
            />
          </div>

          {isExpanded && (
            <>
              <div className='form-row'>
                <div className='form-group'>
                  <label>카테고리</label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className='category-select'
                    disabled={loading}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>기분</label>
                  <div className='mood-selector'>
                    {moods.map(mood => (
                      <button
                        key={mood.value}
                        type='button'
                        className={`mood-btn ${formData.mood === mood.value ? 'active' : ''}`}
                        onClick={() =>
                          setFormData(prev => ({ ...prev, mood: mood.value }))
                        }
                        title={mood.label}
                        disabled={loading}
                        style={{
                          backgroundColor:
                            formData.mood === mood.value
                              ? getMoodColor(mood.value)
                              : 'transparent',
                        }}
                      >
                        {getMoodEmoji(mood.value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className='form-group'>
                <label>태그</label>
                <div className='tags-container'>
                  <div className='tags-list'>
                    {formData.tags.map(tag => (
                      <span key={tag} className='tag'>
                        #{tag}
                        <button
                          type='button'
                          onClick={() => handleTagRemove(tag)}
                          className='tag-remove'
                          disabled={loading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type='text'
                    placeholder='태그 입력 후 Enter'
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                    className='tag-input'
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <div className='form-group'>
            <textarea
              placeholder='오늘의 생각과 감정을 자유롭게 적어보세요...'
              value={formData.content}
              onChange={e =>
                setFormData(prev => ({ ...prev, content: e.target.value }))
              }
              className='content-textarea'
              rows={isExpanded ? 4 : 3}
              maxLength={1000}
              disabled={loading}
            />
            <div className='char-count'>{formData.content.length}/1000</div>
          </div>

          <div className='form-footer'>
            <label className='privacy-toggle'>
              <input
                type='checkbox'
                checked={formData.isPublic}
                onChange={e =>
                  setFormData(prev => ({ ...prev, isPublic: e.target.checked }))
                }
                disabled={loading}
              />
              <span className='checkmark'></span>
              공개 일지로 작성
            </label>

            <button
              type='submit'
              className='submit-btn'
              disabled={!isFormValid || loading}
            >
              {loading ? '작성 중...' : '일지 작성'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .journal-form-section {
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
        }

        .expand-btn {
          background: none;
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expand-btn:hover {
          background: ${theme === 'dark' ? '#4a5568' : '#f7fafc'};
        }

        .form-container {
          background: ${theme === 'dark' ? '#2d3748' : '#ffffff'};
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .form-container.collapsed {
          max-height: 200px;
        }

        .form-container.expanded {
          max-height: 600px;
        }

        .journal-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: ${theme === 'dark' ? '#a0aec0' : '#4a5568'};
        }

        .title-input,
        .category-select,
        .tag-input {
          padding: 8px 12px;
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 6px;
          background: ${theme === 'dark' ? '#1a202c' : '#ffffff'};
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
          font-size: 13px;
          transition: border-color 0.2s ease;
        }

        .title-input:focus,
        .category-select:focus,
        .tag-input:focus,
        .content-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .mood-selector {
          display: flex;
          gap: 4px;
        }

        .mood-btn {
          width: 32px;
          height: 32px;
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mood-btn:hover {
          transform: scale(1.1);
        }

        .mood-btn.active {
          border-color: transparent;
          color: white;
        }

        .tags-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 11px;
        }

        .tag-remove {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          margin-left: 2px;
        }

        .content-textarea {
          padding: 12px;
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 6px;
          background: ${theme === 'dark' ? '#1a202c' : '#ffffff'};
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.2s ease;
        }

        .char-count {
          align-self: flex-end;
          font-size: 11px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .privacy-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: ${theme === 'dark' ? '#a0aec0' : '#4a5568'};
          cursor: pointer;
        }

        .privacy-toggle input[type='checkbox'] {
          display: none;
        }

        .checkmark {
          width: 16px;
          height: 16px;
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 3px;
          position: relative;
          transition: all 0.2s ease;
        }

        .privacy-toggle input:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .privacy-toggle input:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 2px;
          color: white;
          font-size: 12px;
        }

        .submit-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          background: ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          color: ${theme === 'dark' ? '#a0aec0' : '#a0adb8'};
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};
