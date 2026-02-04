-- CreateTable
CREATE TABLE "export_tasks" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "params" JSONB,
    "fileName" TEXT,
    "filePath" TEXT,
    "errorMessage" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "export_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_tasks_createdById_idx" ON "export_tasks"("createdById");

-- CreateIndex
CREATE INDEX "export_tasks_status_idx" ON "export_tasks"("status");

-- CreateIndex
CREATE INDEX "export_tasks_createdAt_idx" ON "export_tasks"("createdAt");

-- AddForeignKey
ALTER TABLE "export_tasks" ADD CONSTRAINT "export_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
