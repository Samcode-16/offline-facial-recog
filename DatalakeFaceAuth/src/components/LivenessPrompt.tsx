import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { ChallengeType } from "../types/Liveness";

/**
 * LivenessPrompt displays:
 * - Current liveness challenge (BLINK, SMILE, TURN_LEFT, TURN_RIGHT)
 * - Countdown timer
 * - Animated visual cues
 */

interface LivenessPromptProps {
  challenge: ChallengeType | null;
  timeRemainingMs: number;
  isActive: boolean;
}

const getChallengeText = (challenge: ChallengeType | null): string => {
  switch (challenge) {
    case "BLINK":
      return "Blink your eyes";
    case "SMILE":
      return "Smile at the camera";
    case "TURN_LEFT":
      return "Turn your head left";
    case "TURN_RIGHT":
      return "Turn your head right";
    default:
      return "";
  }
};

const getChallengeEmoji = (challenge: ChallengeType | null): string => {
  switch (challenge) {
    case "BLINK":
      return "👁️";
    case "SMILE":
      return "😊";
    case "TURN_LEFT":
      return "↖️";
    case "TURN_RIGHT":
      return "↗️";
    default:
      return "👤";
  }
};

export const LivenessPrompt: React.FC<LivenessPromptProps> = ({
  challenge,
  timeRemainingMs,
  isActive,
}) => {
  if (!isActive || !challenge) return null;

  const seconds = Math.ceil(timeRemainingMs / 1000);

  return (
    <View style={styles.container}>
      <View style={styles.promptBox}>
        <Text style={styles.emoji}>{getChallengeEmoji(challenge)}</Text>
        <Text style={styles.promptText}>{getChallengeText(challenge)}</Text>
        <Text style={styles.timer}>{seconds}s</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    alignItems: "center",
    pointerEvents: "none",
  },
  promptBox: {
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  promptText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  timer: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
});
