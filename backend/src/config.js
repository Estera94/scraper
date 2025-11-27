export const config = {
  port: process.env.PORT || 3000,
  pagesToScrape: ['', '/contact', '/about', '/about-us'],
  puppeteerOptions: {
    headless: 'new', // Use new headless mode for better stability
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ],
    protocolTimeout: 120000, // 2 minutes for protocol operations (browser launch, page creation, etc.)
    // Use system Chromium if available (Docker)
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  }
}

