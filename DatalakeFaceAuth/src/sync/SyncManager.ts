import { v4 as uuidv4 } from "react-native-uuid";
import { AttendanceRepository } from "../database/AttendanceRepository";
import { S3Uploader } from "./S3Uploader";
import { SecurityUtils } from "../utils/SecurityUtils";

/**
 * Orchestrates sync and purge lifecycle.
 *
 * INVARIANT: Records are NEVER deleted unless the server returns a confirmed ACK.
 * If upload fails at any point, records stay in SQLite with synced=0 for retry.
 * The mutex flag prevents concurrent syncs.
 */
export class SyncManager {
  private static _instance: SyncManager;
  private syncing = false;
  private uploader = new S3Uploader();

  static getInstance(): SyncManager {
    if (!SyncManager._instance) SyncManager._instance = new SyncManager();
    return SyncManager._instance;
  }

  async startSync(): Promise<{
    synced: number;
    purged: number;
    status: string;
  }> {
    if (this.syncing)
      return { synced: 0, purged: 0, status: "ALREADY_RUNNING" };
    this.syncing = true;

    try {
      const pending = await AttendanceRepository.getPending();
      if (pending.length === 0)
        return { synced: 0, purged: 0, status: "NOTHING_TO_SYNC" };

      const batchId = uuidv4() as string;
      const deviceId = await SecurityUtils.getDeviceId();
      const result = await this.uploader.uploadBatch(
        batchId,
        deviceId,
        pending,
      );

      if (result.success && result.ackId) {
        await AttendanceRepository.markSynced(
          pending.map((r) => r.id),
          result.ackId,
        );
        const purged = await AttendanceRepository.purgeSynced();
        return { synced: pending.length, purged, status: "SUCCESS" };
      } else {
        await AttendanceRepository.incrementRetries(pending.map((r) => r.id));
        return { synced: 0, purged: 0, status: `FAILED: ${result.error}` };
      }
    } finally {
      this.syncing = false;
    }
  }
}
