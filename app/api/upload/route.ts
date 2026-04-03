import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * POST /api/upload
 * Accepts a multipart form-data with a single file field named "file".
 * Saves the file under public/uploads/{subfolder}/{uuid}.{ext}
 * Returns the public URL path.
 *
 * Query params:
 *   subfolder – Optional. e.g. "blog", "portofolio", "galeri"
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "HEAD_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "File wajib dikirim" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Tipe file tidak didukung. Gunakan: JPG, PNG, WebP, GIF, atau SVG",
        },
        { status: 400 },
      );
    }

    // Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Ukuran file maksimal 5MB" },
        { status: 400 },
      );
    }

    // Determine subfolder
    const url = new URL(req.url);
    const subfolder = url.searchParams.get("subfolder") || "general";
    const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");

    // Build file path
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeSubfolder);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${safeSubfolder}/${filename}`;

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("Error POST /api/upload:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
