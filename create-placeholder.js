const fs = require('fs');
const path = require('path');

// 간단한 회색 placeholder 이미지 (1x1 투명 PNG)
const placeholderImageData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// 더 큰 placeholder 이미지 (200x150 회색)
const placeholderImageLarge = Buffer.from(`
  /9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
`.replace(/\s/g, ''), 'base64');

// 실제 placeholder 이미지 생성 (SVG)
const svgPlaceholder = `
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <rect x="50%" y="50%" width="2" height="2" fill="#999" transform="translate(-1,-1)"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="14" fill="#999">이미지 없음</text>
</svg>
`;

const imagePath = path.join(__dirname, 'public', 'images', 'placeholder-image.png');
const svgPath = path.join(__dirname, 'public', 'images', 'placeholder-image.svg');

// PNG 이미지 생성 (간단한 1x1 투명)
fs.writeFileSync(imagePath, placeholderImageData);

// SVG 이미지도 생성
fs.writeFileSync(svgPath, svgPlaceholder);

console.log('✅ Placeholder 이미지가 생성되었습니다:');
console.log('- PNG:', imagePath);
console.log('- SVG:', svgPath);