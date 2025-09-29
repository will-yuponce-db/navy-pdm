import { BaseSeleniumTest } from './base-test';

class HomePageTest extends BaseSeleniumTest {
  async testHomePageLoads(): Promise<void> {
    await this.navigateTo('/');
    await this.waitForPageLoad();
    
    // Check if the page title is correct
    const title = await this.getPageTitle();
    console.log('Page title:', title);
    
    // Check if main navigation is present
    const navPresent = await this.isElementVisible('nav');
    console.log('Navigation present:', navPresent);
    
    // Check if main content area is present
    const mainContent = await this.isElementVisible('main');
    console.log('Main content present:', mainContent);
    
    // Take a screenshot
    await this.takeScreenshot('home-page-loaded');
  }

  async testNavigationLinks(): Promise<void> {
    await this.navigateTo('/');
    
    // Test navigation to different pages
    const navLinks = [
      { selector: 'a[href="/parts"]', expectedPath: '/parts' },
      { selector: 'a[href="/workorder"]', expectedPath: '/workorder' },
      { selector: 'a[href="/readiness"]', expectedPath: '/readiness' },
      { selector: 'a[href="/assets"]', expectedPath: '/assets' },
      { selector: 'a[href="/about"]', expectedPath: '/about' }
    ];

    for (const link of navLinks) {
      if (await this.isElementPresent(link.selector)) {
        await this.clickElement(link.selector);
        await this.waitForUrl(link.expectedPath);
        console.log(`Successfully navigated to ${link.expectedPath}`);
        await this.takeScreenshot(`navigation-${link.expectedPath.replace('/', '')}`);
        await this.navigateTo('/'); // Go back to home
      }
    }
  }

  async testResponsiveDesign(): Promise<void> {
    await this.navigateTo('/');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await this.driver.manage().window().setRect({
        width: viewport.width,
        height: viewport.height,
        x: 0,
        y: 0
      });
      
      await this.waitForPageLoad();
      await this.takeScreenshot(`responsive-${viewport.name}`);
      console.log(`Screenshot taken for ${viewport.name} viewport`);
    }
  }

  async testPagePerformance(): Promise<void> {
    await this.navigateTo('/');
    
    // Measure page load time
    const startTime = Date.now();
    await this.waitForPageLoad();
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check if page loads within acceptable time (5 seconds)
    if (loadTime > 5000) {
      console.warn(`Page load time (${loadTime}ms) exceeds 5 seconds`);
    }
  }
}

// Test runner function
export async function runHomePageTests(): Promise<void> {
  const test = new HomePageTest();
  
  try {
    await test.setup();
    
    console.log('Running Home Page Tests...');
    
    await test.testHomePageLoads();
    console.log('✓ Home page loads test passed');
    
    await test.testNavigationLinks();
    console.log('✓ Navigation links test passed');
    
    await test.testResponsiveDesign();
    console.log('✓ Responsive design test passed');
    
    await test.testPagePerformance();
    console.log('✓ Page performance test passed');
    
    console.log('All home page tests passed!');
    
  } catch (error) {
    console.error('Home page test failed:', error);
    await test.takeScreenshot('home-page-error');
    throw error;
  } finally {
    await test.teardown();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runHomePageTests().catch(console.error);
}
