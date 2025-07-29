import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.style.position = 'fixed';
    target.style.top = '0';
    target.style.left = '0';
    target.style.width = 'auto';
    target.style.height = 'auto';
    target.style.overflow = 'visible';
    target.style.zIndex = '9999';
  };

  const handleBlur = (e: React.FocusEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.style.position = 'absolute';
    target.style.left = '-9999px';
    target.style.top = 'auto';
    target.style.width = '1px';
    target.style.height = '1px';
    target.style.overflow = 'hidden';
  };

  return (
    <a
      href={href}
      className='sr-only focus:not-sr-only bg-blue-600 text-white p-2 rounded-md'
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </a>
  );
};

export default SkipLink;
