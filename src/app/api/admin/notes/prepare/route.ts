import { z } from "zod";
import { json, withAdmin } from "@/lib/auth/require-admin";
import { prepareUpload } from "@/lib/services/notes";

export const dynamic = "force-dynamic";

const body = z.object({
  originalFileName: z.string().trim().min(1).max(255),
  fileSizeBytes: z.number().int().min(0),
  mimeType: z.string().trim().max(100),
});

export const POST = withAdmin(async (req) => json(await prepareUpload(body.parse(await req.json()))));
