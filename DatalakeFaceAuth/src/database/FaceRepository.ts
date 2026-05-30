import { v4 as uuidv4 } from "react-native-uuid";
import { DatabaseManager } from "./DatabaseManager";
import { EnrolledPerson, FaceEmbedding } from "../types/Face";

export class FaceRepository {
  static async insertPerson(p: Omit<EnrolledPerson, "id">): Promise<string> {
    const id = uuidv4() as string;
    const db = DatabaseManager.getInstance().getDb();
    await db.executeSql(
      `INSERT INTO enrolled_persons (id,name,employee_id,department,enrolled_at,is_active)
       VALUES (?,?,?,?,?,1)`,
      [id, p.name, p.employeeId, p.department ?? null, Date.now()],
    );
    return id;
  }

  static async insertEmbedding(e: Omit<FaceEmbedding, "id">): Promise<void> {
    const db = DatabaseManager.getInstance().getDb();
    await db.executeSql(
      `INSERT INTO face_embeddings (id,person_id,embedding,lighting_condition,created_at)
       VALUES (?,?,?,?,?)`,
      [uuidv4(), e.personId, e.embedding, e.lightingCondition, Date.now()],
    );
    await db.executeSql(
      `UPDATE enrolled_persons SET embedding_count = embedding_count + 1 WHERE id = ?`,
      [e.personId],
    );
  }

  static async getAllEmbeddingsWithPersons(): Promise<
    Array<{ personId: string; person: EnrolledPerson; embedding: string }>
  > {
    const db = DatabaseManager.getInstance().getDb();
    const [result] = await db.executeSql(
      `SELECT fe.person_id, fe.embedding,
              ep.id, ep.name, ep.employee_id, ep.department, ep.enrolled_at, ep.is_active
       FROM face_embeddings fe
       JOIN enrolled_persons ep ON fe.person_id = ep.id
       WHERE ep.is_active = 1`,
    );
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      const r = result.rows.item(i);
      rows.push({
        personId: r.person_id,
        embedding: r.embedding,
        person: {
          id: r.id,
          name: r.name,
          employeeId: r.employee_id,
          department: r.department,
          enrolledAt: r.enrolled_at,
          isActive: !!r.is_active,
        },
      });
    }
    return rows;
  }

  static async getByEmployeeId(
    employeeId: string,
  ): Promise<EnrolledPerson | null> {
    const db = DatabaseManager.getInstance().getDb();
    const [result] = await db.executeSql(
      `SELECT * FROM enrolled_persons WHERE employee_id = ? LIMIT 1`,
      [employeeId],
    );
    if (result.rows.length === 0) return null;
    const r = result.rows.item(0);
    return {
      id: r.id,
      name: r.name,
      employeeId: r.employee_id,
      department: r.department,
      enrolledAt: r.enrolled_at,
      isActive: !!r.is_active,
    };
  }

  static async deleteEmbeddingsByPersonId(personId: string): Promise<void> {
    const db = DatabaseManager.getInstance().getDb();
    await db.executeSql(`DELETE FROM face_embeddings WHERE person_id = ?`, [
      personId,
    ]);
    await db.executeSql(
      `UPDATE enrolled_persons SET embedding_count = 0 WHERE id = ?`,
      [personId],
    );
  }
}
