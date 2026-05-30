export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  employeeId: string;
  timestamp: number;
  locationLat?: number;
  locationLng?: number;
  confidence: number;
  livenessPassed: boolean;
  challengesCompleted: string[];
  antiSpoofScore: number;
  deviceId: string;
  appVersion: string;
  synced: 0 | 1 | 2; // 0=pending, 1=synced, 2=failed
  syncAttempts: number;
  syncedAt?: number;
  createdAt: number;
}
