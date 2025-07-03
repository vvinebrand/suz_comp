// src/app/api/final/route.js
import { prisma } from "@/lib/prisma";
import { sql }    from "@prisma/client";

/* ——— BigInt → Number (для JSON) ——— */
function toPlain(value) {
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, toPlain(v)])
    );
  return typeof value === "bigint" ? Number(value) : value;
}

/* фильтр “область / город / всё” */
const byScope = (scope) => (row) =>
  scope === "region" ? !row.isCity
  : scope === "city" ?  row.isCity
  : true;

/* преобразование суммы очков к Number для сортировок */
const points = (x) => Number(x.total_points ?? 0);

export async function GET(req) {
  const p       = req.nextUrl.searchParams;
  const mode    = p.get("mode")   ?? "individual";  // individual | team
  const gender  = p.get("gender") ?? "girls";       // girls | boys | all
  const scope   = p.get("scope")  ?? "region";      // region | city | all

  /* girls → "Ж", boys → "М", all → null */
  let gLetter = gender === "girls" ? "Ж"
              : gender === "boys"  ? "М"
              : null;

  /* командный зачёт области — оба пола вместе */
  if (mode === "team" && scope === "region") gLetter = null;

  /* ─────────── INDIVIDUAL ─────────── */
  if (mode === "individual") {
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
        ${gLetter ? sql`AND p.gender = ${gLetter}` : sql``}
      GROUP BY p.id
    `;

    const ranked = rows
      .filter(byScope(scope))
      .sort((a, b) => points(b) - points(a))
      .map((r, i) => ({ ...r, place: i + 1 }));

    return Response.json({ rows: toPlain(ranked) });
  }

  /* ─────────── TEAM ─────────── */

  /* 1. все возможные участники команд */
  const members = await prisma.$queryRaw`
    SELECT  p.id,
            p."lastName", p."firstName", p.abbrev,
            p.institution, p.gender, p."isCity",

            /* сумма всех очков */
            COALESCE(SUM(r.points),0) AS total_points,

            /* дисциплины для таблицы / PDF */
            MAX(CASE WHEN d.key='стрельба'       THEN r.value  END) AS vp3_res,
            MAX(CASE WHEN d.key='стрельба'       THEN r.points END) AS vp3_pts,
            MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.value  END) AS str_res,
            MAX(CASE WHEN d.key LIKE 'силовые_%' THEN r.points END) AS str_pts,
            MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.value  END) AS ski_res,
            MAX(CASE WHEN d.key LIKE 'лыжи_%'    THEN r.points END) AS ski_pts

    FROM    "Participant" p
    LEFT JOIN "Result"     r ON r."participantId" = p.id
    LEFT JOIN "Discipline" d ON d.id             = r."disciplineId"
    WHERE   p."isTeam" = true
      ${gLetter ? sql`AND p.gender = ${gLetter}` : sql``}
    GROUP BY p.id
  `;

  /* 2. фильтр по регион/город */
  const filt = members.filter(byScope(scope));

  /* 3. группировка по колледжу */
  const buckets = new Map();
  for (const m of filt) {
    const key = m.institution.trim();
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(m);
  }

  /* 4. формируем команды */
  const teams = Array.from(buckets.entries()).map(([inst, list]) => {
    const sorted = [...list].sort((a, b) => points(b) - points(a));
    const top3sum = sorted.slice(0, 3).reduce((s, x) => s + points(x), 0);

    return {
      institution  : inst,
      membersCount : list.length,
      total_points : top3sum,
      team_sum3    : top3sum,
      participants : sorted,
    };
  })
  .sort((a, b) => points(b) - points(a))
  .map((t, i) => ({ ...t, place: i + 1 }));

  return Response.json({ rows: toPlain(teams) });
}
