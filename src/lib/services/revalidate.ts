import "server-only";
import { revalidatePath } from "next/cache";

/** Public pages are dynamic, but refresh any router/data cache after admin mutations. */
export function revalidatePublic() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // revalidatePath throws outside a request scope (e.g. scripts); safe to ignore.
  }
}
