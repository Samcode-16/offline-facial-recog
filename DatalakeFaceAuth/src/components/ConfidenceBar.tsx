import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * ConfidenceBar displays:
 * - Face recognition confidence score (0-1)
 * - Visual bar fill indicating confidence level
 * - Color-coded feedback (red: low, yellow: medium, green: high)
 * - Used in AuthenticationScreen and AttendanceListScreen
 */

interface ConfidenceBarProps {
  confidence: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  label = "Confidence",
  showPercentage = true,
}) => {
  // Clamp confidence to 0-1
  const clampedConfidence = Math.max(0, Math.min(1, confidence));
  const percentage = Math.round(clampedConfidence * 100);

  // Color based on confidence level
  let barColor = "#F44336"; // Red: low
  if (clampedConfidence >= 0.65) {
    barColor = "#4CAF50"; // Green: high (match threshold)
  } else if (clampedConfidence >= 0.45) {
    barColor = "#FF9800"; // Orange: medium (uncertain zone)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showPercentage && <Text style={styles.percentage}>{percentage}%</Text>}
      </View>

      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Threshold indicators */}
      <View style={styles.thresholds}>
        <View style={styles.threshold}>
          <Text style={styles.thresholdLabel}>Reject</Text>
          <Text style={styles.thresholdValue}>0.45</Text>
        </View>
        <View style={styles.threshold}>
          <Text style={styles.thresholdLabel}>Match</Text>
          <Text style={styles.thresholdValue}>0.65</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  percentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
  barContainer: {
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  thresholds: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  threshold: {
    alignItems: "center",
  },
  thresholdLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  thresholdValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#666",
  },
});
