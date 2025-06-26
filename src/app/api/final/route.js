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

    const rows = await prisma.$queryRaw`
      SELECT  p.id,
              p."lastName", p."firstName", p.abbrev,
              p.institution, p."birthYear",
              SUM(r.points) AS total_points,
              RANK() OVER (ORDER BY SUM(r.points) DESC) AS place,
              MAX(CASE WHEN d.key='стрельба'       THEN r.value  END) AS vp3_res,
              MAX(CASE WHEN d.key='стрельба'       THEN r.points END) AS vp3_pts,
              MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.value  END) AS str_res,
              MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.points END) AS str_pts,
              MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.value  END) AS ski_res,
              MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.points END) AS ski_pts
      FROM    "Participant" p
      LEFT JOIN "Result"     r ON r."participantId" = p.id
      LEFT JOIN "Discipline" d ON d.id             = r."disciplineId"
      WHERE   p.gender = ${gLetter}
      GROUP BY p.id
    `;

    return Response.json({ rows: toPlain(rows) });
  }

  /* ---------- TEAM ---------- */

  /* 1. участники с суммами очков */
  const members = await prisma.$queryRaw`
    SELECT  p.id, p."lastName", p."firstName",
            p.abbrev, p.institution, p.gender,
            COALESCE(SUM(r.points),0) AS total_points
    FROM    "Participant" p
    LEFT JOIN "Result" r ON r."participantId" = p.id
    GROUP BY p.id
  `;

  /* 2. фильтр область / город / all */
  const filt = members.filter(m=>{
    if (scope==="region") return !m.institution.startsWith('г.');
    if (scope==="city")   return  m.institution.startsWith('г.');
    return true;          // all
  });

  /* 3. группировка по СУЗ */
  const buckets = new Map();
  for (const m of filt) {
    if (!buckets.has(m.institution)) buckets.set(m.institution, []);
    buckets.get(m.institution).push(m);
  }

  /* 4. считаем сумму 3-х лучших */
  let teams = Array.from(buckets.entries()).map(([inst, list])=>{
    const sorted  = list.sort((a,b)=>b.total_points-a.total_points);
    const top3sum = sorted.slice(0,3)
                          .reduce((s,x)=>s+Number(x.total_points||0),0);
    return {
      institution : inst,
      membersCount: list.length,
      total_points: top3sum,
      team_sum3   : top3sum,     // для фронта
      participants: sorted,
    };
  });

  /* 5. ранжируем */
  teams = teams.sort((a,b)=>b.total_points-a.total_points)
               .map((t,i)=>({ ...t, place:i+1 }));

  return Response.json({ rows: toPlain(teams) });
}
