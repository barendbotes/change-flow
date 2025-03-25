import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requests, attachments } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for attachment updates
const updateAttachmentsSchema = z.object({
  attachments: z.array(
    z.object({
      fileName: z.string(),
      fileUrl: z.string(),
      fileSize: z.string(),
      fileType: z.string(),
    })
  ),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validatedData = updateAttachmentsSchema.parse(body);

    // Get the request to verify ownership
    const request = await db.query.requests.findFirst({
      where: eq(requests.id, params.requestId),
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // Verify that the user is the owner or an admin
    const isAdmin = user.roles?.some(
      (role) => role.name.toLowerCase() === "admin"
    );

    if (request.userId !== user.id && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Insert new attachments
    for (const attachment of validatedData.attachments) {
      await db.insert(attachments).values({
        requestId: params.requestId,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
      });
    }

    // Update the request's updatedAt timestamp
    await db
      .update(requests)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(requests.id, params.requestId));

    return NextResponse.json({
      message: "Request updated with attachments",
    });
  } catch (error) {
    console.error("[CHANGE_REQUEST_UPDATE]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
