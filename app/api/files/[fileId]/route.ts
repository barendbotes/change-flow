// This file is no longer needed since files are stored in the /public/uploads directory
// and can be accessed directly via the /uploads path.
// Keep this file as a reference for future use if you implement more complex file storage.

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import { stat } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Get the file ID from the URL parameters
    const fileId = params.fileId;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    console.log(`File request received for: ${fileId}`);

    // Auth check if needed (commented out by default, uncomment if needed)
    // const user = await currentUser();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Check both possible file locations
    const publicUploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      fileId
    );
    const storagePath = path.join(process.cwd(), "storage", "files", fileId);

    // Create a function to check if a file exists
    const fileExists = async (filePath: string) => {
      try {
        const stats = await stat(filePath);
        return stats.isFile();
      } catch {
        return false;
      }
    };

    // Check which location has the file
    const publicFileExists = await fileExists(publicUploadPath);
    const storageFileExists = await fileExists(storagePath);

    console.log(`File locations:
    - Public uploads: ${publicUploadPath} (exists: ${publicFileExists})
    - Storage files: ${storagePath} (exists: ${storageFileExists})`);

    // Determine the path to use
    let filePath;
    if (storageFileExists) {
      filePath = storagePath;
      console.log("Using storage file path");
    } else if (publicFileExists) {
      filePath = publicUploadPath;
      console.log("Using public uploads path");
    } else {
      console.log("File not found in either location");
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const extension = path.extname(fileId).toLowerCase();
    let contentType = "application/octet-stream"; // Default content type

    // Set appropriate content type based on file extension
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };

    if (extension && mimeTypes[extension]) {
      contentType = mimeTypes[extension];
    }

    // Create headers
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${fileId}"`);

    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
