// src/app/api/final/route.js
import { prisma } from "@/lib/prisma";

/* ——— BigInt → Number ——— */
function toPlain(v) {
  if (Array.isArray(v))      return v.map(toPlain);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k,val])=>[k, toPlain(val)])
    );
  return typeof v === "bigint" ? Number(v) : v;
}

export async function GET(req) {
  const p       = req.nextUrl.searchParams;
  const mode    = p.get("mode")   ?? "individual";   // individual | team
  const gender  = p.get("gender") ?? "girls";        // girls | boys
  const scope   = p.get("scope")  ?? "region";       // region | city | all

  /* ---------- INDIVIDUAL ---------- */
  if (mode === "individual") {
    const gLetter = gender === "girls" ? "Ж" : "М";

    let rows = await prisma.$queryRaw`
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
      WHERE   p.gender = ${gLetter} AND p."isIndividual" = true
      GROUP BY p.id
    `;

    rows = rows.filter(r => {
      if (scope === 'region') return !r.isCity;
      if (scope === 'city') return r.isCity;
      return true;
    });

    rows = rows
      .sort((a,b)=>Number(b.total_points||0)-Number(a.total_points||0))
      .map((r,i)=>({ ...r, place: i+1 }));

    return Response.json({ rows: toPlain(rows) });
  }

/* ---------- TEAM ---------- */

const gLetter = gender === "girls" ? "Ж" : "М";

const members = await prisma.$queryRaw`
  SELECT  p.id, p."lastName", p."firstName",
          p.abbrev, p.institution, p.gender, p."isCity",
          COALESCE(SUM(r.points),0) AS total_points
  FROM    "Participant" p
  LEFT JOIN "Result" r ON r."participantId" = p.id
  WHERE   p."isTeam" = true
    AND p.gender = ${gLetter}
  GROUP BY p.id
`;

/* 1. фильтрация по охвату ------------------------------------------ */
const filt = members.filter(m => {
  if (scope === "region") return !m.isCity;
  if (scope === "city")   return  m.isCity;
  return true;            // all
});

/* 2. группируем по учебным заведениям ------------------------------ */
const buckets = new Map();
for (const m of filt) {
  if (!buckets.has(m.institution)) buckets.set(m.institution, []);
  buckets.get(m.institution).push(m);
}

/* 3. собираем команды --------------------------------------------- */
let teams = Array.from(buckets.entries()).map(([inst, list]) => {
  /* — сортируем участников: больше очков → выше —*/
  const sorted = [...list].sort((a, b) => {
    if (a.total_points === b.total_points) return 0;
    return a.total_points > b.total_points ? -1 : 1;
  });

  const top3sum = sorted
    .slice(0, 3)
    .reduce((s, x) => s + Number(x.total_points ?? 0n), 0);

  return {
    institution  : inst,
    membersCount : list.length,
    total_points : top3sum,
    team_sum3    : top3sum,
    participants : sorted,
  };
});

/* 4. сортируем команды -------------------------------------------- */
teams = teams
  .sort((a, b) => {
    if (a.total_points === b.total_points) return 0;
    return a.total_points > b.total_points ? -1 : 1;
  })
  .map((t, i) => ({ ...t, place: i + 1 }));

return Response.json({ rows: toPlain(teams) });

}
