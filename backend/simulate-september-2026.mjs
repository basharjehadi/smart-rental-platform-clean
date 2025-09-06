// Script to simulate system date as September 11, 2026
console.log('🕒 Simulating system date as September 11, 2026');
console.log('==============================================');

// Override Date constructor globally
const OriginalDate = global.Date;
const simulatedDate = new Date('2026-09-11T00:00:00.000Z');

global.Date = function(...args) {
  if (args.length === 0) {
    return new OriginalDate(simulatedDate);
  }
  return new OriginalDate(...args);
};

// Copy static methods
Object.setPrototypeOf(global.Date, OriginalDate);
Object.defineProperty(global.Date, 'prototype', {
  value: OriginalDate.prototype,
  writable: false
});

// Override Date.now()
Date.now = () => simulatedDate.getTime();

console.log('✅ System date overridden to September 11, 2026');
console.log('   All new Date() calls will return this date');
console.log('   Current date:', new Date().toISOString().split('T')[0]);
console.log('');
console.log('🎯 Now test the UI - renewal lease should be active!');
console.log('⚠️  Restart the server for full effect');