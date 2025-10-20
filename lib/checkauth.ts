"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // pastikan js-cookie sudah diinstall

export function useAuthRedirect(roleNeeded: string) {
  const router = useRouter();

  useEffect(() => {
    const role = Cookies.get("role");

    if (!role) {
      // Belum login
      router.push("/login");
      return;
    }

    // Kalau role salah, arahkan ke dashboard yang benar
    if (role !== roleNeeded) {
      if (role === "mahasiswa") router.push("/dashboard/mahasiswa");
      else if (role === "ADMIN") router.push("/dashboard/admin");
      else if (role === "HEAD_ADMIN") router.push("/dashboard/headadmin");
    }
  }, [router, roleNeeded]);
}
