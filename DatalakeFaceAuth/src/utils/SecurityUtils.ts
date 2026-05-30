import EncryptedStorage from "react-native-encrypted-storage";
import Aes from "react-native-aes-crypto";
import { v4 as uuidv4 } from "react-native-uuid";

const KEY_ALIAS = "faceauth_aes_key";
const IV_ALIAS = "faceauth_aes_iv";

export class SecurityUtils {
  /**
   * Returns the AES-256 key from encrypted storage.
   * On first run, generates a random key and stores it securely.
   * The key lives in iOS Keychain / Android Keystore via react-native-encrypted-storage.
   */
  static async getOrCreateEncryptionKey(): Promise<{
    key: string;
    iv: string;
  }> {
    try {
      const existing = await EncryptedStorage.getItem(KEY_ALIAS);
      const existingIv = await EncryptedStorage.getItem(IV_ALIAS);
      if (existing && existingIv) return { key: existing, iv: existingIv };
    } catch {}

    const key = await Aes.randomKey(32); // 256-bit
    const iv = await Aes.randomKey(16); // 128-bit IV
    await EncryptedStorage.setItem(KEY_ALIAS, key);
    await EncryptedStorage.setItem(IV_ALIAS, iv);
    return { key, iv };
  }

  static async encryptEmbedding(b64Embedding: string): Promise<string> {
    const { key, iv } = await SecurityUtils.getOrCreateEncryptionKey();
    return Aes.encrypt(b64Embedding, key, iv, "aes-256-cbc");
  }

  static async decryptEmbedding(cipher: string): Promise<string> {
    const { key, iv } = await SecurityUtils.getOrCreateEncryptionKey();
    return Aes.decrypt(cipher, key, iv, "aes-256-cbc");
  }

  static generateSessionToken(): string {
    return uuidv4() as string;
  }

  static async getDeviceId(): Promise<string> {
    const DEVICE_ID_KEY = "faceauth_device_id";
    let id = await EncryptedStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4() as string;
      await EncryptedStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }
}
