import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachments } from "@/schemas/schema";
import { storeFile } from "@/lib/file-storage";

// Function to handle file uploads
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Store the file using our new file storage system
    const fileMetadata = await storeFile(file);

    // Store file metadata in the attachments table
    try {
      const [attachment] = await db
        .insert(attachments)
        .values({
          requestId: requestId,
          fileName: fileMetadata.originalName,
          fileUrl: fileMetadata.url,
          fileSize: fileMetadata.size.toString(),
          fileType: fileMetadata.type,
        })
        .returning();

      // Return the URL and file info
      return NextResponse.json({
        url: fileMetadata.url,
        name: fileMetadata.originalName,
        size: fileMetadata.size,
        type: fileMetadata.type,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to store file metadata in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
