-- CreateTable
CREATE TABLE "scrape_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalJobs" INTEGER NOT NULL,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "failedJobs" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_jobs" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "infoTypes" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "companyId" TEXT,
    "scrapeId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_scrape_batches_user" ON "scrape_batches"("userId");

-- CreateIndex
CREATE INDEX "idx_scrape_batches_status" ON "scrape_batches"("status");

-- CreateIndex
CREATE INDEX "idx_scrape_jobs_batch" ON "scrape_jobs"("batchId");

-- CreateIndex
CREATE INDEX "idx_scrape_jobs_status" ON "scrape_jobs"("status");

-- AddForeignKey
ALTER TABLE "scrape_batches" ADD CONSTRAINT "scrape_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "scrape_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

