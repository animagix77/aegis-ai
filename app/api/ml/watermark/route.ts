import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "no_file", results: null });
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for C2PA JUMBF marker in JPEG/PNG files
    // C2PA manifests are embedded as JUMBF (JPEG Universal Metadata Box Format)
    // The JUMBF box starts with 'jumb' marker
    const c2paMarker = findC2paMarker(bytes);
    const xmpGenerator = extractXmpGenerator(bytes);

    if (!c2paMarker && !xmpGenerator) {
      return NextResponse.json({
        error: null,
        results: {
          hasC2pa: false,
          c2paManifest: null,
          generator: null,
          signerInfo: null,
          isValid: null,
        },
      });
    }

    return NextResponse.json({
      error: null,
      results: {
        hasC2pa: c2paMarker,
        c2paManifest: c2paMarker ? { detected: true } : null,
        generator: xmpGenerator,
        signerInfo: null,
        isValid: c2paMarker ? true : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "api_error", results: null });
  }
}

function findC2paMarker(bytes: Uint8Array): boolean {
  // Search for 'jumb' (JUMBF box type) in the binary data
  // 0x6A756D62 = 'jumb'
  for (let i = 0; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 0x6a &&
      bytes[i + 1] === 0x75 &&
      bytes[i + 2] === 0x6d &&
      bytes[i + 3] === 0x62
    ) {
      return true;
    }
  }

  // Also check for C2PA claim signature marker 'c2pa'
  for (let i = 0; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 0x63 &&
      bytes[i + 1] === 0x32 &&
      bytes[i + 2] === 0x70 &&
      bytes[i + 3] === 0x61
    ) {
      return true;
    }
  }

  return false;
}

function extractXmpGenerator(bytes: Uint8Array): string | null {
  // Try to find XMP metadata containing generator info
  // XMP data contains <xmp:CreatorTool> and similar tags
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 65536)));

  const generatorPatterns = [
    /<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/i,
    /<photoshop:Source>([^<]+)<\/photoshop:Source>/i,
    /tEXt.*?Software\x00([^\x00]+)/i,
    /Software\x00\x00([^\x00]+)/i,
  ];

  for (const pattern of generatorPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  // Check for known AI generator markers in raw bytes
  const aiMarkers = [
    "Midjourney",
    "DALL-E",
    "Stable Diffusion",
    "Adobe Firefly",
    "Runway",
    "Ideogram",
    "Leonardo.AI",
  ];

  for (const marker of aiMarkers) {
    if (text.includes(marker)) {
      return marker;
    }
  }

  return null;
}
