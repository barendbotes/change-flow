import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { TopNavbar } from "@/components/top-navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNavbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Streamline Your Change Management Process
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Simplify IT change control and asset requests with our
                  comprehensive management platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <LoginButton>
                  <Button variant="default" size="lg">
                    Sign In
                  </Button>
                </LoginButton>
                <Link href="/about">
                  <Button variant="outline">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  IT Change Control
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Manage IT Changes Effectively
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a structured approach to IT change
                  management, ensuring all changes are properly documented,
                  reviewed, and approved before implementation.
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Asset Requests
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Streamline Asset Requisitions
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Request software, computers, screens, laptops, and other
                  assets through a simple, standardized process with built-in
                  approval workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Key Features
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our change management platform is designed to meet the needs of
                modern organizations.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-3">
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold">Role-Based Access Control</h3>
                <p className="text-muted-foreground">
                  Different permission levels for users, managers, and
                  administrators ensure proper access control.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold">Approval Workflows</h3>
                <p className="text-muted-foreground">
                  Automated approval processes with email notifications keep
                  everyone informed.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold">Group Permissions</h3>
                <p className="text-muted-foreground">
                  Organize users into groups like IT and Corporate to control
                  access to different request types.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 md:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Change Management System. All rights
            reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
