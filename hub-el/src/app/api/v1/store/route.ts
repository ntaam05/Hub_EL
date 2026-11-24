// src/app/api/v1/store/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getStoreCatalogService } from "@/services/store.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const res = await getStoreCatalogService(auth.userId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

