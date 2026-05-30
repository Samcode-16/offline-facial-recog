import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Enroll">;

export default function EnrollmentScreen({}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enrollment Screen</Text>
      <Text style={styles.note}>
        Face enrollment with 5 captures will be implemented here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  note: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
