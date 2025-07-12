import z from "zod";

export const UserProfileSchema = z.object({
  name: z.string().max(100),
  email: z.string().max(255).nullable().optional(),
  status: z.string().max(20).nullable().optional(),
});
