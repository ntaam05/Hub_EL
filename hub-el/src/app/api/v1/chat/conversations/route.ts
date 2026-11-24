import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getConversationsService } from "@/services/chat.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const result = await getConversationsService(auth.userId);
  return NextResponse.json(result, {
    status: result.statusCode || (result.success ? 200 : 400),
  });
}

