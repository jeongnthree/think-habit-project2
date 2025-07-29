import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
        {/* 오버레이 */}
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={closeOnOverlayClick ? onClose : undefined}
        />

        {/* 모달 컨테이너 */}
        <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>
          &#8203;
        </span>

        {/* 모달 콘텐츠 */}
        <div
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 w-full ${sizeClasses[size]}`}
        >
          {/* 헤더 */}
          {(title || showCloseButton) && (
            <div className='flex justify-between items-center mb-4'>
              {title && (
                <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className='text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* 콘텐츠 */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

// 확인 모달
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  type = 'info',
}) => {
  const typeStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='md' showCloseButton={false}>
      <div className='text-center'>
        <div
          className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4`}
        >
          <span className='text-2xl'>{styles.icon}</span>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>{title}</h3>
        <div className='text-left mb-6'>
          {typeof message === 'string' ? (
            <p className='text-sm text-gray-500 text-center'>{message}</p>
          ) : (
            message
          )}
        </div>
        <div className='flex space-x-3 justify-center'>
          <Button
            onClick={onClose}
            variant='outline'
            className='flex-1 sm:flex-none'
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 sm:flex-none text-white ${styles.confirmButton}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
