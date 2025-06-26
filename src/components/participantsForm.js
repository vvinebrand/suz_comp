"use client";

import { useState } from "react";

/* диапазон годов (текущий − 80 назад) */
const thisYear = new Date().getFullYear();
const years = Array.from({ length: 80 }, (_, i) => thisYear - i); // [2025, 2024, …]

export default function ParticipantsForm({ onAdded }) {
  const [form, setForm] = useState({
    lastName:    "",
    firstName:   "",
    abbrev:      "",
    institution: "",
    birthYear:   "",
    gender:      "Ж",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("/api/participants", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });

    /* сброс */
    setForm({
      lastName: "", firstName: "", abbrev: "",
      institution: "", birthYear: "", gender: "Ж",
    });
    onAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid grid-cols-1 sm:grid-cols-6 gap-4"
    >
      {/* Фамилия / Имя */}
      {["lastName", "firstName"].map((f) => (
        <input
          key={f}
          name={f}
          value={form[f]}
          onChange={handleChange}
          placeholder={f === "lastName" ? "Фамилия" : "Имя"}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none"
        />
      ))}

      {/* Сокращение */}
      <input
        name="abbrev"
        value={form.abbrev}
        onChange={handleChange}
        placeholder="Сокращение СУЗа (напр. НАТК)"
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none"
      />

      {/* Полное название СУЗа */}
      <input
        name="institution"
        value={form.institution}
        onChange={handleChange}
        placeholder="Учебное заведение"
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none col-span-full sm:col-auto"
      />

      {/* Год рождения */}
      <select
        name="birthYear"
        value={form.birthYear}
        onChange={handleChange}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none col-span-full sm:col-auto"
      >
        <option value="">Год рождения</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Пол */}
      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none col-span-full sm:col-auto"
      >
        <option>Ж</option>
        <option>М</option>
      </select>

      {/* Кнопка */}
      <button
        type="submit"
        className="col-span-full bg-blue-400 text-white rounded hover:bg-blue-500 px-4 py-2"
      >
        Добавить участника
      </button>
    </form>
  );
}
