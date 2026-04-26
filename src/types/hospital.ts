// src/types/hospital.ts
export interface PatientStatus {
  condition: string;
  hospital: string;
  medicalNotes?: string;
  treatment?: string;
  doctor?: string;
  bedNumber?: string;
  updatedAt: string;
}

export interface HospitalTimestamps {
  reportedAt: string;
  assignedAt?: string;
  arrivedAt?: string;
  transportingAt?: string;
  deliveredAt?: string;
  admittedAt?: string;
  dischargedAt?: string;
  completedAt?: string;
}