import { Builder, WebDriver, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';

export interface SeleniumConfig {
  baseUrl: string;
  browser: 'chrome' | 'firefox' | 'safari';
  headless: boolean;
  windowSize: {
    width: number;
    height: number;
  };
  timeout: number;
  implicitWait: number;
}

export const defaultConfig: SeleniumConfig = {
  baseUrl: 'http://localhost:3000',
  browser: 'chrome',
  headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  windowSize: {
    width: 1920,
    height: 1080
  },
  timeout: 30000,
  implicitWait: 10000
};

export class SeleniumDriver {
  private driver: WebDriver | null = null;
  private config: SeleniumConfig;

  constructor(config: Partial<SeleniumConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async initialize(): Promise<WebDriver> {
    if (this.driver) {
      return this.driver;
    }

    let builder = new Builder();

    switch (this.config.browser) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (this.config.headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--disable-extensions');
        chromeOptions.addArguments(`--window-size=${this.config.windowSize.width},${this.config.windowSize.height}`);
        builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (this.config.headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.addArguments(`--width=${this.config.windowSize.width}`);
        firefoxOptions.addArguments(`--height=${this.config.windowSize.height}`);
        builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
        break;

      case 'safari':
        builder = builder.forBrowser('safari');
        break;

      default:
        throw new Error(`Unsupported browser: ${this.config.browser}`);
    }

    this.driver = await builder.build();
    await this.driver.manage().setTimeouts({
      implicit: this.config.implicitWait,
      pageLoad: this.config.timeout,
      script: this.config.timeout
    });

    return this.driver;
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call initialize() first.');
    }
    return this.driver;
  }

  getConfig(): SeleniumConfig {
    return this.config;
  }
}
