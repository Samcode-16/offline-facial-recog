import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DatalakeFaceAuth</Text>
      <Text style={styles.subtitle}>Face Recognition Attendance System</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Authenticate")}
      >
        <Text style={styles.buttonText}>Mark Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Enroll")}
      >
        <Text style={styles.buttonText}>Register Face</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("AttendanceList")}
      >
        <Text style={styles.secondaryButtonText}>View Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("SyncStatus")}
      >
        <Text style={styles.secondaryButtonText}>Sync Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("Settings")}
      >
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
