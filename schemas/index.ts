import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Email is invalid" }),
  password: z.string().min(1, "Password is required"),
  code: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(6, "Minimum 6 characters are required"),
  name: z.string().min(1, "Name is required"),
});

export const ResetSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, "Minimum 6 characters are required"),
});

export const SettingsSchema = z
  .object({
    name: z.string().optional(),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
    email: z.string().optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    isTwoFactorEnabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    },
    { message: "New password is required!", path: ["newPassword"] }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    },
    { message: "Password is required!", path: ["password"] }
  );
