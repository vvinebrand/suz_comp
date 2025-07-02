import { prisma } from "@/lib/prisma";

/* ---------- BigInt → Number ---------- */
function toPlain(v) {
  if (Array.isArray(v)) return v.map(toPlain);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, toPlain(val)])
    );
  return typeof v === "bigint" ? Number(v) : v;
}

export async function GET(req) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "region"; // region | city | all

  const members = await prisma.$queryRaw`
    SELECT  p.id,
            p.institution,
            p."isCity",
            COALESCE(SUM(r.points),0) AS total_points
    FROM    "Participant" p
    LEFT JOIN "Result" r ON r."participantId" = p.id
    WHERE   p."isTeam" = true
    GROUP BY p.id
  `;

  const filt = members.filter((m) => {
    if (scope === "region") return !m.isCity;
    if (scope === "city") return m.isCity;
    return true;
  });

  const buckets = new Map();
  for (const m of filt) {
    if (!buckets.has(m.institution)) buckets.set(m.institution, []);
    buckets.get(m.institution).push(Number(m.total_points || 0));
  }

  let teams = Array.from(buckets.entries()).map(([inst, list]) => {
    const sorted = list.sort((a, b) => b - a);
    const top3sum = sorted.slice(0, 3).reduce((s, x) => s + x, 0);
    return {
      institution: inst,
      membersCount: list.length,
      total_points: top3sum,
    };
  });

  teams = teams
    .sort((a, b) => b.total_points - a.total_points)
    .map((t, i) => ({ ...t, place: i + 1 }));

  return Response.json({ rows: toPlain(teams) });
}
