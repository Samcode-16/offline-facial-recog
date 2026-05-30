import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./navigation/AppNavigator";
import { DatabaseManager } from "./database/DatabaseManager";
import { EmbeddingCache } from "./core/EmbeddingCache";
import { NetworkMonitor } from "./sync/NetworkMonitor";
import { SyncManager } from "./sync/SyncManager";
import { SecurityUtils } from "./utils/SecurityUtils";

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await SecurityUtils.getOrCreateEncryptionKey();
        await DatabaseManager.getInstance().initialize();
        await EmbeddingCache.getInstance().loadAll();
        NetworkMonitor.getInstance().start(async () => {
          await SyncManager.getInstance().startSync();
        });
        setReady(true);
      } catch (e: any) {
        setError(e.message);
      }
    })();

    return () => NetworkMonitor.getInstance().stop();
  }, []);

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Startup failed: {error}</Text>
      </View>
    );

  if (!ready)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.label}>Initializing...</Text>
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  error: { color: "red", padding: 24, textAlign: "center" },
  label: { marginTop: 12, color: "#555" },
});
