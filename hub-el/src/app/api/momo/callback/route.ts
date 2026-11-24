import { NextResponse } from "next/server";
import { processMoMoIpnCallbackService } from "@/services/store.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processMoMoIpnCallbackService(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || "Lỗi xử lý callback MoMo" },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error: any) {
    console.error("MOMO CALLBACK API ERROR:", error);
    return NextResponse.json({ message: "Lỗi Server" }, { status: 500 });
  }
}
