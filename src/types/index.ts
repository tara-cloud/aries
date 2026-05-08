export type MemberRelation = "self" | "spouse" | "child" | "parent" | "other";
export type HealthStatus = "active" | "resolved" | "chronic";
export type HealthSeverity = "mild" | "moderate" | "severe";
export type ReportType = "lab" | "scan" | "prescription" | "doctor_note" | "other";
export type UserRole = "admin" | "member";

export interface Home {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface HomeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export interface Member {
  id: string;
  homeId: string;
  name: string;
  dob: string | null;
  gender: string | null;
  relation: string | null;
  notes: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CycleRecord {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string | null;
  flow: string | null;
  symptoms: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  memberId: string;
  date: string;
  name: string;
  dosage: string | null;
  timesPerDay: number | null;
  endDate: string | null;
  frequency: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  member?: { name: string };
}

export interface SupplementRecord {
  id: string;
  memberId: string;
  date: string;
  name: string;
  dosage: string | null;
  timesPerDay: number | null;
  endDate: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  member?: { name: string };
}

export interface PainRecord {
  id: string;
  memberId: string;
  date: string;
  severity: number;
  location: string | null;
  description: string | null;
  duration: string | null;
  notes: string | null;
  createdAt: string;
  member?: { name: string };
}

export interface HealthIssue {
  id: string;
  memberId: string;
  title: string;
  description: string | null;
  diagnosedDate: string | null;
  resolvedDate: string | null;
  status: HealthStatus;
  severity: HealthSeverity | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  member?: { name: string };
}

export interface Report {
  id: string;
  memberId: string;
  date: string;
  title: string;
  type: ReportType;
  notes: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  member?: { name: string };
}

export interface TimelineDay {
  date: string;
  medications: MedicationRecord[];
  painRecords: PainRecord[];
  healthIssues: HealthIssue[];
  reports: Report[];
}

export interface SearchResult {
  medications: MedicationRecord[];
  supplements: SupplementRecord[];
  painRecords: PainRecord[];
  healthIssues: HealthIssue[];
  reports: Report[];
}
