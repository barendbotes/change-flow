"use client";

import { useState } from "react";
import { Share2, Check, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareRequestButtonProps {
  requestId: string;
}

export function ShareRequestButton({ requestId }: ShareRequestButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShareClick = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Change Request",
          text: "Please review this change request",
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleShareClick}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Share"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy link to clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
