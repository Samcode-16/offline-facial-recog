import { v4 as uuidv4 } from "react-native-uuid";
import { DatabaseManager } from "./DatabaseManager";
import { AttendanceRecord } from "../types/Attendance";
import { Constants } from "../utils/Constants";

export class AttendanceRepository {
  static async insert(
    record: Omit<
      AttendanceRecord,
      "id" | "synced" | "syncAttempts" | "createdAt"
    >,
  ): Promise<string> {
    const id = uuidv4() as string;
    const db = DatabaseManager.getInstance().getDb();
    await db.executeSql(
      `INSERT INTO attendance_records
       (id,person_id,person_name,employee_id,timestamp,location_lat,location_lng,
        confidence,liveness_passed,challenges_completed,anti_spoof_score,
        device_id,app_version,synced,sync_attempts,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?)`,
      [
        id,
        record.personId,
        record.personName,
        record.employeeId,
        record.timestamp,
        record.locationLat ?? null,
        record.locationLng ?? null,
        record.confidence,
        record.livenessPassed ? 1 : 0,
        JSON.stringify(record.challengesCompleted),
        record.antiSpoofScore ?? null,
        record.deviceId,
        record.appVersion,
        Date.now(),
      ],
    );
    return id;
  }

  static async getPending(
    limit = Constants.SYNC_BATCH_SIZE,
  ): Promise<AttendanceRecord[]> {
    const db = DatabaseManager.getInstance().getDb();
    const [result] = await db.executeSql(
      `SELECT * FROM attendance_records WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?`,
      [limit],
    );
    return Array.from({ length: result.rows.length }, (_, i) => {
      const r = result.rows.item(i);
      return {
        ...r,
        livenessPassed: !!r.liveness_passed,
        challengesCompleted: JSON.parse(r.challenges_completed),
      };
    });
  }

  static async markSynced(ids: string[], ackId: string): Promise<void> {
    const placeholders = ids.map(() => "?").join(",");
    const db = DatabaseManager.getInstance().getDb();
    await db.executeSql(
      `UPDATE attendance_records SET synced=1, synced_at=?, sync_attempts=sync_attempts
       WHERE id IN (${placeholders})`,
      [Date.now(), ...ids],
    );
  }

  /**
   * PURGE — deletes all synced=1 records.
   * ONLY call this after receiving confirmed server ACK.
   * Never call on synced=0 records.
   */
  static async purgeSynced(): Promise<number> {
    const db = DatabaseManager.getInstance().getDb();
    const [countResult] = await db.executeSql(
      `SELECT COUNT(*) as c FROM attendance_records WHERE synced = 1`,
    );
    const count = countResult.rows.item(0).c;
    await db.executeSql(`DELETE FROM attendance_records WHERE synced = 1`);
    return count;
  }

  static async incrementRetries(ids: string[]): Promise<void> {
    const db = DatabaseManager.getInstance().getDb();
    const placeholders = ids.map(() => "?").join(",");
    await db.executeSql(
      `UPDATE attendance_records
       SET sync_attempts = sync_attempts + 1,
           synced = CASE WHEN sync_attempts + 1 >= ${Constants.SYNC_MAX_RETRIES} THEN 2 ELSE 0 END
       WHERE id IN (${placeholders})`,
      ids,
    );
  }

  static async hasDuplicate(personId: string): Promise<boolean> {
    const db = DatabaseManager.getInstance().getDb();
    const since = Date.now() - Constants.DUPLICATE_WINDOW_MS;
    const [r] = await db.executeSql(
      `SELECT 1 FROM attendance_records WHERE person_id = ? AND timestamp > ? LIMIT 1`,
      [personId, since],
    );
    return r.rows.length > 0;
  }

  static async getPendingCount(): Promise<number> {
    const db = DatabaseManager.getInstance().getDb();
    const [r] = await db.executeSql(
      `SELECT COUNT(*) as c FROM attendance_records WHERE synced = 0`,
    );
    return r.rows.item(0).c;
  }

  static async getRecent(limit = 50): Promise<AttendanceRecord[]> {
    const db = DatabaseManager.getInstance().getDb();
    const [result] = await db.executeSql(
      `SELECT * FROM attendance_records ORDER BY timestamp DESC LIMIT ?`,
      [limit],
    );
    return Array.from({ length: result.rows.length }, (_, i) => {
      const r = result.rows.item(i);
      return {
        ...r,
        livenessPassed: !!r.liveness_passed,
        challengesCompleted: JSON.parse(r.challenges_completed),
      };
    });
  }
}
