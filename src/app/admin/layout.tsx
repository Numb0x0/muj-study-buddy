import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

/** Pass-through: /admin/login must not be wrapped by the auth guard in (dashboard)/layout.tsx. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
