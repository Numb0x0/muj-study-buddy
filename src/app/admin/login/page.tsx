import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { isAdminConfigured } from "@/lib/firebase/admin";
import { LoginCard } from "@/components/admin/LoginCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator sign-in" };

export default async function AdminLoginPage() {
  const configured = isAdminConfigured();
  if (configured && (await getAdminSession().catch(() => null))) redirect("/admin");
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="glow-blob absolute left-1/2 top-1/4 h-96 w-[36rem] -translate-x-1/2" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <Suspense>
        <LoginCard serverConfigured={configured} emulators={process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"} />
      </Suspense>
    </div>
  );
}
