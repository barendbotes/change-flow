"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, PlusCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

const assetRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  assetType: z.enum(["hardware", "software", "peripheral", "other"], {
    required_error: "Please select an asset type",
  }),
  assetCategory: z.enum(["laptop", "desktop", "monitor", "software", "mobile", "accessory", "other"], {
    required_error: "Please select an asset category",
  }),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  justification: z.string().min(10, "Justification must be at least 10 characters"),
  neededBy: z.string().min(1, "Please select a date when you need this asset"),
  additionalInfo: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        file: z.instanceof(File),
      }),
    )
    .optional(),
})

type AssetRequestFormValues = z.infer<typeof assetRequestSchema>

interface AssetRequestFormProps {
  userId: string
}

export function AssetRequestForm({ userId }: AssetRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<AssetRequestFormValues>({
    resolver: zodResolver(assetRequestSchema),
    defaultValues: {
      title: "",
      quantity: 1,
      justification: "",
      additionalInfo: "",
      neededBy: "",
      attachments: [],
    },
  })

  async function onSubmit(data: AssetRequestFormValues) {
    setIsSubmitting(true)

    try {
      // Upload attachments first if any
      const attachmentUrls = []

      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          const formData = new FormData()
          formData.append("file", attachment.file)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload attachment")
          }

          const { url } = await response.json()
          attachmentUrls.push({
            fileName: attachment.name,
            fileUrl: url,
            fileSize: attachment.size.toString(),
            fileType: attachment.type,
          })
        }
      }

      // Convert string date to Date object for API
      const formattedData = {
        ...data,
        neededBy: new Date(data.neededBy),
      }

      // Submit the request
      const response = await fetch("/api/requests/asset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formattedData,
          userId,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit request")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief title for the asset request" {...field} />
                </FormControl>
                <FormDescription>A concise title describing what you're requesting.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 grid-cols-2">
            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="peripheral">Peripheral</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="assetCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="mobile">Mobile Device</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the category that best describes the asset.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justification</FormLabel>
              <FormControl>
                <Textarea placeholder="Why do you need this asset?" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>Explain why this asset is needed and how it will be used.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="neededBy"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Needed By</FormLabel>
              <FormControl>
                <Input type="date" min={today} {...field} />
              </FormControl>
              <FormDescription>The date by which you need this asset.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional details about your request"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Provide any additional information that might be helpful.</FormDescription>
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
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFiles = [...field.value!]
                                  newFiles.splice(index, 1)
                                  field.onChange(newFiles)
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
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || [])
                          const fileObjects = files.map((file) => ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            file,
                          }))
                          field.onChange([...(field.value || []), ...fileObjects])
                        }
                        input.click()
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormDescription>Attach any relevant documentation or files.</FormDescription>
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
  )
}

