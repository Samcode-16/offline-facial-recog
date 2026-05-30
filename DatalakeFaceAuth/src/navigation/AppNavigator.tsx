import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/Navigation";
import HomeScreen from "../screens/HomeScreen";
import AuthenticationScreen from "../screens/AuthenticationScreen";
import EnrollmentScreen from "../screens/EnrollmentScreen";
import AttendanceListScreen from "../screens/AttendanceListScreen";
import SyncStatusScreen from "../screens/SyncStatusScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        cardStyle: { backgroundColor: "#fff" },
      }}
    >
      {/* Home screen as initial route */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Authentication flow */}
      <Stack.Screen
        name="Authenticate"
        component={AuthenticationScreen}
        options={{ title: "Mark Attendance" }}
      />

      {/* Enrollment flow */}
      <Stack.Screen
        name="Enroll"
        component={EnrollmentScreen}
        options={{ title: "Register Face" }}
      />

      {/* Attendance list screen */}
      <Stack.Screen
        name="AttendanceList"
        component={AttendanceListScreen}
        options={{ title: "Attendance Records" }}
      />

      {/* Sync status screen */}
      <Stack.Screen
        name="SyncStatus"
        component={SyncStatusScreen}
        options={{ title: "Sync Status" }}
      />

      {/* Settings screen */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
}
