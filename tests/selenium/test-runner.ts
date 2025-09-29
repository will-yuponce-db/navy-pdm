import { runHomePageTests } from './home-page.test';
import { runWorkOrderTests } from './work-order.test';
import { runPartsTests } from './parts.test';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class SeleniumTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Selenium Test Suite...\n');
    
    const tests = [
      { name: 'Home Page Tests', fn: runHomePageTests },
      { name: 'Work Order Tests', fn: runWorkOrderTests },
      { name: 'Parts Tests', fn: runPartsTests }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    this.printSummary();
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`\n📋 Running ${name}...`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMessage, duration });
      console.log(`❌ ${name} failed (${duration}ms): ${errorMessage}`);
    }
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n⏱️  Test Durations:');
    this.results.forEach(r => {
      const status = r.passed ? '✅' : '❌';
      console.log(`  ${status} ${r.name}: ${r.duration}ms`);
    });
    
    // Exit with error code if any tests failed
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new SeleniumTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { SeleniumTestRunner };
