// prisma/seed.js
import { prisma } from "../src/lib/prisma.js";

const initial = [
  /* 1. Стрельба — общая */
  {
    key:   "стрельба",
    label: "Стрельба",
    columns: JSON.stringify([
      "№", "ФИО", "Учебное заведение", "Пол", "Результат", "Очки",
    ]),
    unit: "очки",
    gender: null,
  },

  /* 2. Силовые упражнения (девушки) */
  {
    key:   "силовые_девушки",
    label: "Силовые упражнения (девушки)",
    columns: JSON.stringify([
      "№", "ФИО", "Учебное заведение", "Пол", "Повторения", "Очки",
    ]),
    unit: "повторения",
    gender: "girls",
  },

  /* 3. Силовые упражнения (юноши) */
  {
    key:   "силовые_юноши",
    label: "Силовые упражнения (юноши)",
    columns: JSON.stringify([
      "№", "ФИО", "Учебное заведение", "Пол", "Повторения", "Очки",
    ]),
    unit: "повторения",
    gender: "boys",
  },

  /* 4. Лыжи 2 км (девушки) */
  {
    key:   "лыжи_девушки",
    label: "Старт лыжи (девушки)",
    columns: JSON.stringify([
      "№", "ФИО", "Учебное заведение", "Пол", "Время", "Очки",
    ]),
    unit: "сек",
    gender: "girls",
  },

  /* 5. Лыжи 2 км (юноши) */
  {
    key:   "лыжи_юноши",
    label: "Старт лыжи (юноши)",
    columns: JSON.stringify([
      "№", "ФИО", "Учебное заведение", "Пол", "Время", "Очки",
    ]),
    unit: "сек",
    gender: "boys",
  },
];

/* upsert для каждой дисциплины */
await prisma.$transaction(
  initial.map((d) =>
    prisma.discipline.upsert({
      where:  { key: d.key },
      update: d,
      create: d,
    }),
  ),
);

console.log("✅  Дисциплины успешно занесены / обновлены");
await prisma.$disconnect();
process.exit();
