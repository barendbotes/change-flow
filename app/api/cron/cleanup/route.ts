import { NextRequest, NextResponse } from "next/server";
import { cleanupTempFiles } from "@/lib/file-storage";
import { deleteExpiredTokens } from "@/data/file-token";
import fs from "fs";
import path from "path";
import { unlink } from "fs/promises";

// Simple API key validation - in production, use a more secure approach
const validateApiKey = (apiKey: string | null) => {
  const validApiKey = process.env.CRON_SECRET;
  return apiKey === validApiKey && validApiKey !== undefined;
};

// Force delete all files in uploads directory
async function forceCleanUploads(): Promise<number> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  let deleted = 0;

  try {
    // Read all files in the uploads directory
    const files = fs.readdirSync(uploadsDir);

    // Delete each file
    for (const file of files) {
      try {
        const filePath = path.join(uploadsDir, file);

        // Skip directories
        if (fs.statSync(filePath).isDirectory()) continue;

        // Delete the file
        await unlink(filePath);
        deleted++;
        console.log(`Deleted file: ${filePath}`);
      } catch (err) {
        console.error(`Failed to delete file ${file}:`, err);
      }
    }

    return deleted;
  } catch (err) {
    console.error("Error cleaning uploads directory:", err);
    return 0;
  }
}

// This endpoint is designed to be called by a cron job service
export async function GET(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader ? authHeader.replace("Bearer ", "") : null;

    // Get force parameter
    const forceClean = request.nextUrl.searchParams.get("force") === "true";

    // Validate API key
    if (!validateApiKey(apiKey)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let deletedFiles = 0;

    if (forceClean) {
      console.log("Force cleaning all temporary files");
      deletedFiles = await forceCleanUploads();
    } else {
      // Run file cleanup for temporary files based on age
      const result = await cleanupTempFiles();
      deletedFiles = result.deleted;
    }

    // Delete expired tokens from database
    const deletedTokens = await deleteExpiredTokens();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deletedFiles} files and ${deletedTokens} tokens deleted`,
      details: {
        deletedFiles,
        deletedTokens,
        forceClean,
      },
    });
  } catch (error) {
    console.error("Error during cron cleanup:", error);
    return NextResponse.json(
      { error: "Failed to execute cleanup" },
      { status: 500 }
    );
  }
}
