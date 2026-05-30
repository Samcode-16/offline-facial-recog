import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { BoundingBox, Keypoint } from "../types/Face";

/**
 * FaceOverlay renders:
 * - Bounding box around detected face
 * - Facial landmarks (eyes, nose, mouth)
 * - State-based visual feedback (green for valid, red for invalid)
 */

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface FaceOverlayProps {
  boundingBox?: BoundingBox | null;
  landmarks?: Keypoint[] | null;
  isValid?: boolean;
  showLandmarks?: boolean;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  boundingBox,
  landmarks,
  isValid = true,
  showLandmarks = true,
}) => {
  if (!boundingBox) return null;

  const boxColor = isValid ? "#4CAF50" : "#FF5252";

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Bounding box */}
      <View
        style={[
          styles.boundingBox,
          {
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            borderColor: boxColor,
          },
        ]}
      />

      {/* Landmarks */}
      {showLandmarks &&
        landmarks?.map((landmark, idx) => (
          <View
            key={idx}
            style={[
              styles.landmark,
              {
                left: landmark.x - 3,
                top: landmark.y - 3,
                backgroundColor: boxColor,
              },
            ]}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: screenWidth,
    height: screenHeight,
    backgroundColor: "transparent",
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 8,
  },
  landmark: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
