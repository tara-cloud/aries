-- Add gender column to Member
ALTER TABLE "Member" ADD COLUMN "gender" TEXT;

-- Add userId column to Member (optional link to a login User)
ALTER TABLE "Member" ADD COLUMN "userId" TEXT;

-- Unique: one user → at most one member profile
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- Index for userId lookups
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- FK: Member.userId → User.id (SET NULL when user is deleted)
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: CycleRecord (menstrual cycle tracking, only for female members)
CREATE TABLE "CycleRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "flow" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CycleRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CycleRecord_memberId_idx" ON "CycleRecord"("memberId");
CREATE INDEX "CycleRecord_memberId_startDate_idx" ON "CycleRecord"("memberId", "startDate");

ALTER TABLE "CycleRecord" ADD CONSTRAINT "CycleRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
