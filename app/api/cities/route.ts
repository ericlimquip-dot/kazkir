import { NextResponse, type NextRequest } from "next/server";
import { searchCities } from "@/lib/geo/cities";

/** City suggestions for the trip form. GET /api/cities?q=alm&country=KZ */
export function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const country = request.nextUrl.searchParams.get("country") ?? undefined;
  const cities = searchCities(q, {
    country: country && /^[A-Za-z]{2}$/.test(country) ? country : undefined,
  });
  return NextResponse.json(
    { cities },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
