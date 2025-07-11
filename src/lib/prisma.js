//src//lib//prisma.js
import { PrismaClient } from "@prisma/client";

const prisma =
  global.prisma || new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export { prisma };

