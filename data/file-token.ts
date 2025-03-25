import { db } from "@/lib/db";
import { fileTokens } from "@/schemas/schema";
import { eq, lt, and, SQL } from "drizzle-orm";

export const getFileTokenByToken = async (token: string) => {
  try {
    const fileToken = await db.query.fileTokens.findFirst({
      where: eq(fileTokens.token, token),
    });

    return fileToken;
  } catch (error) {
    console.error("Error fetching file token:", error);
    return null;
  }
};

export const getFileTokenByFileId = async (fileId: string) => {
  try {
    // Get valid tokens (not expired)
    const now = new Date();

    const fileToken = await db.query.fileTokens.findFirst({
      where: and(eq(fileTokens.fileId, fileId), lt(fileTokens.expires, now)),
      orderBy: [fileTokens.createdAt],
    });

    return fileToken;
  } catch (error) {
    console.error("Error fetching file token by file ID:", error);
    return null;
  }
};

export const createFileToken = async (
  fileId: string,
  fileName: string,
  fileType: string,
  token: string,
  expiryDate: Date
) => {
  try {
    const [fileToken] = await db
      .insert(fileTokens)
      .values({
        token,
        fileId,
        fileName,
        fileType,
        expires: expiryDate,
      })
      .returning();

    return fileToken;
  } catch (error) {
    console.error("Error creating file token:", error);
    return null;
  }
};

export const deleteExpiredTokens = async () => {
  try {
    const now = new Date();
    const deleted = await db
      .delete(fileTokens)
      .where(lt(fileTokens.expires, now))
      .returning();

    return deleted.length;
  } catch (error) {
    console.error("Error deleting expired tokens:", error);
    return 0;
  }
};
