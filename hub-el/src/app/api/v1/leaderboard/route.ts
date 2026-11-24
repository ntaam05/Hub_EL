import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getLeaderboardService } from "@/services/leaderboard.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "STREAK";
  const range = searchParams.get("range") || searchParams.get("timeframe") || "DAY";

  const result = await getLeaderboardService(category, range, auth.userId);

  return NextResponse.json(result, {
    status: result.statusCode || (result.success ? 200 : 400),
  });
}

