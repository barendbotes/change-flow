"use client";

import { Button } from "@/components/ui/button";
import { GithubIcon, GoogleIcon } from "@/components/icons/vendor-icons";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
  const onClick = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: DEFAULT_LOGIN_REDIRECT });
  };
  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        variant="outline"
        size="icon"
        className="w-full"
        onClick={() => onClick("github")}
      >
        <GithubIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-full"
        onClick={() => onClick("google")}
      >
        <GoogleIcon />
      </Button>
    </div>
  );
};
