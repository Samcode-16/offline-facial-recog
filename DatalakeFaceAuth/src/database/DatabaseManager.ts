import SQLite from "react-native-sqlite-storage";
import { CREATE_TABLES_SQL } from "./schemas";
import { Constants } from "../utils/Constants";

SQLite.enablePromise(true);

export class DatabaseManager {
  private static _instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager._instance)
      DatabaseManager._instance = new DatabaseManager();
    return DatabaseManager._instance;
  }

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: Constants.DB_NAME,
      location: "default",
    });
    await this.db.executeSql(CREATE_TABLES_SQL);
  }

  getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error("DB not initialized");
    return this.db;
  }
}
