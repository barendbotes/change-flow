import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { verifyFileToken, findFile } from "@/lib/file-tokens";
import { db } from "@/lib/db";
import { attachments, requests } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { readFile } from "fs/promises";
import fs from "fs";

// Map of common extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  csv: "text/csv",
};

// Storage paths
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const STORAGE_DIR = path.join(process.cwd(), "storage", "files");

// Get content type based on file extension
function getContentType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase().substring(1);
  return MIME_TYPES[extension] || "application/octet-stream";
}

// Extract filename from a URL or path
function extractFilename(url: string): string {
  if (!url) return "";

  // Remove query parameters if any
  const urlWithoutParams = url.split("?")[0];

  // Get the part after the last slash
  return urlWithoutParams.split("/").pop() || "";
}

// Helper to check if a file exists in either storage location
async function findFileInStorage(fileName: string): Promise<string | null> {
  // If this is a full filename (with UUID), check in both locations
  const storageFilePath = path.join(STORAGE_DIR, fileName);
  const uploadsFilePath = path.join(UPLOADS_DIR, fileName);

  console.log(`Checking for file in storage locations:
  - Storage: ${storageFilePath}
  - Uploads: ${uploadsFilePath}`);

  if (fs.existsSync(storageFilePath)) {
    console.log("File found in storage directory");
    return storageFilePath;
  }

  if (fs.existsSync(uploadsFilePath)) {
    console.log("File found in uploads directory");
    return uploadsFilePath;
  }

  console.log("File not found in either location");
  return null;
}

// Extract the actual file URL from a request attachment
async function getRequestFileUrl(
  requestId: string,
  fileName: string
): Promise<string | null> {
  console.log(`Looking for file "${fileName}" in request "${requestId}"`);

  try {
    // Get the request with attachments
    const request = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
      with: {
        attachments: true,
      },
    });

    if (!request?.attachments.length) {
      console.log("- No attachments found in request");
      return null;
    }

    console.log("- Found request with attachments");

    // Find matching attachment by name
    const attachment = request.attachments.find((a) => a.fileName === fileName);

    if (!attachment) {
      console.log("- No matching attachment found by name");
      return null;
    }

    console.log("- Found matching attachment:", attachment);

    // Get URL from the attachment
    const fileUrl = attachment.fileUrl;

    if (!fileUrl) {
      console.log("- No URL found in attachment");
      return null;
    }

    console.log("- File URL found:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error getting request file URL:", error);
    return null;
  }
}

// Special handling for file not found - return helpful error
function createFileNotFoundResponse(details: string): NextResponse {
  return NextResponse.json(
    {
      error: "File not found in storage",
      details: details,
      help: "The file may have been deleted or moved. Try re-uploading the file.",
      status: "NOT_FOUND",
    },
    {
      status: 404,
    }
  );
}

// Download file endpoint
export async function GET(request: NextRequest) {
  try {
    console.log("Download request received", request.nextUrl.toString());

    // Authentication check
    const user = await currentUser();
    if (!user) {
      console.log("Unauthorized download request - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get token from query parameter
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      console.log("No token provided in download request");
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // Verify token from database
    console.log("Verifying token:", token);
    const fileToken = await verifyFileToken(token);
    if (!fileToken) {
      console.log("Invalid or expired token for download");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.log("Token verified:", fileToken);
    const { fileId, fileName } = fileToken;

    // Try to find the file directly using the file ID
    console.log("Looking for file by ID:", fileId);
    let filePath = await findFile(fileId);

    // If not found by ID, try using the token filename
    if (!filePath) {
      const tokenFileName = extractFilename(fileName);
      console.log("Looking for file by token filename:", tokenFileName);
      filePath = await findFileInStorage(tokenFileName);
    }

    // If file found in either location, serve it
    if (filePath) {
      console.log("File found, serving from:", filePath);
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": getContentType(fileName),
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    console.log(
      "File not found in storage locations, checking database references"
    );

    // If not found in storage, look for the file in the database
    // First check attachments for change requests
    let attachmentUrl = null;
    let actualFileName = fileName;

    // Try to find the file in change request attachments
    const crFileUrl = await getRequestFileUrl(fileId, fileName);
    if (crFileUrl) {
      attachmentUrl = crFileUrl;
      actualFileName = extractFilename(crFileUrl);
      console.log("Found URL in change request:", {
        attachmentUrl,
        actualFileName,
      });
    }

    // If not found in change requests, try the attachments table
    if (!attachmentUrl) {
      console.log("Checking attachments table for file:", fileId);
      const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, fileId),
        columns: {
          fileUrl: true,
          fileName: true,
        },
      });

      if (attachment) {
        console.log("Found attachment in table:", attachment);
        attachmentUrl = attachment.fileUrl;
        actualFileName = attachment.fileName;
      }
    }

    if (!attachmentUrl) {
      console.log("File not found in database");
      return createFileNotFoundResponse(
        "The requested file could not be found in the database"
      );
    }

    console.log("Attempting to retrieve file with URL:", attachmentUrl);

    // If the URL is a full HTTP URL, redirect to it
    if (attachmentUrl.startsWith("http")) {
      console.log("Redirecting to external URL");
      return NextResponse.redirect(attachmentUrl);
    }

    // For internal URLs, check if the file exists in uploads or storage
    const extractedFilename = extractFilename(attachmentUrl);

    // Try to find the file in storage/files or public/uploads
    const foundPath = await findFileInStorage(extractedFilename);

    if (foundPath) {
      console.log("File found from URL path:", foundPath);
      const fileBuffer = await readFile(foundPath);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": getContentType(actualFileName),
          "Content-Disposition": `attachment; filename="${actualFileName}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    // Handle old-style /uploads/ paths as a fallback
    if (attachmentUrl.startsWith("/uploads/")) {
      console.log("File has uploads path, checking in public folder");
      // File is in the public/uploads directory
      const publicUploadsPath = path.join(
        process.cwd(),
        "public",
        attachmentUrl
      );

      console.log("Checking public path:", publicUploadsPath);

      if (fs.existsSync(publicUploadsPath)) {
        console.log("File found in public uploads");
        const fileBuffer = await readFile(publicUploadsPath);

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": getContentType(actualFileName),
            "Content-Disposition": `attachment; filename="${actualFileName}"`,
            "Content-Length": fileBuffer.length.toString(),
          },
        });
      }
    }

    // File not found in any location
    console.log("File referenced in database but not found in storage");
    return createFileNotFoundResponse(
      "The file was found in the database but is missing from storage"
    );
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
