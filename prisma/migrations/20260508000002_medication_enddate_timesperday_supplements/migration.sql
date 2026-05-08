ALTER TABLE "MedicationRecord" ADD COLUMN "endDate"     TIMESTAMP(3);
ALTER TABLE "MedicationRecord" ADD COLUMN "timesPerDay" INTEGER;

CREATE TABLE "SupplementRecord" (
    "id"          TEXT         NOT NULL,
    "memberId"    TEXT         NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "name"        TEXT         NOT NULL,
    "dosage"      TEXT,
    "timesPerDay" INTEGER,
    "endDate"     TIMESTAMP(3),
    "reason"      TEXT,
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplementRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplementRecord_memberId_idx"      ON "SupplementRecord"("memberId");
CREATE INDEX "SupplementRecord_memberId_date_idx" ON "SupplementRecord"("memberId", "date");

ALTER TABLE "SupplementRecord"
    ADD CONSTRAINT "SupplementRecord_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
