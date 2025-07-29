// Script to create a test image for e2e tests
const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel JPEG image (base64 encoded)
const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';

const testImageBuffer = Buffer.from(testImageBase64, 'base64');
const testImagePath = path.join(__dirname, 'test-image.jpg');

fs.writeFileSync(testImagePath, testImageBuffer);
console.log('Test image created at:', testImagePath);