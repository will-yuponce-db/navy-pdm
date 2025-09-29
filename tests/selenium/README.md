# Selenium E2E Tests

This directory contains end-to-end tests using Selenium WebDriver for the Navy PDM application.

## Test Structure

- `base-test.ts` - Base test class with common utilities and helper methods
- `home-page.test.ts` - Tests for the home page functionality
- `work-order.test.ts` - Tests for work order management
- `parts.test.ts` - Tests for parts management
- `test-runner.ts` - Main test runner that executes all tests

## Configuration

Tests are configured through `selenium.config.ts` in the project root. Key configuration options:

- `baseUrl` - Application URL (default: http://localhost:3000)
- `browser` - Browser to use (chrome, firefox, safari)
- `headless` - Run in headless mode
- `windowSize` - Browser window dimensions
- `timeout` - Default timeout values

## Environment Variables

- `HEADLESS` - Set to `true` to run in headless mode
- `BROWSER` - Browser to use (chrome, firefox, safari)
- `BASE_URL` - Application base URL
- `CI` - Set to `true` in CI environments

## Running Tests

### All Tests
```bash
npm run test:selenium
```

### Individual Test Suites
```bash
npm run test:selenium:home
npm run test:selenium:workorder
npm run test:selenium:parts
```

### With Custom Configuration
```bash
HEADLESS=true BROWSER=firefox npm run test:selenium
```

## Test Features

### Base Test Class Features
- Automatic driver initialization and cleanup
- Common element interaction methods
- Screenshot capture on failures
- Wait utilities for elements and conditions
- Page navigation helpers
- Responsive design testing support

### Test Coverage
- **Home Page**: Navigation, responsive design, performance
- **Work Orders**: CRUD operations, table functionality, filtering
- **Parts**: Inventory management, search, modal interactions

### Screenshots
Screenshots are automatically captured:
- On test failures
- At key test milestones
- For responsive design testing
- Stored in `test-results/screenshots/`

## CI/CD Integration

Tests are integrated into GitHub Actions workflows:

- **CI/CD Pipeline** (`ci-cd.yml`) - Runs on every push/PR
- **Selenium Tests** (`selenium-tests.yml`) - Dedicated Selenium test workflow
- **Nightly Tests** (`nightly-tests.yml`) - Comprehensive nightly testing

### Workflow Features
- Multi-browser testing (Chrome, Firefox)
- Cross-platform testing (Ubuntu, Windows, macOS)
- Responsive design testing
- Performance testing
- Accessibility testing
- Load testing simulation

## Best Practices

1. **Use Data Test IDs**: Prefer `data-testid` attributes for reliable element selection
2. **Wait for Elements**: Always wait for elements to be present and visible
3. **Take Screenshots**: Capture screenshots at key points for debugging
4. **Handle Async Operations**: Use proper waits for page loads and AJAX calls
5. **Clean Up**: Ensure proper driver cleanup in test teardown
6. **Error Handling**: Implement robust error handling and reporting

## Troubleshooting

### Common Issues
1. **Element Not Found**: Check if element exists and is visible
2. **Timeout Errors**: Increase timeout values or check for slow loading
3. **Browser Crashes**: Ensure proper driver cleanup and resource management
4. **CI Failures**: Check browser installation and headless mode configuration

### Debug Mode
Run tests with debug output:
```bash
DEBUG=selenium* npm run test:selenium
```

### Local Development
1. Start the application: `npm start`
2. Run tests: `npm run test:selenium:home`
3. Check screenshots in `test-results/screenshots/`

## Adding New Tests

1. Create a new test file in `tests/selenium/`
2. Extend `BaseSeleniumTest` class
3. Implement test methods with descriptive names
4. Add test runner function
5. Update `test-runner.ts` to include new tests
6. Add npm script in `package.json`

Example:
```typescript
import { BaseSeleniumTest } from './base-test';

class NewFeatureTest extends BaseSeleniumTest {
  async testNewFeature(): Promise<void> {
    await this.navigateTo('/new-feature');
    // Test implementation
  }
}

export async function runNewFeatureTests(): Promise<void> {
  const test = new NewFeatureTest();
  // Test runner implementation
}
```
