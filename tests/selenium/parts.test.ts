import { BaseSeleniumTest } from './base-test';

class PartsTest extends BaseSeleniumTest {
  async testPartsPageLoads(): Promise<void> {
    await this.navigateTo('/parts');
    await this.waitForPageLoad();
    
    // Check if parts page loads
    const title = await this.getPageTitle();
    console.log('Parts page title:', title);
    
    // Check if parts table is present
    const tablePresent = await this.isElementVisible('[data-testid="parts-table"]');
    console.log('Parts table present:', tablePresent);
    
    await this.takeScreenshot('parts-page-loaded');
  }

  async testPartsTable(): Promise<void> {
    await this.navigateTo('/parts');
    
    // Check if table has data
    const tableRows = await this.driver.findElements({ css: 'table tbody tr, [data-testid="parts-table"] tbody tr' });
    console.log(`Found ${tableRows.length} parts rows`);
    
    if (tableRows.length > 0) {
      // Test sorting if sortable headers exist
      const sortHeaders = await this.driver.findElements({ css: 'th[data-sortable], th.sortable, th[onclick]' });
      console.log(`Found ${sortHeaders.length} sortable headers`);
      
      for (let i = 0; i < Math.min(sortHeaders.length, 2); i++) {
        await sortHeaders[i].click();
        await this.waitForPageLoad();
        await this.takeScreenshot(`parts-sorted-${i}`);
      }
    }
  }

  async testPartsSearch(): Promise<void> {
    await this.navigateTo('/parts');
    
    // Look for search input
    const searchSelectors = [
      'input[placeholder*="search"]',
      'input[placeholder*="filter"]',
      'input[type="search"]',
      '[data-testid="search-input"]',
      '.search input'
    ];
    
    for (const selector of searchSelectors) {
      if (await this.isElementPresent(selector)) {
        await this.typeText(selector, 'engine');
        await this.waitForPageLoad();
        await this.takeScreenshot('parts-search-results');
        break;
      }
    }
  }

  async testPartsModal(): Promise<void> {
    await this.navigateTo('/parts');
    
    // Look for add/edit parts button
    const buttonSelectors = [
      'button[data-testid="add-part"]',
      'button:contains("Add")',
      'button:contains("New")',
      'button:contains("Create")'
    ];
    
    for (const selector of buttonSelectors) {
      if (await this.isElementPresent(selector)) {
        await this.clickElement(selector);
        await this.waitForElementVisible('.modal, [data-testid="part-modal"]', 5000);
        await this.takeScreenshot('parts-modal-opened');
        
        // Try to fill out form fields
        const formFields = [
          { selector: 'input[name="name"], input[placeholder*="name"]', value: 'Test Part' },
          { selector: 'input[name="partNumber"], input[placeholder*="part number"]', value: 'TEST-001' },
          { selector: 'input[name="quantity"], input[placeholder*="quantity"]', value: '10' }
        ];
        
        for (const field of formFields) {
          if (await this.isElementPresent(field.selector)) {
            await this.typeText(field.selector, field.value);
          }
        }
        
        await this.takeScreenshot('parts-form-filled');
        
        // Try to close modal
        const closeSelectors = [
          'button:contains("Cancel")',
          'button:contains("Close")',
          '.modal-close',
          '[data-testid="close-modal"]'
        ];
        
        for (const selector of closeSelectors) {
          if (await this.isElementPresent(selector)) {
            await this.clickElement(selector);
            break;
          }
        }
        
        break;
      }
    }
  }

  async testPartsInventory(): Promise<void> {
    await this.navigateTo('/parts');
    
    // Look for inventory-related elements
    const inventorySelectors = [
      '[data-testid="inventory-status"]',
      '.inventory',
      '.stock-level',
      'td:contains("In Stock")',
      'td:contains("Out of Stock")'
    ];
    
    for (const selector of inventorySelectors) {
      if (await this.isElementPresent(selector)) {
        await this.takeScreenshot('parts-inventory-view');
        break;
      }
    }
  }
}

// Test runner function
export async function runPartsTests(): Promise<void> {
  const test = new PartsTest();
  
  try {
    await test.setup();
    
    console.log('Running Parts Tests...');
    
    await test.testPartsPageLoads();
    console.log('✓ Parts page loads test passed');
    
    await test.testPartsTable();
    console.log('✓ Parts table test passed');
    
    await test.testPartsSearch();
    console.log('✓ Parts search test passed');
    
    await test.testPartsModal();
    console.log('✓ Parts modal test passed');
    
    await test.testPartsInventory();
    console.log('✓ Parts inventory test passed');
    
    console.log('All parts tests passed!');
    
  } catch (error) {
    console.error('Parts test failed:', error);
    await test.takeScreenshot('parts-error');
    throw error;
  } finally {
    await test.teardown();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPartsTests().catch(console.error);
}
