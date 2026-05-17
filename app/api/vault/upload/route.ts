import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function getLowerCaseExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const extension = getLowerCaseExtension(fileName);
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "vault-file"}${extension}`;
}

function uploadToCloudinary(fileBuffer: Buffer, fileName: string) {
  const extension = getLowerCaseExtension(fileName);
  const resourceType = IMAGE_EXTENSIONS.has(extension) ? "image" : "raw";

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "study-buddy/vault",
        resource_type: resourceType,
        public_id: `${Date.now()}-${sanitizeFileName(fileName)}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function POST(request: Request) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { message: "Cloudinary environment variables are not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { message: "A file field is required." },
        { status: 400 }
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "File exceeds 20MB limit." },
        { status: 400 }
      );
    }

    const extension = getLowerCaseExtension(uploadedFile.name);

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          message:
            "Unsupported file type. Upload a PDF, image, or document file.",
        },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const cloudinaryResult = await uploadToCloudinary(
      fileBuffer,
      uploadedFile.name
    );

    return NextResponse.json(
      {
        secure_url: cloudinaryResult.secure_url,
        fileName: uploadedFile.name,
        format:
          cloudinaryResult.format ||
          extension.replace(".", "").toLowerCase() ||
          uploadedFile.type ||
          "unknown",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vault upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload file to Vault." },
      { status: 500 }
    );
  }
}


