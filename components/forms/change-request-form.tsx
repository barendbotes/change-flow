"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, PlusCircle, X } from "lucide-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const changeRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  changeType: z.enum(["hardware", "software", "network", "other"], {
    required_error: "Please select a change type",
  }),
  priority: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select a priority level",
  }),
  implementationDate: z.date({
    required_error: "Please select an implementation date",
  }),
  impact: z
    .string()
    .min(10, "Impact description must be at least 10 characters"),
  rollbackPlan: z
    .string()
    .min(10, "Rollback plan must be at least 10 characters"),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        file: z.instanceof(File),
      })
    )
    .optional(),
});

type ChangeRequestFormValues = z.infer<typeof changeRequestSchema>;

interface ChangeRequestFormProps {
  userId: string;
}

export function ChangeRequestForm({ userId }: ChangeRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<ChangeRequestFormValues>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      impact: "",
      rollbackPlan: "",
      implementationDate: undefined,
      attachments: [],
    },
  });

  async function onSubmit(data: ChangeRequestFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the IT Change Request type first
      const typeResponse = await fetch("/api/request-types/it-change-request");
      if (!typeResponse.ok) {
        throw new Error("Failed to get request type");
      }
      const { requestType } = await typeResponse.json();

      // Create the request with the correct type
      const createResponse = await fetch("/api/requests/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          changeType: data.changeType,
          priority: data.priority,
          implementationDate: data.implementationDate.toISOString(),
          impact: data.impact,
          rollbackPlan: data.rollbackPlan,
          userId: userId,
          attachments: [], // We'll upload attachments separately after getting the request ID
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      const requestData = await createResponse.json();
      const requestId = requestData.request.id;

      // Upload attachments with the request ID
      const attachmentUrls = [];

      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          const formData = new FormData();
          formData.append("file", attachment.file);
          formData.append("requestId", requestId);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload attachment");
          }

          const fileData = await response.json();
          attachmentUrls.push({
            fileName: fileData.name,
            fileUrl: fileData.url,
            fileSize: fileData.size.toString(),
            fileType: fileData.type,
          });
        }

        // Update the request with attachment URLs
        if (attachmentUrls.length > 0) {
          const updateResponse = await fetch(
            `/api/requests/change/${requestId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                attachments: attachmentUrls,
              }),
            }
          );

          if (!updateResponse.ok) {
            console.warn("Failed to update request with attachments");
          }
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief title for the change" {...field} />
                </FormControl>
                <FormDescription>
                  A concise title describing the change request.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 grid-cols-2">
            <FormField
              control={form.control}
              name="changeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the change"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed description of what needs to be changed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Impact</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How will this change impact business operations?"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe the potential impact on business operations.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rollbackPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rollback Plan</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How will you revert the change if needed?"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe how you would roll back this change if needed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="implementationDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Implementation Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The date when you plan to implement this change.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {field.value && field.value.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {field.value.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="text-sm">{file.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFiles = [...field.value!];
                                  newFiles.splice(index, 1);
                                  field.onChange(newFiles);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = Array.from(
                            (e.target as HTMLInputElement).files || []
                          );
                          const fileObjects = files.map((file) => ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            file,
                          }));
                          field.onChange([
                            ...(field.value || []),
                            ...fileObjects,
                          ]);
                        };
                        input.click();
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Attach any relevant documentation or files.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
