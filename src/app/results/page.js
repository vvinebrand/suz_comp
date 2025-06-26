// src/app/results/page.js
"use client";

import { useState, useRef } from "react";

const initialCompetitions = [
  {
    key: "стрельба",
    label: "Стрельба",
    columns: ["№", "ФИО", "Учебное заведение", "Пол", "Результат", "Очки"],
  },
  {
    key: "силовые_девушки",
    label: "Силовые упражнения (девушки)",
    columns: ["№", "ФИО", "Учебное заведение", "Пол", "Повторения", "Очки"],
  },
  {
    key: "силовые_юноши",
    label: "Силовые упражнения (юноши)",
    columns: ["№", "ФИО", "Учебное заведение", "Пол", "Повторения", "Очки"],
  },
  {
    key: "лыжи_девушки",
    label: "Старт лыжи (девушки)",
    columns: ["№", "ФИО", "Учебное заведение", "Пол", "Время", "Очки"],
  },
  {
    key: "лыжи_юноши",
    label: "Старт лыжи (юноши)",
    columns: ["№", "ФИО", "Учебное заведение", "Пол", "Время", "Очки"],
  },
];

export default function ResultsPage() {
  const [comps, setComps] = useState(initialCompetitions);
  const [activeKey, setActiveKey] = useState(comps[0].key);
  const [rowsByKey, setRowsByKey] = useState(
    () => comps.reduce((acc, c) => ({ ...acc, [c.key]: [] }), {})
  );
  const [isEditing, setIsEditing] = useState(false);

  const originalColumnsRef = useRef({});
  const originalRowsRef = useRef({});

  const activeComp = comps.find((c) => c.key === activeKey);
  const activeRows = rowsByKey[activeKey];

  const startEditing = () => {
    originalColumnsRef.current[activeKey] = [...activeComp.columns];
    originalRowsRef.current[activeKey] = activeRows.map((r) => ({ ...r }));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setComps((arr) =>
      arr.map((c) =>
        c.key === activeKey
          ? { ...c, columns: originalColumnsRef.current[activeKey] }
          : c
      )
    );
    setRowsByKey((m) => ({
      ...m,
      [activeKey]: originalRowsRef.current[activeKey],
    }));
    setIsEditing(false);
  };

  const saveEditing = () => {
    setIsEditing(false);
  };

  const changeColumnName = (idx, value) => {
    setComps((arr) =>
      arr.map((c) =>
        c.key === activeKey
          ? {
              ...c,
              columns: c.columns.map((col, i) => (i === idx ? value : col)),
            }
          : c
      )
    );
  };

  const changeCell = (rowIdx, colIdx, value) => {
    setRowsByKey((m) => {
      const newRows = m[activeKey].map((row, i) =>
        i === rowIdx
          ? { ...row, [activeComp.columns[colIdx]]: value }
          : row
      );
      return { ...m, [activeKey]: newRows };
    });
  };

  const addRow = () => {
    const empty = {};
    activeComp.columns.forEach((col) => {
      empty[col] = "";
    });
    setRowsByKey((m) => ({
      ...m,
      [activeKey]: [...m[activeKey], empty],
    }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Результаты</h1>

      {/* Табы соревнований */}
      <div className="flex border-b border-gray-200 mb-4">
        {comps.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setActiveKey(c.key);
              setIsEditing(false);
            }}
            className={
              (activeKey === c.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800") +
              " px-4 py-2 -mb-px border-b-2 font-medium"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center mb-4 space-x-2">
        {!isEditing ? (
          <>
            <button
              onClick={startEditing}
              className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
            >
              Редактировать
            </button>
            <button
              onClick={addRow}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Добавить строку
            </button>
          </>
        ) : (
          <>
            <button
              onClick={saveEditing}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Сохранить
            </button>
            <button
              onClick={cancelEditing}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Отменить
            </button>
          </>
        )}
      </div>

      {/* Таблица результатов */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {activeComp.columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {isEditing ? (
                    <input
                      value={col}
                      onChange={(e) => changeColumnName(idx, e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  ) : (
                    col
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeRows.length > 0 ? (
              activeRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {activeComp.columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          value={row[col] ?? ""}
                          onChange={(e) => changeCell(rIdx, cIdx, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={activeComp.columns.length}
                  className="px-4 py-2 text-center text-gray-500"
                >
                  Нет данных — нажмите «Добавить строку»
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);
}
