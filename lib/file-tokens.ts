import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile, unlink, readdir, stat } from "fs/promises";
import { join } from "path";
import fs from "fs";
import {
  createFileToken,
  getFileTokenByToken,
  deleteExpiredTokens,
} from "@/data/file-token";

// Configuration
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const STORAGE_DIR = join(process.cwd(), "storage", "files");
const TOKEN_EXPIRY_MINUTES = 15; // 15 minutes

// Ensure storage directories exist
export async function ensureStorageDirs() {
  try {
    // Ensure both storage directories exist
    await mkdir(UPLOADS_DIR, { recursive: true });
    await mkdir(STORAGE_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error("Failed to initialize storage directories:", error);
    return false;
  }
}

// Find the file in the available storage locations
export async function findFile(fileId: string): Promise<string | null> {
  // First check storage/files
  const storagePath = join(STORAGE_DIR, fileId);
  if (fs.existsSync(storagePath)) {
    return storagePath;
  }

  // Then check public/uploads
  const uploadsPath = join(UPLOADS_DIR, fileId);
  if (fs.existsSync(uploadsPath)) {
    return uploadsPath;
  }

  // File not found in either location
  return null;
}

// Generate a file token using existing token patterns
export async function generateFileToken(
  fileId: string,
  fileName: string,
  fileType: string
) {
  // First check if the file exists in either location
  const filePath = await findFile(fileId);
  if (!filePath) {
    console.warn(`Warning: File ${fileId} not found in any storage location`);
    // We'll continue anyway as the file might be referenced from a URL
  } else {
    console.log(`Found file for token generation at: ${filePath}`);
  }

  // Generate a unique token
  const token = uuidv4();

  // Token expires in 15 minutes
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + TOKEN_EXPIRY_MINUTES);

  // Store the token in the database
  const fileToken = await createFileToken(
    fileId,
    fileName,
    fileType,
    token,
    expires
  );

  if (!fileToken) {
    throw new Error("Failed to create file token");
  }

  // Return download URL and expiry information
  return {
    token: fileToken.token,
    fileId: fileToken.fileId,
    fileName: fileToken.fileName,
    fileType: fileToken.fileType,
    expires: fileToken.expires,
    downloadUrl: `/api/files/download?token=${fileToken.token}`,
  };
}

// Validate a file token
export async function verifyFileToken(token: string) {
  const fileToken = await getFileTokenByToken(token);

  if (!fileToken) {
    return null;
  }

  // Check if token is expired
  const now = new Date();
  if (fileToken.expires < now) {
    return null;
  }

  return fileToken;
}

// Write a temporary file to the storage directory
export async function writeTemporaryFile(
  fileId: string,
  fileData: Buffer,
  fileInfo: { fileName: string; fileType: string }
): Promise<string> {
  await ensureStorageDirs();

  // Create file path - now uses the new storage directory
  const filePath = join(STORAGE_DIR, fileId);

  // Write file to disk
  await writeFile(filePath, fileData);

  return filePath;
}

// Clean up a temporary file
export async function removeTemporaryFile(fileId: string): Promise<boolean> {
  try {
    // Check both storage locations
    const filePath = await findFile(fileId);

    if (filePath) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to remove temporary file ${fileId}:`, error);
    return false;
  }
}

// Cleanup all files in both storage directories and expired tokens
export async function cleanupTemporaryFiles(): Promise<{
  deletedFiles: number;
  deletedTokens: number;
  failed: number;
}> {
  await ensureStorageDirs();

  const result = { deletedFiles: 0, deletedTokens: 0, failed: 0 };

  try {
    // Delete expired tokens from the database
    result.deletedTokens = await deleteExpiredTokens();

    // Process both storage directories
    const directories = [STORAGE_DIR, UPLOADS_DIR];

    for (const directory of directories) {
      // Delete files in the directory
      const files = await readdir(directory);

      for (const file of files) {
        try {
          const filePath = join(directory, file);
          const fileStat = await stat(filePath);

          // Skip directories
          if (fileStat.isDirectory()) continue;

          // Delete the file
          await unlink(filePath);
          result.deletedFiles++;
        } catch (error) {
          result.failed++;
          console.error(`Failed to delete file ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error during temporary files cleanup:", error);
  }

  return result;
}
