import React, { useState } from 'react';
import { EncouragementMessage, Participant } from '../types';

interface EncouragementPanelProps {
  participants: Participant[];
  onSendEncouragement: (data: Partial<EncouragementMessage>) => void;
}

export const EncouragementPanel: React.FC<EncouragementPanelProps> = ({
  participants,
  onSendEncouragement,
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<
    'encouragement' | 'congratulation' | 'support'
  >('encouragement');

  const predefinedMessages = {
    encouragement: [
      '오늘도 화이팅! 💪',
      '꾸준히 하고 계시네요! 👏',
      '좋은 습관 만들어가고 있어요! ✨',
      '계속 이런 식으로 해보세요! 🌟',
    ],
    congratulation: [
      '축하합니다! 🎉',
      '정말 대단해요! 👏',
      '멋진 성과네요! 🏆',
      '훌륭한 결과입니다! ⭐',
    ],
    support: [
      '힘내세요! 함께 해요! 🤝',
      '어려울 때 서로 도와요! 💝',
      '포기하지 마세요! 🌈',
      '언제든 응원하고 있어요! 🙌',
    ],
  };

  const handleSendMessage = () => {
    if (!selectedUser || !message.trim()) return;

    onSendEncouragement({
      toUserId: selectedUser,
      message: message.trim(),
      type: messageType,
    });

    setMessage('');
    setSelectedUser('');
  };

  const handlePredefinedMessage = (predefinedMsg: string) => {
    setMessage(predefinedMsg);
  };

  return (
    <div className='encouragement-panel'>
      <h3>동료 격려하기</h3>

      {/* 사용자 선택 */}
      <div className='user-selection'>
        <label htmlFor='user-select'>격려할 동료:</label>
        <select
          id='user-select'
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          className='user-select'
        >
          <option value=''>동료를 선택하세요</option>
          {participants.map(participant => (
            <option key={participant.id} value={participant.id}>
              {participant.name} (순위: {participant.rank}위)
            </option>
          ))}
        </select>
      </div>

      {/* 메시지 타입 선택 */}
      <div className='message-type-selection'>
        <label>메시지 유형:</label>
        <div className='type-buttons'>
          <button
            className={`type-button ${messageType === 'encouragement' ? 'active' : ''}`}
            onClick={() => setMessageType('encouragement')}
          >
            격려 💪
          </button>
          <button
            className={`type-button ${messageType === 'congratulation' ? 'active' : ''}`}
            onClick={() => setMessageType('congratulation')}
          >
            축하 🎉
          </button>
          <button
            className={`type-button ${messageType === 'support' ? 'active' : ''}`}
            onClick={() => setMessageType('support')}
          >
            응원 🤝
          </button>
        </div>
      </div>

      {/* 미리 정의된 메시지 */}
      <div className='predefined-messages'>
        <label>빠른 메시지:</label>
        <div className='message-buttons'>
          {predefinedMessages[messageType].map((msg, index) => (
            <button
              key={index}
              className='predefined-message-button'
              onClick={() => handlePredefinedMessage(msg)}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 입력 */}
      <div className='message-input'>
        <label htmlFor='message-textarea'>메시지:</label>
        <textarea
          id='message-textarea'
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder='격려 메시지를 입력하세요...'
          className='message-textarea'
          rows={3}
          maxLength={200}
        />
        <div className='character-count'>{message.length}/200</div>
      </div>

      {/* 전송 버튼 */}
      <button
        onClick={handleSendMessage}
        disabled={!selectedUser || !message.trim()}
        className='send-button'
      >
        격려 메시지 보내기 💌
      </button>

      {/* 최근 격려 활동 */}
      <div className='recent-encouragements'>
        <h4>최근 격려 활동</h4>
        <div className='encouragement-feed'>
          {/* 실제 구현에서는 최근 격려 메시지들을 표시 */}
          <div className='encouragement-item'>
            <span className='encouragement-from'>김철수</span>
            <span className='encouragement-arrow'>→</span>
            <span className='encouragement-to'>이영희</span>
            <span className='encouragement-message'>"오늘도 화이팅! 💪"</span>
            <span className='encouragement-time'>5분 전</span>
          </div>
        </div>
      </div>
    </div>
  );
};
