import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary explicitly if needed, but it automatically reads CLOUDINARY_URL from env if available.
cloudinary.config({
  secure: true
});

/**
 * POST /api/upload
 * Accepts a multipart form-data with a single file field named "file".
 * Saves the file directly to Cloudinary bypassing local filesystem.
 * Returns the public URL path (secure_url).
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
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Tipe file tidak didukung. Gunakan: JPG, PNG, WebP, GIF, SVG, atau PDF",
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

    // Determine subfolder and Cloudinary folder name
    const url = new URL(req.url);
    const subfolder = url.searchParams.get("subfolder") || "general";
    const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "");
    
    // Setup Cloudinary folder
    const cloudinaryFolder = `bem-uploads/${safeSubfolder}`;

    // Read buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Stream upload to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: cloudinaryFolder, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });

    // Return the public URL
    const publicUrl = result.secure_url;

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("Error POST /api/upload:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
