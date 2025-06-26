// src/app/api/competitions/route.js
import { prisma } from "@/lib/prisma";

/* ---------------------------  GET  -------------------------------- */
export async function GET(req) {
  /* 0) ключ дисциплины из query */
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return new Response("key required", { status: 400 });

  /* 1) сама дисциплина + все результаты */
  const discipline = await prisma.discipline.findUnique({
    where:   { key },
    include: { results: { include: { participant: true } } },
  });
  if (!discipline) return new Response("discipline not found", { status: 404 });

  /* 2) базовый список участников c учётом пола дисциплины */
  let participants = await prisma.participant.findMany({
    where: discipline.gender
      ? { gender: discipline.gender === "girls" ? "Ж" : "М" }
      : {},
    orderBy: { id: "asc" },
  });

  /* 3) карта результатов: { participantId → { value, points } } */
  const resMap = new Map(
    discipline.results.map(r => [
      r.participantId,
      { value: r.value, points: r.points },
    ]),
  );

  /* 4) объединяем: тем, у кого нет записи, value / points = null */
  participants = participants.map(p => ({
    ...p,
    ...(resMap.get(p.id) ?? { value: null, points: null }),
  }));

  return Response.json({
    columns: JSON.parse(discipline.columns),
    rows:    participants,
  });
}
/* ------------------------------ PUT (add / edit) ----------------- */
export async function PUT(req) {
  const { participantId, disciplineKey, value, points } = await req.json();

  /* обязательные параметры */
  if (!participantId || !disciplineKey) {
    return new Response(
      "participantId & disciplineKey required",
      { status: 400 },
    );
  }

  /* ищем дисциплину */
  const disc = await prisma.discipline.findUnique({
    where:  { key: disciplineKey },
    select: { id: true },
  });
  if (!disc) {
    return new Response("discipline not found", { status: 404 });
  }

  /* приводим points к  Int  или  null  */
  const numPoints =
    points === undefined || points === null || points === ""
      ? null
      : Number(points);                    // "45" → 45, "abc" → NaN → null

  /* upsert: если запись есть ‒ обновляем, иначе создаём */
  const saved = await prisma.result.upsert({
    where: {
      participantId_disciplineId: {
        participantId: Number(participantId),
        disciplineId:  disc.id,
      },
    },
    update: {
      value:  value ?? null,
      points: isNaN(numPoints) ? null : numPoints,
    },
    create: {
      participantId: Number(participantId),
      disciplineId:  disc.id,
      value:  value ?? null,
      points: isNaN(numPoints) ? null : numPoints,
    },
  });

  return Response.json(saved);
}
