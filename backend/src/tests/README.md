# Review System Integration Tests

This directory contains comprehensive integration tests for the Smart Rental System's review functionality.

## Test Structure

### `integration/review-system-simple.test.js`

A simplified integration test suite that uses mocks to test the core review system functionality without requiring a full database setup.

### `integration/review-system.test.js`

A full integration test suite that requires a test database and tests the complete review system end-to-end.

## Test Scenarios Covered

### 1. Both sides submit → instant publish

- **Test**: `should publish reviews immediately when both sides submit`
- **Description**: Verifies that when both tenant and landlord submit reviews for the same lease, they are published immediately instead of waiting for the 14-day timer.

### 2. One side submits → auto publish at +14d

- **Test**: `should auto-publish single review after 14 days`
- **Test**: `should not publish review before 14 days`
- **Description**: Ensures that single reviews are automatically published after 14 days, but not before.

### 3. MOVE_IN visible but not counted in aggregates

- **Test**: `should make MOVE_IN reviews visible but exclude from aggregates`
- **Description**: Verifies that MOVE_IN stage reviews are visible to users but don't count toward user rating calculations and aggregates.

### 4. <3 reviews → "New" badge

- **Test**: `should show "New" badge for users with less than 3 reviews`
- **Test**: `should show "New" badge for users with no reviews`
- **Description**: Confirms that users with fewer than 3 reviews display a "New — verified, no reviews yet" badge instead of a rating.

### 5. Content moderation blocks PII

- **Test**: `should block reviews containing PII`
- **Test**: `should allow reviews without PII`
- **Test**: `should strip PII from reviews before submission`
- **Description**: Tests the content moderation service's ability to detect and handle personal identifiable information (PII) in review text.

### 6. Trust levels resolve correctly

- **Test**: `should calculate correct trust levels based on review data`
- **Test**: `should handle new users with no reviews`
- **Test**: `should handle users with many positive reviews`
- **Description**: Verifies that the trust level service correctly calculates user trust levels based on review count, average rating, and other factors.

### 7. Badge calculation and assignment

- **Test**: `should calculate and assign badges correctly`
- **Description**: Tests the badge system's ability to calculate and assign badges based on user behavior and review data.

### 8. End-to-end review flow

- **Test**: `should handle complete review lifecycle`
- **Description**: Tests the complete review lifecycle from creation to publication to aggregation updates.

## Running the Tests

### Prerequisites

- Node.js 18+ installed
- All dependencies installed (`npm install`)
- Test database configured (for full integration tests)

### Quick Tests (Mocked)

```bash
# Run simplified integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode
npm run test:integration -- --watch
```

### Full Integration Tests

```bash
# Run full integration tests (requires test database)
npm run test tests/integration/review-system.test.js

# Run with verbose output
npm run test tests/integration/review-system.test.js -- --verbose
```

### All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only (excludes integration tests)
npm run test:unit
```

## Test Configuration

The tests use Jest as the testing framework with the following configuration:

- **Test Environment**: Node.js
- **Timeout**: 30 seconds for integration tests
- **Coverage**: HTML, text, and LCOV reports
- **Setup**: `tests/setup.js` for global test configuration
- **Mocking**: Comprehensive mocking of external dependencies

## Mock Strategy

The simplified integration tests use mocks to:

1. **Prisma Client**: Mock database operations without requiring a real database
2. **External Services**: Mock service calls to focus on business logic
3. **Time-based Logic**: Mock date/time operations for predictable testing
4. **File System**: Mock file operations and uploads

## Adding New Tests

When adding new test scenarios:

1. **Follow the existing pattern**: Use descriptive test names and group related tests
2. **Mock external dependencies**: Don't test external services, focus on business logic
3. **Test edge cases**: Include both positive and negative test scenarios
4. **Use realistic data**: Create test data that represents real-world scenarios
5. **Clean up after tests**: Ensure tests don't leave side effects

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all service imports use the correct paths
2. **Mock Failures**: Check that mocks are properly configured and reset between tests
3. **Timeout Issues**: Increase test timeout for complex integration tests
4. **Database Connection**: Verify test database configuration for full integration tests

### Debug Mode

Run tests with additional debugging:

```bash
# Enable Jest debugging
DEBUG=* npm run test:integration

# Run single test file with verbose output
npm run test tests/integration/review-system-simple.test.js -- --verbose --no-coverage
```

## Coverage Reports

After running tests with coverage, view the HTML report:

```bash
# Open coverage report in browser
open coverage/lcov-report/index.html
```

The coverage report shows:

- Line coverage for all source files
- Branch coverage for conditional logic
- Function coverage for service methods
- Uncovered code highlighting
