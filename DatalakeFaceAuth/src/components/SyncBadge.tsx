import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * SyncBadge displays:
 * - Count of pending (unsynced) attendance records
 * - Sync status indicator (online/offline/syncing)
 * - Used in HomeScreen and as a badge in navigation header
 */

interface SyncBadgeProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing?: boolean;
  size?: "small" | "medium" | "large";
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({
  pendingCount,
  isOnline,
  isSyncing = false,
  size = "medium",
}) => {
  if (pendingCount === 0 && !isSyncing) return null;

  const sizeStyles = {
    small: {
      badge: { width: 40, height: 40, borderRadius: 20 },
      text: { fontSize: 12 },
      indicator: { width: 8, height: 8 },
    },
    medium: {
      badge: { width: 50, height: 50, borderRadius: 25 },
      text: { fontSize: 14 },
      indicator: { width: 10, height: 10 },
    },
    large: {
      badge: { width: 60, height: 60, borderRadius: 30 },
      text: { fontSize: 16 },
      indicator: { width: 12, height: 12 },
    },
  };

  const currentSize = sizeStyles[size];
  const backgroundColor = isSyncing
    ? "#FF9800"
    : isOnline
      ? "#4CAF50"
      : "#F44336";
  const statusText = isSyncing ? "Syncing..." : isOnline ? "Online" : "Offline";

  return (
    <View style={styles.container}>
      <View style={[styles.badge, currentSize.badge, { backgroundColor }]}>
        <Text style={[styles.badgeText, currentSize.text]}>
          {isSyncing ? "↻" : pendingCount}
        </Text>
      </View>

      {/* Status indicator dot */}
      <View
        style={[
          styles.indicator,
          currentSize.indicator,
          {
            backgroundColor: isSyncing
              ? "#FF9800"
              : isOnline
                ? "#4CAF50"
                : "#F44336",
          },
        ]}
      />

      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  badge: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  indicator: {
    borderRadius: 50,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
});
