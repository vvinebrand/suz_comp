import { prisma } from "@/lib/prisma";

/* ---------- READ ---------- */
export async function GET() {
  const list = await prisma.participant.findMany({ orderBy: { id: "asc" } });
  return Response.json(list);
}

/* ---------- CREATE ---------- */
export async function POST(req) {
  const p = await req.json();

  const created = await prisma.participant.create({
    data: {
      lastName:    p.lastName,
      firstName:   p.firstName,
      abbrev:      p.abbrev,
      institution: p.institution,
      birthYear:   p.birthYear ? Number(p.birthYear) : null,
      gender:      p.gender,
      isIndividual: p.isIndividual ?? true,
      isTeam:       p.isTeam       ?? true,
      isCity:       p.isCity       ?? false,
    },
  });
  return Response.json(created, { status: 201 });
}

/* ---------- UPDATE ---------- */
export async function PUT(req) {
  const { id, ...rest } = await req.json();

  const updated = await prisma.participant.update({
    where: { id: Number(id) },
    data:  {
      ...rest,
      birthYear: rest.birthYear ? Number(rest.birthYear) : null,
    },
  });
  return Response.json(updated);
}

/* ---------- DELETE ---------- */
export async function DELETE(req) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return new Response("id query param required", { status: 400 });

  await prisma.result.deleteMany({ where: { participantId: id } });
  await prisma.participant.delete({ where: { id } });

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"Participant"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Participant"), 0)
    );`;
  return new Response(null, { status: 204 });
}
