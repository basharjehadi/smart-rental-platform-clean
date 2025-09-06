// Script to restore real system date
console.log('🕒 Restoring real system date');
console.log('=============================');

// Remove date override
delete global.Date;

console.log('✅ System date restored to real current date');
console.log('   Current date:', new Date().toISOString().split('T')[0]);
console.log('⚠️  Restart the server for full effect');