import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const by = req.nextUrl.searchParams.get("by") || "region"; // or "city"
  // группируем по institution
  const agg = await prisma.participant.groupBy({
    by: ["institution"],
    _sum: { totalPoints: true },
    _count: { id: true },
  });
  // сортируем по убыванию суммы
  agg.sort((a, b) => b._sum.totalPoints - a._sum.totalPoints);

  // добавляем место
  const result = agg.map((item, idx) => ({
    institution: item.institution,
    participantsCount: item._count.id,
    totalPoints: item._sum.totalPoints,
    place: idx + 1,
  }));

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
