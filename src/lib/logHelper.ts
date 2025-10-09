import { saveLogs } from "../services/actions/logs";
import { v4 as uuidv4 } from "uuid";

/**
 * Logs user activity (QRscan, capture, share, etc.)
 * Always sends: user, type, timestamp
 */
export async function logEvent(type: string) {
  try {
    let userData = localStorage.getItem("user");
    let userId: string | null = null;

    if (userData) {
      userData = JSON.parse(userData);
      userId = (userData as any)?.id;
    }

    // If no user exists, use or create a UUID
    if (!userId) {
      let tempUserId = localStorage.getItem("tempUserId");
      if (!tempUserId) {
        tempUserId = uuidv4();
        localStorage.setItem("tempUserId", tempUserId);
      }
      userId = tempUserId;
    }

    const logData = {
      user: userId,
      type,
      timestamp: new Date().toISOString(),
    };

    await saveLogs(logData);
    console.log(`✅ Logged ${type}:`, logData);
  } catch (error) {
    console.error(`❌ Failed to log ${type}:`, error);
  }
}
