import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { ReactNode } from "react";
import Sidebar from "./_components/Sidebar";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "dev-only-secret-change-this",
);

async function getSessionRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    return (payload?.role as string) ?? null;
  } catch {
    return null;
  }
}

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = await getSessionRole();

  if (role !== "SUPER_ADMIN") {
    redirect("/login/admin");
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
