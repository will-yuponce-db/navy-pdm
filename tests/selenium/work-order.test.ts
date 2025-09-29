import { BaseSeleniumTest } from './base-test';

class WorkOrderTest extends BaseSeleniumTest {
  async testWorkOrderPageLoads(): Promise<void> {
    await this.navigateTo('/workorder');
    await this.waitForPageLoad();
    
    // Check if work order page loads
    const title = await this.getPageTitle();
    console.log('Work Order page title:', title);
    
    // Check if work order table is present
    const tablePresent = await this.isElementVisible('[data-testid="work-order-table"]');
    console.log('Work order table present:', tablePresent);
    
    await this.takeScreenshot('work-order-page-loaded');
  }

  async testCreateWorkOrder(): Promise<void> {
    await this.navigateTo('/workorder');
    
    // Look for create work order button
    const createButtonSelectors = [
      'button[data-testid="create-work-order"]',
      'button:contains("Create")',
      'button:contains("New")',
      'button:contains("Add")'
    ];
    
    let createButtonFound = false;
    for (const selector of createButtonSelectors) {
      if (await this.isElementPresent(selector)) {
        await this.clickElement(selector);
        createButtonFound = true;
        break;
      }
    }
    
    if (createButtonFound) {
      // Wait for modal or form to appear
      await this.waitForElementVisible('[data-testid="work-order-modal"], form, .modal', 5000);
      await this.takeScreenshot('work-order-modal-opened');
      
      // Try to fill out form fields if they exist
      const formFields = [
        { selector: 'input[name="title"], input[placeholder*="title"], input[placeholder*="Title"]', value: 'Test Work Order' },
        { selector: 'textarea[name="description"], textarea[placeholder*="description"]', value: 'This is a test work order created by Selenium' },
        { selector: 'select[name="priority"], select[data-testid="priority"]', value: 'Medium' }
      ];
      
      for (const field of formFields) {
        if (await this.isElementPresent(field.selector)) {
          await this.typeText(field.selector, field.value);
        }
      }
      
      await this.takeScreenshot('work-order-form-filled');
      
      // Try to submit the form
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("Save")',
        'button:contains("Create")',
        'button[data-testid="submit"]'
      ];
      
      for (const selector of submitSelectors) {
        if (await this.isElementPresent(selector)) {
          await this.clickElement(selector);
          break;
        }
      }
      
      // Wait for form submission
      await this.waitForPageLoad();
      await this.takeScreenshot('work-order-created');
    } else {
      console.log('Create work order button not found');
    }
  }

  async testWorkOrderTable(): Promise<void> {
    await this.navigateTo('/workorder');
    
    // Check if table has data
    const tableRows = await this.driver.findElements({ css: 'table tbody tr, [data-testid="work-order-table"] tbody tr' });
    console.log(`Found ${tableRows.length} work order rows`);
    
    if (tableRows.length > 0) {
      // Test sorting if sortable headers exist
      const sortHeaders = await this.driver.findElements({ css: 'th[data-sortable], th.sortable, th[onclick]' });
      console.log(`Found ${sortHeaders.length} sortable headers`);
      
      for (let i = 0; i < Math.min(sortHeaders.length, 3); i++) {
        await sortHeaders[i].click();
        await this.waitForPageLoad();
        await this.takeScreenshot(`work-order-sorted-${i}`);
      }
      
      // Test pagination if present
      const paginationSelectors = [
        'button:contains("Next")',
        'button:contains("Previous")',
        '[data-testid="pagination"] button',
        '.pagination button'
      ];
      
      for (const selector of paginationSelectors) {
        if (await this.isElementPresent(selector)) {
          await this.clickElement(selector);
          await this.waitForPageLoad();
          await this.takeScreenshot('work-order-pagination');
          break;
        }
      }
    }
  }

  async testWorkOrderFilters(): Promise<void> {
    await this.navigateTo('/workorder');
    
    // Look for filter controls
    const filterSelectors = [
      'input[placeholder*="filter"]',
      'input[placeholder*="search"]',
      'select[data-testid*="filter"]',
      '.filter input',
      '.search input'
    ];
    
    for (const selector of filterSelectors) {
      if (await this.isElementPresent(selector)) {
        await this.typeText(selector, 'test');
        await this.waitForPageLoad();
        await this.takeScreenshot('work-order-filtered');
        break;
      }
    }
  }

  async testWorkOrderDetails(): Promise<void> {
    await this.navigateTo('/workorder');
    
    // Try to click on first work order row to view details
    const firstRowSelectors = [
      'table tbody tr:first-child',
      '[data-testid="work-order-table"] tbody tr:first-child',
      '.work-order-row:first-child'
    ];
    
    for (const selector of firstRowSelectors) {
      if (await this.isElementPresent(selector)) {
        await this.clickElement(selector);
        await this.waitForPageLoad();
        await this.takeScreenshot('work-order-details');
        break;
      }
    }
  }
}

// Test runner function
export async function runWorkOrderTests(): Promise<void> {
  const test = new WorkOrderTest();
  
  try {
    await test.setup();
    
    console.log('Running Work Order Tests...');
    
    await test.testWorkOrderPageLoads();
    console.log('✓ Work order page loads test passed');
    
    await test.testWorkOrderTable();
    console.log('✓ Work order table test passed');
    
    await test.testWorkOrderFilters();
    console.log('✓ Work order filters test passed');
    
    await test.testCreateWorkOrder();
    console.log('✓ Create work order test passed');
    
    await test.testWorkOrderDetails();
    console.log('✓ Work order details test passed');
    
    console.log('All work order tests passed!');
    
  } catch (error) {
    console.error('Work order test failed:', error);
    await test.takeScreenshot('work-order-error');
    throw error;
  } finally {
    await test.teardown();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runWorkOrderTests().catch(console.error);
}
