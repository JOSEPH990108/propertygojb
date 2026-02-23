// src\app\api\auth\[...all]\route.ts
import { auth } from "@/lib/auth"; // <--- MAKE SURE THIS IMPORT IS CORRECT
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);