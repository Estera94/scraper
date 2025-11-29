<!-- 01321d52-183f-4f55-8e73-5836df077e8d 83817533-66b9-4ffd-beff-382a2c040ed8 -->
# Focused Enhancement Plan - Teams, Data Sources, UX

## Overview

Transform the scraper into a market-leading platform with team collaboration, expanded data sources, and enhanced user experience. Implementation order: Team Features → Data Sources → Enhanced UX.

## Phase 1: Team Collaboration Features (Priority)

### 1.1 Database Schema Updates

**File**: `backend/prisma/schema.prisma`

- Add `Team` model:
- id, name, createdAt, updatedAt
- ownerId (User reference)
- Add `TeamMember` model:
- id, teamId, userId, role (admin, member, viewer)
- joinedAt, createdAt
- Add `TeamCreditPool` model:
- id, teamId, credits, createdAt, updatedAt
- Update `Company` model:
- Add `teamId` (optional, for shared companies)
- Keep `userId` for personal companies
- Add `ActivityLog` model:
- id, teamId (optional), userId, action, entityType, entityId
- metadata (JSON), createdAt

### 1.2 Backend: Team Service

**File**: `backend/src/services/teamService.js` (new)

- `createTeam(userId, teamData)` - Create team with creator as admin
- `inviteMember(teamId, email, role)` - Invite user to team
- `updateMemberRole(teamId, memberId, role)` - Change member role
- `removeMember(teamId, memberId)` - Remove team member
- `getTeamCompanies(teamId, filters)` - Get shared companies
- `shareCompanyWithTeam(companyId, teamId)` - Share company
- `getTeamActivity(teamId, filters)` - Get activity logs
- `getTeamCredits(teamId)` - Get team credit pool
- `addTeamCredits(teamId, credits)` - Add credits to pool
- `useTeamCredits(teamId, credits)` - Deduct from pool

### 1.3 Backend: Team Routes

**File**: `backend/src/routes/teams.js` (new)

- `POST /api/teams` - Create team
- `GET /api/teams` - List user's teams
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Invite member
- `PUT /api/teams/:id/members/:memberId` - Update member role
- `DELETE /api/teams/:id/members/:memberId` - Remove member
- `GET /api/teams/:id/companies` - Get team companies
- `POST /api/teams/:id/companies/:companyId/share` - Share company
- `GET /api/teams/:id/activity` - Get activity logs
- `GET /api/teams/:id/credits` - Get credit pool
- `POST /api/teams/:id/credits` - Add credits

### 1.4 Backend: Update Credit System

**File**: `backend/src/services/creditService.js`

- Support team credit pools
- Check team credits if teamId provided
- Deduct from team pool when team context exists

### 1.5 Frontend: Team Management UI

**File**: `frontend/src/views/Teams.vue` (new)

- Team list/dashboard
- Create team form
- Team member management (invite, roles, remove)
- Team credit pool display and management
- Activity log viewer
- Team settings

### 1.6 Frontend: Team Selector Component

**File**: `frontend/src/components/Team/TeamSelector.vue` (new)

- Switch between personal and team workspaces
- Team context indicator
- Quick team switcher

### 1.7 Frontend: Update Companies Page

**File**: `frontend/src/views/Companies.vue`

- Filter by team vs personal
- Share company button/action
- Team context awareness

### 1.8 Frontend: Activity Log Component

**File**: `frontend/src/components/Team/ActivityLog.vue` (new)

- Display team activity feed
- Filter by user, action type, date
- Real-time updates (optional)

## Phase 2: Additional Data Sources

### 2.1 Technology Detection Service

**File**: `backend/src/services/techDetectionService.js` (new)

- Detect CMS (WordPress, Shopify, Drupal, etc.)
- Detect e-commerce platforms
- Detect payment gateways (Stripe, PayPal, Square)
- Detect analytics tools (GA, Mixpanel, etc.)
- Detect hosting providers
- Use Wappalyzer-like detection via page analysis
- Store in Company model as `technologyStack` JSON field

### 2.2 Social Media Scrapers

**File**: `backend/src/services/socialMediaScraper.js` (new)

- Facebook company page scraper:
- Business info, follower count, recent posts
- Use Facebook Graph API if available, fallback to scraping
- Instagram business profile scraper:
- Follower count, bio, recent posts count
- Use Instagram Basic Display API if available
- YouTube channel scraper:
- Channel info, subscriber count, video count
- Use YouTube Data API
- TikTok business profile scraper:
- Follower count, bio, video count
- Scraping approach (no official API)

### 2.3 Professional Networks Integration

**File**: `backend/src/services/professionalNetworksService.js` (new)

