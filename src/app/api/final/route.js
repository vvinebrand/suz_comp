// src/app/api/final/route.js
import { prisma } from "@/lib/prisma";

/* --- BigInt → Number (для JSON) ---------------------------------- */
function toPlain(v) {
  if (Array.isArray(v)) return v.map(toPlain);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, toPlain(val)])
    );
  return typeof v === "bigint" ? Number(v) : v;
}

export async function GET(req) {
  const p       = req.nextUrl.searchParams;
  const mode    = p.get("mode")   ?? "individual";  // individual | team
  const gender  = p.get("gender") ?? "girls";       // girls | boys | all
  const scope   = p.get("scope")  ?? "region";      // region | city | all

  /* girls → "Ж", boys → "М", all → null (нет фильтра) */
  let gLetter = gender === "girls" ? "Ж"
                : gender === "boys"  ? "М"
                : null;

  // В командном зачёте областного уровня учитываются участники обоих полов
  if (mode === "team" && scope === "region") {
    gLetter = null;
  }

  /* ───────────────────── INDIVIDUAL ───────────────────── */
  if (mode === "individual") {
    /* 1. Берём участников, опционально фильтруя по полу */
    const rows = await prisma.$queryRaw`
      SELECT  p.id,
              p."lastName", p."firstName", p.abbrev,
              p.institution, p."birthYear", p."isCity",
              SUM(r.points) AS total_points,
              MAX(CASE WHEN d.key='стрельба'       THEN r.value  END) AS vp3_res,
              MAX(CASE WHEN d.key='стрельба'       THEN r.points END) AS vp3_pts,
              MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.value  END) AS str_res,
              MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.points END) AS str_pts,
              MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.value  END) AS ski_res,
              MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.points END) AS ski_pts
      FROM    "Participant" p
      LEFT JOIN "Result"     r ON r."participantId" = p.id
      LEFT JOIN "Discipline" d ON d.id             = r."disciplineId"
      WHERE   p."isIndividual" = true
        ${gLetter ? prisma.sql`AND p.gender = ${gLetter}` : prisma.sql``}
      GROUP BY p.id
    `;

    /* 2. Фильтр «Область / Город» */
    const scoped = rows.filter(r => {
      if (scope === "region") return !r.isCity;
      if (scope === "city")   return  r.isCity;
      return true;            // all
    });

    /* 3. Сортировка + место */
    const ranked = scoped
      .sort((a, b) => Number(b.total_points ?? 0) - Number(a.total_points ?? 0))
      .map((r, i) => ({ ...r, place: i + 1 }));

    return Response.json({ rows: toPlain(ranked) });
  }

  /* ───────────────────── TEAM ───────────────────── */

  /* 1. Берём всех командных участников (опционально по полу) */
  const members = await prisma.$queryRaw`
    SELECT  p.id, p."lastName", p."firstName",
            p.abbrev, p.institution, p.gender, p."isCity",
            COALESCE(SUM(r.points),0) AS total_points
    FROM    "Participant" p
    LEFT JOIN "Result" r ON r."participantId" = p.id
    WHERE   p."isTeam" = true
      ${gLetter ? prisma.sql`AND p.gender = ${gLetter}` : prisma.sql``}
    GROUP BY p.id
  `;

  /* 2. Фильтр «Область / Город» */
  const filt = members.filter(m => {
    if (scope === "region") return !m.isCity;
    if (scope === "city")   return  m.isCity;
    return true;            // all
  });

  /* 3. Группируем по колледжу/СУЗ */
  const buckets = new Map();
  for (const m of filt) {
    if (!buckets.has(m.institution)) buckets.set(m.institution, []);
    buckets.get(m.institution).push(m);
  }

  /* 4. Формируем итоговые команды */
  let teams = Array.from(buckets.entries()).map(([inst, list]) => {
    const sorted = [...list].sort((a, b) => {
      if (a.total_points === b.total_points) return 0;
      return a.total_points > b.total_points ? -1 : 1;
    });

    const top3sum = sorted
      .slice(0, 3)
      .reduce((s, x) => s + Number(x.total_points ?? 0), 0);

    return {
      institution  : inst,
      membersCount : list.length,
      total_points : top3sum,
      team_sum3    : top3sum,
      participants : sorted,
    };
  });

  /* 5. Сортируем команды и нумеруем места */
  teams = teams
    .sort((a, b) => {
      if (a.total_points === b.total_points) return 0;
      return a.total_points > b.total_points ? -1 : 1;
    })
    .map((t, i) => ({ ...t, place: i + 1 }));

  return Response.json({ rows: toPlain(teams) });
}
