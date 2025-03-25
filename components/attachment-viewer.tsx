"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface Attachment {
  fileName?: string;
  name?: string;
  fileUrl?: string;
  url?: string;
  id?: string;
  requestId?: string;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
}

export function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  const [loadingAttachments, setLoadingAttachments] = useState<
    Record<string, boolean>
  >({});

  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Helper to handle legacy paths
  const getFixedPath = (url: string): string => {
    if (!url) return url;

    // If it's already a tokenized URL, return as is
    if (url.includes("/api/files/download?token=")) {
      return url;
    }

    // Check if the URL uses the old /uploads/ path pattern
    if (url.includes("/uploads/")) {
      // Extract the filename (UUID.extension) from the path
      const matches = url.match(/\/uploads\/([^?]+)/);
      const filename = matches && matches[1] ? matches[1] : null;

      if (filename) {
        console.log(
          `Translating legacy path ${url} to use storage/files/${filename}`
        );
        // Update to point to the correct API endpoint that will handle the redirection
        return `/api/files/${filename}`;
      }
    }

    return url;
  };

  const handleDownload = async (attachment: Attachment) => {
    const attachmentName = attachment.fileName || attachment.name || "file";
    const attachmentId = attachment.id || "";
    const attachmentUrl = attachment.fileUrl || attachment.url || "";
    const requestId = attachment.requestId;

    console.log("Download requested for:", {
      name: attachmentName,
      id: attachmentId,
      url: attachmentUrl,
      requestId,
      attachment: attachment,
    });

    // Skip token generation only if it's already a tokenized URL
    if (attachmentUrl.includes("/api/files/download?token=")) {
      console.log("Opening pre-tokenized URL:", attachmentUrl);
      window.open(attachmentUrl, "_blank");
      return;
    }

    // For all other cases, generate a token for secure download
    // Set loading state for this attachment
    setLoadingAttachments((prev) => ({ ...prev, [attachmentName]: true }));

    try {
      console.log("Requesting token for:", {
        attachmentId,
        attachmentName,
        requestId,
      });

      // Make sure we have a valid ID to request a token for
      if (!attachmentId && !requestId) {
        console.error(
          "No attachment ID or request ID available for token request"
        );
        throw new Error("Missing required IDs");
      }

      // Generate a temporary file token
      const response = await axios.post("/api/files/token", {
        fileId: attachmentId,
        fileName: attachmentName,
        fileType: getFileType(attachmentName),
        requestId: requestId,
      });

      console.log("Token response:", response.data);

      // Open the download URL in a new tab
      window.open(response.data.downloadUrl, "_blank");
    } catch (error) {
      console.error("Error generating download token:", error);

      // Fallback to direct URL only if token generation fails
      if (attachmentUrl) {
        console.log(
          "Falling back to direct URL as last resort:",
          getFixedPath(attachmentUrl)
        );

        // Check if it's a relative URL that needs the base path
        const fixedUrl = getFixedPath(attachmentUrl);
        const fullUrl = fixedUrl.startsWith("/")
          ? window.location.origin + fixedUrl
          : fixedUrl;

        window.open(fullUrl, "_blank");
      } else {
        alert("Failed to download the file. Please try again later.");
      }
    } finally {
      // Clear loading state
      setLoadingAttachments((prev) => ({ ...prev, [attachmentName]: false }));
    }
  };

  // Helper to determine file type from name
  const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
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

    return mimeTypes[extension] || "application/octet-stream";
  };

  return (
    <div>
      <h3 className="font-medium mb-2">Attachments</h3>
      <div className="space-y-2">
        {attachments.map((attachment, index) => {
          const attachmentName =
            attachment.fileName || attachment.name || `File ${index + 1}`;
          const isLoading = loadingAttachments[attachmentName] || false;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <span className="text-sm">{attachmentName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
