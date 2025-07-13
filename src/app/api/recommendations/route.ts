import { validateRequest } from "@/auth";
import { UserRecommendationService } from "@/lib/recommendations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    const recommendations = await UserRecommendationService.getRecommendations(
      user.id,
      limit
    );

    return Response.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
