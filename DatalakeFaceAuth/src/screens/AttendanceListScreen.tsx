import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AttendanceList">;

export default function AttendanceListScreen({}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Attendance Records</Text>
      <Text style={styles.note}>
        List of attendance records will be shown here
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
