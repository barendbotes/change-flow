import { mkdir, writeFile, unlink, readdir, stat, copyFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Configuration
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const STORAGE_DIR = join(process.cwd(), "storage", "files"); // Permanent storage outside public
const MAX_FILE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours for temp files

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  size: number;
  type: string;
  path: string;
  url: string;
  createdAt: Date;
}

// Initialize storage directories
export async function initStorage() {
  try {
    console.log("Initializing storage directories");
    console.log("- Creating permanent storage at:", STORAGE_DIR);
    // Create permanent storage directory
    await mkdir(STORAGE_DIR, { recursive: true });

    console.log("- Creating temporary uploads at:", UPLOADS_DIR);
    // Create temporary uploads directory
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Set permissions
    try {
      if (process.platform !== "win32") {
        // Skip on Windows
        console.log("- Setting directory permissions");
        const { exec } = require("child_process");
        exec(`chmod 755 ${STORAGE_DIR}`);
        exec(`chmod 755 ${UPLOADS_DIR}`);
      }
    } catch (err) {
      console.warn("Could not set directory permissions:", err);
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize file storage:", error);
    return false;
  }
}

// Store a file permanently
export async function storeFile(file: File): Promise<FileMetadata> {
  await initStorage();

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const id = uuidv4();
  const originalName = file.name;
  const extension = originalName.split(".").pop() || "";
  const fileName = `${id}.${extension}`;

  // Store in permanent location
  const permanentPath = join(STORAGE_DIR, fileName);
  await writeFile(permanentPath, buffer);

  // Create URL path for accessing the file
  const urlPath = `/uploads/${fileName}`;

  // Copy to public uploads for immediate access
  const publicPath = join(UPLOADS_DIR, fileName);
  await writeFile(publicPath, buffer);

  return {
    id,
    originalName,
    fileName,
    size: file.size,
    type: file.type,
    path: permanentPath,
    url: urlPath,
    createdAt: new Date(),
  };
}

// Retrieve a file from permanent storage (or copy it to temp location)
export async function retrieveFile(fileName: string): Promise<Buffer | null> {
  await initStorage();

  console.log(`Retrieving file: ${fileName}`);

  // Check if file exists in permanent storage
  const permanentPath = join(STORAGE_DIR, fileName);
  console.log(`- Checking permanent path: ${permanentPath}`);

  try {
    // Check if the permanent file exists
    if (!fs.existsSync(permanentPath)) {
      console.log("- File not found in permanent storage");
      return null;
    }

    console.log("- File found in permanent storage, reading");
    // Read file from permanent storage
    const fileBuffer = await fs.promises.readFile(permanentPath);

    // Copy to temporary public directory for web access
    const tempPath = join(UPLOADS_DIR, fileName);
    console.log(`- Writing to temporary path: ${tempPath}`);
    await writeFile(tempPath, fileBuffer);

    return fileBuffer;
  } catch (error) {
    console.error(`Failed to retrieve file ${fileName}:`, error);
    return null;
  }
}

// Delete only from temporary uploads (not permanent storage)
export async function deleteTempFile(fileName: string): Promise<boolean> {
  try {
    const tempPath = join(UPLOADS_DIR, fileName);

    if (fs.existsSync(tempPath)) {
      await unlink(tempPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete temporary file ${fileName}:`, error);
    return false;
  }
}

// Permanently delete a file from both locations
export async function deleteFile(fileName: string): Promise<boolean> {
  try {
    // Delete from permanent storage if exists
    const permanentPath = join(STORAGE_DIR, fileName);
    if (fs.existsSync(permanentPath)) {
      await unlink(permanentPath);
    }

    // Also delete from temporary uploads if exists
    await deleteTempFile(fileName);

    return true;
  } catch (error) {
    console.error(`Failed to delete file ${fileName}:`, error);
    return false;
  }
}

// Clean up temporary files only (not permanent storage)
export async function cleanupTempFiles(): Promise<{
  deleted: number;
  failed: number;
}> {
  await initStorage();

  const result = { deleted: 0, failed: 0 };
  const now = Date.now();

  try {
    const files = await readdir(UPLOADS_DIR);

    for (const file of files) {
      try {
        const filePath = join(UPLOADS_DIR, file);
        const fileStat = await stat(filePath);

        // Skip directories
        if (fileStat.isDirectory()) continue;

        // Check file age for cleanup
        const fileAge = now - fileStat.mtime.getTime();
        if (fileAge > MAX_FILE_AGE_MS) {
          await unlink(filePath);
          result.deleted++;
        }
      } catch (error) {
        result.failed++;
        console.error(`Failed to process temp file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error("Error during temporary files cleanup:", error);
  }

  return result;
}
