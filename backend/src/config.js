export const config = {
  port: process.env.PORT || 3000,
  pagesToScrape: ['', '/contact', '/about', '/about-us'],
  puppeteerOptions: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 120000 // 2 minutes for protocol operations (browser launch, page creation, etc.)
  }
}

