-- Create companies table
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT,
    "latestSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "companies_userId_domain_key" ON "companies" ("userId", "domain");

ALTER TABLE "companies"
ADD CONSTRAINT "companies_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Create company_scrapes table
CREATE TABLE "company_scrapes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "infoTypes" JSONB,
    "results" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_scrapes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "company_scrapes"
ADD CONSTRAINT "company_scrapes_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing scrape results into new structure
WITH distinct_companies AS (
    SELECT
        "userId",
        lower("website") AS domain,
        MAX("timestamp") AS latestTimestamp,
        CONCAT('cmp_', md5("userId" || '|' || lower("website"))) AS company_id
    FROM "scrape_results"
    GROUP BY "userId", lower("website")
)
INSERT INTO "companies" ("id", "userId", "domain", "displayName", "latestSnapshot", "createdAt", "updatedAt")
SELECT
    dc.company_id,
    dc."userId",
    dc.domain,
    NULL,
    (
        SELECT sr."results"
        FROM "scrape_results" sr
        WHERE sr."userId" = dc."userId"
          AND lower(sr."website") = dc.domain
        ORDER BY sr."timestamp" DESC
        LIMIT 1
    ),
    dc.latestTimestamp,
    dc.latestTimestamp
FROM distinct_companies dc;

INSERT INTO "company_scrapes" ("id", "companyId", "tool", "infoTypes", "results", "metadata", "createdAt")
SELECT
    sr."id",
    CONCAT('cmp_', md5(sr."userId" || '|' || lower(sr."website"))),
    'web_scraper',
    NULL,
    sr."results",
    jsonb_build_object('website', sr."website"),
    sr."timestamp"
FROM "scrape_results" sr;

-- Remove legacy table now that data is migrated
DROP TABLE "scrape_results";


