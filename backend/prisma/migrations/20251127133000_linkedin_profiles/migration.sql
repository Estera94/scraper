-- Create LinkedIn profiles table
CREATE TABLE "linkedin_profiles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyUrl" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "followerCount" INTEGER,
    "employeeCountMin" INTEGER,
    "employeeCountMax" INTEGER,
    "headquarters" JSONB,
    "website" TEXT,
    "logoUrl" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "linkedin_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "linkedin_profiles_companyId_key" UNIQUE ("companyId")
);

ALTER TABLE "linkedin_profiles"
ADD CONSTRAINT "linkedin_profiles_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Create LinkedIn contacts table
CREATE TABLE "linkedin_contacts" (
    "id" TEXT NOT NULL,
    "linkedinProfileId" TEXT NOT NULL,
    "fullName" TEXT,
    "title" TEXT,
    "location" TEXT,
    "email" TEXT,
    "emailStatus" TEXT,
    "linkedinUrl" TEXT,
    "connectionDegree" TEXT,
    "metadata" JSONB,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "linkedin_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_linkedin_contacts_profile"
ON "linkedin_contacts" ("linkedinProfileId");

ALTER TABLE "linkedin_contacts"
ADD CONSTRAINT "linkedin_contacts_linkedinProfileId_fkey"
FOREIGN KEY ("linkedinProfileId") REFERENCES "linkedin_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

