import { useEffect, useState, useCallback } from "react";
import { AttendanceRepository } from "../database/AttendanceRepository";
import { SyncManager } from "../sync/SyncManager";

/**
 * Polls SQLite every 5 seconds for pending record count.
 * Returns { pendingCount, lastSyncTime, isSyncing }.
 * Used by SyncBadge and SyncStatusScreen.
 */
export function useSyncStatus(): {
  pendingCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
} {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll for pending records
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollPendingCount = async () => {
      try {
        const count = await AttendanceRepository.getPendingCount();
        setPendingCount(count);
      } catch (err) {
        console.error("[useSyncStatus] Error polling pending count:", err);
      }
    };

    // Initial poll
    pollPendingCount();

    // Set up polling interval (every 5 seconds)
    pollInterval = setInterval(pollPendingCount, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await SyncManager.getInstance().startSync();
      console.log("[useSyncStatus] Sync result:", result);

      // Update last sync time and pending count
      setLastSyncTime(Date.now());

      // Re-poll pending count after sync
      const count = await AttendanceRepository.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error("[useSyncStatus] Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return {
    pendingCount,
    lastSyncTime,
    isSyncing,
    triggerSync,
  };
}
