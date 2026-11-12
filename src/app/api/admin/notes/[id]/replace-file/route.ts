import { json, withAdmin } from "@/lib/auth/require-admin";
import { replaceFile } from "@/lib/services/notes";
import { idSchema } from "@/lib/validations/common";
import { replaceFileInput } from "@/lib/validations/note";

export const dynamic = "force-dynamic";

export const POST = withAdmin<{ id: string }>(async (req, { params, session }) => {
  const { file } = replaceFileInput.parse(await req.json());
  return json({ note: await replaceFile(session, idSchema.parse(params.id), file) });
});
