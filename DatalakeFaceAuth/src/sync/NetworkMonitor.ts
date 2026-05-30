import NetInfo from "@react-native-community/netinfo";

export class NetworkMonitor {
  private static _instance: NetworkMonitor;
  private unsub: (() => void) | null = null;
  private offline = false;

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor._instance)
      NetworkMonitor._instance = new NetworkMonitor();
    return NetworkMonitor._instance;
  }

  start(onRestored: () => void): void {
    this.unsub = NetInfo.addEventListener((state) => {
      const connected = !!(state.isConnected && state.isInternetReachable);
      if (connected && this.offline) {
        this.offline = false;
        onRestored();
      } else if (!connected) {
        this.offline = true;
      }
    });
  }

  stop(): void {
    this.unsub?.();
  }

  async isOnline(): Promise<boolean> {
    const s = await NetInfo.fetch();
    return !!(s.isConnected && s.isInternetReachable);
  }
}
