import { NextRequest, NextResponse } from "next/server";
import { locateAssetBoundingBox } from "@/server";

export const maxDuration = 60;

/**
 * HTTP Adapter for Locating Asset Coordinates
 * Delegates all business logic to pure service in src/server
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageData, mimeType, assetName, assetValue } = body;

    if (!imageData || !assetName) {
      return NextResponse.json(
        { error: "Parameter imageData dan assetName wajib diisi." },
        { status: 400 },
      );
    }

    const box_2d = await locateAssetBoundingBox({
      imageData,
      mimeType,
      assetName,
      assetValue,
    });

    return NextResponse.json({ box_2d });
  } catch (error: any) {
    console.error("[Locate Asset API Error]", error);
    return NextResponse.json(
      { error: error?.message || "Gagal melacak posisi aset pada gambar." },
      { status: 500 },
    );
  }
}
