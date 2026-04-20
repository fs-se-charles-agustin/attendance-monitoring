import z from "zod";
import { authSchema } from "../schema/auth.schema";

export type AuthType = z.infer<typeof authSchema>