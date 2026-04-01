import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#1f2c44]">{children}</div>;
}
