import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

/**
 * ProgressRing displays a circular progress indicator
 * for countdown timers during liveness challenges.
 * Shows remaining time as a rotating circle.
 */

interface ProgressRingProps {
  totalMs: number;
  remainingMs: number;
  size?: number;
  color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  totalMs,
  remainingMs,
  size = 100,
  color = "#4CAF50",
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - remainingMs / totalMs;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    // Animate rotation for visual feedback
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: totalMs,
        useNativeDriver: false,
      }),
    ).start();

    return () => rotateAnim.setValue(0);
  }, [totalMs, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={2}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

// SVG components fallback (using React Native shapes)
const Svg: React.FC<any> = ({ children, width, height, viewBox }) => (
  <View
    style={{
      width,
      height,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </View>
);

const Circle: React.FC<any> = () => null;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
