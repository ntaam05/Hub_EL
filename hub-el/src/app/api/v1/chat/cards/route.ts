import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getOwnedWikiCardsService } from "@/services/chat.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const result = await getOwnedWikiCardsService(auth.userId);
  return NextResponse.json(result, {
    status: result.statusCode || (result.success ? 200 : 400),
  });
}

