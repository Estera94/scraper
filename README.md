# Website Information Scraper Application

A full-stack application for scraping information from multiple websites including LinkedIn, email, Twitter, phone numbers, and WHMCS detection.

## Tech Stack

- **Frontend**: Vue.js 3 with Vite
- **Backend**: Node.js with Express
- **Scraping**: Puppeteer for web scraping
- **Storage**: JSON file

## Setup

### Backend

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Add multiple websites (one per line or comma-separated)
2. Select information types to extract (LinkedIn, Email, Twitter, Phone, WHMCS)
3. Click "Scrape" to start the process
4. View results and export to JSON

## API Endpoints

- `POST /api/scrape` - Scrape websites for selected information
- `GET /api/results` - Get all saved results
- `POST /api/save` - Save results to JSON file