- Enhanced LinkedIn scraping:
- More contact details (phone, email from profiles)
- Better job title extraction
- Department categorization
- Crunchbase integration:
- Use Crunchbase API if available
- Scrape as fallback
- Funding rounds, investors, news
- AngelList/Wellfound:
- Company data, funding, team size
- Scraping approach

### 2.4 GitHub Integration

**File**: `backend/src/services/githubService.js` (new)

- Use GitHub API (no auth required for public data)
- Organization data: repos, contributors, languages
- Tech stack from repository languages
- Activity metrics

### 2.5 Contact Discovery Enhancement

**File**: `backend/src/services/contactDiscoveryService.js` (new)

- Multiple email extraction:
- Find all emails on pages (not just first)
- Categorize by department (sales@, support@, info@, etc.)
- Store as array in Company model
- Phone number discovery:
- Extract all phone numbers
- Validate format
- Categorize (main, support, sales)
- Contact name extraction:
- Extract names from "About Us", "Team" pages
- Match names with titles/roles
- Store in new `CompanyContact` model

### 2.6 Database Schema Updates for Data Sources

**File**: `backend/prisma/schema.prisma`

- Add `SocialMediaProfile` model:
- id, companyId, platform (facebook, instagram, youtube, tiktok)
- profileUrl, followerCount, postCount, metadata (JSON)
- lastScrapedAt, createdAt, updatedAt
- Add `TechnologyStack` to Company:
- technologyStack JSON field
- Add `CompanyContact` model:
- id, companyId, name, email, phone, title, department
- source (scraped, manual), createdAt, updatedAt
- Update `Company` model:
- Add `emails` JSON array (multiple emails)
- Add `phones` JSON array (multiple phones)

### 2.7 Update Scraper Service

**File**: `backend/src/services/scraper.js`

- Integrate technology detection
- Integrate contact discovery
- Add social media scraping options
- Store all new data types in results

### 2.8 Update Info Selector

**File**: `frontend/src/components/InfoSelector.vue`

- Add new data type options:
- Technology Stack
- Social Media Profiles
- Enhanced Contacts
- Professional Networks

## Phase 3: Enhanced User Experience

### 3.1 Analytics Dashboard

**File**: `frontend/src/views/Analytics.vue` (new)

- Scraping statistics:
- Total scrapes, success rate
- Data points found (pie charts)
- Scrapes over time (line chart)
- Company growth:
- Companies added over time
- Data completeness trends
- Data quality metrics:
- Average data completeness per company
- Missing data breakdown
- Quality score distribution
- Credit usage analytics:
- Credits used over time
- Credits per scrape type
- Cost per lead
- ROI tracking:
- Leads found vs credits spent
- Value per company
- Conversion metrics (if tracking)

### 3.2 Analytics Backend Service

**File**: `backend/src/services/analyticsService.js` (new)

- `getScrapingStats(userId, dateRange)` - Scrape statistics
- `getCompanyGrowth(userId, dateRange)` - Company growth metrics
- `getDataQualityMetrics(userId)` - Quality scores
- `getCreditUsage(userId, dateRange)` - Credit analytics
- `getROIMetrics(userId, dateRange)` - ROI calculations

### 3.3 Analytics API Routes

**File**: `backend/src/routes/analytics.js` (new)

- `GET /api/analytics/stats` - All analytics data
- `GET /api/analytics/scraping` - Scraping statistics
- `GET /api/analytics/companies` - Company growth
- `GET /api/analytics/quality` - Data quality
- `GET /api/analytics/credits` - Credit usage
- `GET /api/analytics/roi` - ROI metrics

### 3.4 Enhanced Company Profile

**File**: `frontend/src/views/CompanyProfile.vue` (update)

- Rich company card with all data points:
- Technology stack visualization (badges/chips)
- Social media profiles grid
- Multiple contacts list
- Professional network data
- Timeline/history visualization:
- Interactive timeline of all scrapes
- Data changes over time
- Visual diff of what changed
- Technology stack visualization:
- Categorized tech stack (CMS, E-commerce, Payment, etc.)
- Visual representation with icons
- Tech stack changes over time
- Contact relationship mapping:
- Visual map of contacts and their relationships
- Department organization
- Contact hierarchy
- Quick actions panel:
- Verify email button
- Enrich data button
- Refresh all data
- Export options

### 3.5 Company Profile Backend Updates

**File**: `backend/src/routes/scrape.js`

- Add endpoints for:
- `POST /api/companies/:id/enrich` - Trigger data enrichment
- `POST /api/companies/:id/verify-emails` - Verify all emails
- `GET /api/companies/:id/timeline` - Get timeline data

## Implementation Order

### Sprint 1: Team Foundation

