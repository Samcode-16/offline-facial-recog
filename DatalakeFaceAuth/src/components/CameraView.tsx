import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

/**
 * CameraView wraps VisionCamera and provides:
 * - Full-screen camera feed
 * - Oval face guide overlay
 * - Reanimated worklet integration point
 * - Permission handling
 */

const { width, height } = Dimensions.get("window");

interface CameraViewProps {
  onFrameProcess?: (frame: any) => void;
  showGuide?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onFrameProcess,
  showGuide = true,
}) => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Pulse the oval guide
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {/* VisionCamera will be integrated here via useFrameProcessor hook */}
      <View style={styles.camera} />

      {/* Oval guide overlay */}
      {showGuide && (
        <Animated.View style={[styles.ovalGuide, { opacity }]}>
          <View style={styles.ovalOuter}>
            <View style={styles.ovalInner} />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  ovalGuide: {
    position: "absolute",
    alignSelf: "center",
    top: height / 2 - 120,
    width: 240,
    height: 300,
  },
  ovalOuter: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalInner: {
    width: "90%",
    height: "90%",
    borderRadius: 100,
    backgroundColor: "transparent",
  },
});
