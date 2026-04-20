import { NextRequest, NextResponse } from "next/server";
import { appendImageBlock } from "@/lib/notion";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const FILE_UPLOAD_VERSION = "2026-03-11";
const BASE = "https://api.notion.com/v1";

async function uploadImageToNotion(file: Blob, filename: string, contentType: string): Promise<string> {
  // 1. Initiate upload
  const initRes = await fetch(`${BASE}/file-uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": FILE_UPLOAD_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, content_type: contentType }),
  });
  if (!initRes.ok) throw new Error(`Initiate upload failed: ${await initRes.text()}`);
  const { id } = await initRes.json();

  // 2. Send file data
  const formData = new FormData();
  formData.append("file", file, filename);
  const sendRes = await fetch(`${BASE}/file-uploads/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": FILE_UPLOAD_VERSION,
    },
    body: formData,
  });
  if (!sendRes.ok) throw new Error(`Send file failed: ${await sendRes.text()}`);

  // 3. Complete upload
  const completeRes = await fetch(`${BASE}/file-uploads/${id}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": FILE_UPLOAD_VERSION,
    },
  });
  if (!completeRes.ok) throw new Error(`Complete upload failed: ${await completeRes.text()}`);

  return id;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    const fileUploadId = await uploadImageToNotion(file, file.name, file.type);
    await appendImageBlock(id, fileUploadId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[journal/image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
