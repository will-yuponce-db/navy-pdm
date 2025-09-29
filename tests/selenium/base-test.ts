import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import { SeleniumDriver, SeleniumConfig } from '../../selenium.config';

export abstract class BaseSeleniumTest {
  protected driver: WebDriver;
  protected seleniumDriver: SeleniumDriver;
  protected config: SeleniumConfig;

  constructor(config: Partial<SeleniumConfig> = {}) {
    this.seleniumDriver = new SeleniumDriver(config);
    this.config = this.seleniumDriver.getConfig();
  }

  async setup(): Promise<void> {
    this.driver = await this.seleniumDriver.initialize();
  }

  async teardown(): Promise<void> {
    await this.seleniumDriver.quit();
  }

  async navigateTo(path: string = ''): Promise<void> {
    const url = `${this.config.baseUrl}${path}`;
    await this.driver.get(url);
  }

  async waitForElement(selector: string, timeout: number = 10000): Promise<WebElement> {
    return await this.driver.wait(
      until.elementLocated(By.css(selector)),
      timeout
    );
  }

  async waitForElementVisible(selector: string, timeout: number = 10000): Promise<WebElement> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    await element.click();
  }

  async typeText(selector: string, text: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.waitForElementVisible(selector);
    return await element.getText();
  }

  async isElementPresent(selector: string): Promise<boolean> {
    try {
      await this.driver.findElement(By.css(selector));
      return true;
    } catch {
      return false;
    }
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = await this.driver.findElement(By.css(selector));
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async waitForUrl(url: string, timeout: number = 10000): Promise<void> {
    await this.driver.wait(until.urlContains(url), timeout);
  }

  async takeScreenshot(name: string): Promise<void> {
    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    const path = require('path');
    
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(screenshotsDir, filename);
    fs.writeFileSync(filepath, screenshot, 'base64');
    console.log(`Screenshot saved: ${filepath}`);
  }

  async scrollToElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
  }

  async waitForPageLoad(): Promise<void> {
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, 10000);
  }

  async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  async getPageTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  async refreshPage(): Promise<void> {
    await this.driver.navigate().refresh();
    await this.waitForPageLoad();
  }

  async goBack(): Promise<void> {
    await this.driver.navigate().back();
    await this.waitForPageLoad();
  }

  async goForward(): Promise<void> {
    await this.driver.navigate().forward();
    await this.waitForPageLoad();
  }

  async switchToNewTab(): Promise<void> {
    const handles = await this.driver.getAllWindowHandles();
    const newHandle = handles[handles.length - 1];
    await this.driver.switchTo().window(newHandle);
  }

  async closeCurrentTab(): Promise<void> {
    await this.driver.close();
    const handles = await this.driver.getAllWindowHandles();
    if (handles.length > 0) {
      await this.driver.switchTo().window(handles[0]);
    }
  }

  async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.executeScript(script, ...args);
  }

  async waitForCondition(condition: () => Promise<boolean>, timeout: number = 10000): Promise<void> {
    await this.driver.wait(condition, timeout);
  }
}
