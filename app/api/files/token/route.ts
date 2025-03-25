import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { generateFileToken } from "@/lib/file-tokens";
import { db } from "@/lib/db";
import { requests } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

// Helper to extract filename from a URL
function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;

  // URL format is typically /uploads/[uuid].[ext]
  // Extract the UUID part with extension
  const matches = url.match(/\/uploads\/([^?]+)/);
  return matches && matches[1] ? matches[1] : null;
}

// Token generation endpoint
export async function POST(request: NextRequest) {
  try {
    console.log("Token generation request received");

    // Authentication check
    const user = await currentUser();
    if (!user) {
      console.log("Unauthorized token request - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file data from request body
    const body = await request.json();
    console.log("Token request body:", body);

    let { fileId, fileName, fileType, requestId } = body;

    if (!fileId) {
      console.log("Missing fileId in token request");
      if (requestId) {
        console.log("Using requestId as fileId:", requestId);
        fileId = requestId;
      } else {
        return NextResponse.json(
          { error: "File ID is required" },
          { status: 400 }
        );
      }
    }

    if (!fileName) {
      console.log("Missing fileName in token request");
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    // If this is a request, try to look up the actual file from the attachments
    if (requestId) {
      console.log("Looking up request attachments for request:", requestId);
      const request = await db.query.requests.findFirst({
        where: eq(requests.id, requestId),
        with: {
          attachments: true,
        },
      });

      if (request?.attachments.length) {
        console.log("Found attachments for request");

        // Try to find a matching attachment by name
        const attachment = request.attachments.find((a) => {
          return a.fileName === fileName;
        });

        if (attachment) {
          console.log("Found matching attachment:", attachment);
          // If attachment has a file URL, extract the filename
          const url = attachment.fileUrl;

          if (url) {
            const extractedFilename = extractFilenameFromUrl(url);
            if (extractedFilename) {
              console.log(
                "Using file ID from attachment URL:",
                extractedFilename
              );
              // Use the UUID part as the file ID
              fileId = extractedFilename;
            }
          }
        }
      }
    }

    // Check if a file with this ID exists in the storage directory
    const STORAGE_DIR = path.join(process.cwd(), "storage", "files");
    const storageFilePath = path.join(STORAGE_DIR, fileId);
    const storagePathExists = fs.existsSync(storageFilePath);

    console.log(
      `Checking if file exists in storage: ${storageFilePath} - ${
        storagePathExists ? "YES" : "NO"
      }`
    );

    // Generate token
    console.log("Generating token for:", { fileId, fileName, fileType });
    const tokenData = await generateFileToken(
      fileId,
      fileName,
      fileType || "application/octet-stream"
    );
    console.log("Token generated:", tokenData);

    // Return token data
    return NextResponse.json({
      token: tokenData.token,
      expires: tokenData.expires,
      downloadUrl: tokenData.downloadUrl,
    });
  } catch (error) {
    console.error("Error generating file token:", error);
    return NextResponse.json(
      { error: "Failed to generate file token" },
      { status: 500 }
    );
  }
}
