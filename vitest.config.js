export default {
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    include: ['tests/**/*.test.js', 'backend/tests/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/__legacy__/**'],
  },
};