1. Database schema updates for teams
2. Team service and routes
3. Basic team management UI
4. Team credit pools

### Sprint 2: Team Features Complete

1. Team member management
2. Shared companies
3. Activity logs
4. Team context throughout app

### Sprint 3: Technology Detection

1. Tech detection service
2. Integrate into scraper
3. Display in company profiles
4. Technology filter in companies page

### Sprint 4: Contact Discovery

1. Enhanced contact extraction
2. Multiple emails/phones
3. Contact name extraction
4. Contact management UI

### Sprint 5: Social Media Sources

1. Facebook scraper
2. Instagram scraper
3. YouTube integration
4. TikTok scraper
5. Display in profiles

### Sprint 6: Professional Networks

1. Enhanced LinkedIn
2. Crunchbase integration
3. GitHub integration
4. AngelList/Wellfound

### Sprint 7: Analytics Dashboard

1. Analytics service
2. Analytics API
3. Dashboard UI with charts
4. Data visualization components

### Sprint 8: Enhanced Profiles

1. Rich company cards
2. Timeline visualization
3. Tech stack visualization
4. Quick actions panel

## Technical Requirements

**New Dependencies:**

- Chart library (Chart.js or similar)
- Date manipulation (date-fns)
- API clients for external services
- Job queue for background processing (if needed)

**Database Migrations:**

- Team, TeamMember, TeamCreditPool tables
- SocialMediaProfile table
- CompanyContact table
- ActivityLog table
- Updates to Company table

**New API Integrations:**

- GitHub API (public, no auth needed)
- YouTube Data API
- Crunchbase API (if available)
- Facebook Graph API (optional)
- Instagram Basic Display API (optional)

### To-dos

