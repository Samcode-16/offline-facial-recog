import S3 from "aws-sdk/clients/s3";
import Config from "react-native-config";
import { AttendanceRecord } from "../types/Attendance";

/**
 * Uploads a batch of attendance records to S3.
 * S3 path: attendance/{device_id}/{YYYY-MM-DD}/{batch_id}.json
 *
 * IAM permission needed: s3:PutObject only.
 * Never grant s3:GetObject or s3:DeleteObject to the mobile credential.
 *
 * Returns the ETag from S3 as the server acknowledgment ID.
 * ONLY mark records as synced after receiving a successful ETag.
 */
export class S3Uploader {
  private s3 = new S3({
    region: Config.AWS_REGION,
    accessKeyId: Config.AWS_ACCESS_KEY_ID,
    secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
  });

  async uploadBatch(
    batchId: string,
    deviceId: string,
    records: AttendanceRecord[],
  ): Promise<{ success: boolean; ackId?: string; error?: string }> {
    const date = new Date().toISOString().slice(0, 10);
    const key = `attendance/${deviceId}/${date}/${batchId}.json`;

    const body = JSON.stringify({
      batch_id: batchId,
      device_id: deviceId,
      uploaded_at: new Date().toISOString(),
      records_count: records.length,
      records,
    });

    try {
      const result = await this.s3
        .putObject({
          Bucket: Config.AWS_S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: "application/json",
          ServerSideEncryption: "AES256",
        })
        .promise();

      return { success: true, ackId: result.ETag ?? batchId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
