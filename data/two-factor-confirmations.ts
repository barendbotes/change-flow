import { db } from "@/lib/db";
import { twoFactorConfirmations } from "@/schemas/schema";
import { eq } from "drizzle-orm";

export const getTwoFactorConfirmationByUserId = async (userId: string) => {
  try {
    const twoFactorConfirmation =
      await db.query.twoFactorConfirmations.findFirst({
        where: eq(twoFactorConfirmations.userId, userId),
      });
    return twoFactorConfirmation;
  } catch {
    return null;
  }
};