- [ ] Create backend exportService.js with data aggregation functions for all report types
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Create backend exportService.js with data aggregation functions for all report types
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Update backend companyService.js to add search and filter support to listUserCompanies function
- [x] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [x] Update frontend api.js getCompanies function to accept filter parameters
- [x] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [x] Add /companies route to frontend router
- [x] Add Companies navigation link to NavBar component
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Create backend exportService.js with data aggregation functions for all report types
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Update backend companyService.js to add search and filter support to listUserCompanies function
- [x] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [x] Update frontend api.js getCompanies function to accept filter parameters
- [x] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [x] Add /companies route to frontend router
- [x] Add Companies navigation link to NavBar component
- [ ] Integrate email verification API (ZeroBounce/Hunter.io) and add verification status to contacts
- [ ] Add technology stack detection (BuiltWith/Wappalyzer) to scraper
- [ ] Integrate Clearbit or SimilarWeb for company data enrichment
- [ ] Implement lead scoring algorithm based on data completeness and company signals
- [ ] Create analytics dashboard with scraping stats, data quality metrics, and ROI tracking
- [ ] Implement scheduled/recurring scrape jobs with background queue system
- [ ] Add webhook system for scrape completion and data update notifications
- [ ] Create RESTful API with authentication, rate limiting, and documentation
- [ ] Add bulk operations UI for import, export, delete, and bulk contact management
- [ ] Add Facebook, Instagram, GitHub data source integrations
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Update backend companyService.js to add search and filter support to listUserCompanies function
- [x] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [x] Update frontend api.js getCompanies function to accept filter parameters
- [x] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [x] Add /companies route to frontend router
- [x] Add Companies navigation link to NavBar component
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Create backend exportService.js with data aggregation functions for all report types
- [x] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [x] Create reports.js routes file with endpoints for each report type and format
- [x] Update server.js to mount reports router
- [x] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [x] Create frontend Reports.vue view with report type selector, filters, and format selection
- [x] Create frontend reports.js API service with functions for each export type
- [x] Update router to add /reports route
- [x] Update NavBar.vue to add Reports navigation link
- [x] Update backend companyService.js to add search and filter support to listUserCompanies function
- [x] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [x] Update frontend api.js getCompanies function to accept filter parameters
- [x] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [x] Add /companies route to frontend router
- [x] Add Companies navigation link to NavBar component
- [ ] Update Prisma schema to add Team, TeamMember, TeamCreditPool, ActivityLog models
- [ ] Create teamService.js with team management, member management, and credit pool functions
- [ ] Create teams.js routes file with all team management endpoints
- [ ] Create Teams.vue view with team management, member invites, and activity logs
- [ ] Create techDetectionService.js for CMS, e-commerce, payment gateway, analytics, and hosting detection
- [ ] Create socialMediaScraper.js for Facebook, Instagram, YouTube, TikTok scraping
- [ ] Create professionalNetworksService.js for enhanced LinkedIn, Crunchbase, GitHub, AngelList integration
- [ ] Create contactDiscoveryService.js for multiple emails, phones, and name extraction
- [ ] Update Prisma schema for SocialMediaProfile, CompanyContact, and technology stack fields
- [ ] Create analyticsService.js with scraping stats, company growth, data quality, credit usage, and ROI metrics
- [ ] Create analytics.js routes file with analytics endpoints
- [ ] Create Analytics.vue view with charts and visualizations for all metrics
- [ ] Update CompanyProfile.vue with rich cards, timeline, tech stack visualization, and quick actions
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Update backend companyService.js to add search and filter support to listUserCompanies function
- [ ] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [ ] Update frontend api.js getCompanies function to accept filter parameters
- [ ] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [ ] Add /companies route to frontend router
- [ ] Add Companies navigation link to NavBar component
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Create backend exportService.js with data aggregation functions for all report types
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Update backend companyService.js to add search and filter support to listUserCompanies function
- [ ] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [ ] Update frontend api.js getCompanies function to accept filter parameters
- [ ] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [ ] Add /companies route to frontend router
- [ ] Add Companies navigation link to NavBar component
- [ ] Update Prisma schema to add Team, TeamMember, TeamCreditPool, ActivityLog models
- [ ] Create teamService.js with team management, member management, and credit pool functions
- [ ] Create teams.js routes file with all team management endpoints
- [ ] Create Teams.vue view with team management, member invites, and activity logs
- [ ] Create techDetectionService.js for CMS, e-commerce, payment gateway, analytics, and hosting detection
- [ ] Create socialMediaScraper.js for Facebook, Instagram, YouTube, TikTok scraping
- [ ] Create professionalNetworksService.js for enhanced LinkedIn, Crunchbase, GitHub, AngelList integration
- [ ] Create contactDiscoveryService.js for multiple emails, phones, and name extraction
- [ ] Update Prisma schema for SocialMediaProfile, CompanyContact, and technology stack fields
- [ ] Create analyticsService.js with scraping stats, company growth, data quality, credit usage, and ROI metrics
- [ ] Create analytics.js routes file with analytics endpoints
- [ ] Create Analytics.vue view with charts and visualizations for all metrics
- [ ] Update CompanyProfile.vue with rich cards, timeline, tech stack visualization, and quick actions
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Update backend companyService.js to add search and filter support to listUserCompanies function
- [ ] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [ ] Update frontend api.js getCompanies function to accept filter parameters
- [ ] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [ ] Add /companies route to frontend router
- [ ] Add Companies navigation link to NavBar component
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Create backend exportService.js with data aggregation functions for all report types
- [ ] Add format conversion utilities (CSV, JSON, Excel, PDF) to exportService.js
- [ ] Create reports.js routes file with endpoints for each report type and format
- [ ] Update server.js to mount reports router
- [ ] Install npm packages: exceljs and pdfkit (or puppeteer) in backend
- [ ] Create frontend Reports.vue view with report type selector, filters, and format selection
- [ ] Create frontend reports.js API service with functions for each export type
- [ ] Update router to add /reports route
- [ ] Update NavBar.vue to add Reports navigation link
- [ ] Update backend companyService.js to add search and filter support to listUserCompanies function
- [ ] Update backend /api/companies endpoint to accept and process query parameters for filtering
- [ ] Update frontend api.js getCompanies function to accept filter parameters
- [ ] Create frontend Companies.vue view with search bar, filter panel, and company list display
- [ ] Add /companies route to frontend router
- [ ] Add Companies navigation link to NavBar component
- [ ] Update Prisma schema to add Team, TeamMember, TeamCreditPool, ActivityLog models
- [ ] Create teamService.js with team management, member management, and credit pool functions
- [ ] Create teams.js routes file with all team management endpoints
- [ ] Create Teams.vue view with team management, member invites, and activity logs
- [ ] Create techDetectionService.js for CMS, e-commerce, payment gateway, analytics, and hosting detection
- [ ] Create socialMediaScraper.js for Facebook, Instagram, YouTube, TikTok scraping
- [ ] Create professionalNetworksService.js for enhanced LinkedIn, Crunchbase, GitHub, AngelList integration
- [ ] Create contactDiscoveryService.js for multiple emails, phones, and name extraction
- [ ] Update Prisma schema for SocialMediaProfile, CompanyContact, and technology stack fields
- [ ] Create analyticsService.js with scraping stats, company growth, data quality, credit usage, and ROI metrics
- [ ] Create analytics.js routes file with analytics endpoints
- [ ] Create Analytics.vue view with charts and visualizations for all metrics
- [ ] Update CompanyProfile.vue with rich cards, timeline, tech stack visualization, and quick actions