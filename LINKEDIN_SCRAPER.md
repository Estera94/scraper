## LinkedIn Scraper Notes

### Required environment

```
LINKEDIN_USERNAME=your_email@example.com
LINKEDIN_PASSWORD=your_password
LINKEDIN_MAX_CONTACTS=100        # optional
LINKEDIN_WAIT_MS=2500            # optional
LINKEDIN_CREDITS_PER_SCRAPE=3    # backend credit cost
VITE_LINKEDIN_CREDITS_PER_SCRAPE=3  # frontend display
```

Make sure these variables are available to the backend (and frontend for the credit hint).

### Manual verification checklist

1. `cd backend && npx prisma migrate dev` to apply the LinkedIn tables.
2. Start the backend and frontend normally.
3. From the dashboard, open (or create) a company that has a LinkedIn URL in its latest snapshot.
4. In the company profile page:
   - Click **Run LinkedIn scrape**.
   - Wait for the toast/loading indicator to finish.
   - Confirm the overview card shows follower counts / size.
   - Confirm the contacts table lists employees and pagination works if > page size.
5. Trigger **Load more** to fetch additional contacts and make sure the counter/CSV export includes them.
6. Use **Clear data** to ensure LinkedIn rows are removed from both overview/contacts and the API returns empty payloads.
7. Verify credits decreased by `LINKEDIN_CREDITS_PER_SCRAPE`.
8. Run `cd backend && npm test` to execute the LinkedIn helper tests.


