// src/components/participantsTable.js
"use client";

import { useState, useEffect } from "react";

export default function ParticipantsTable({ reloadFlag, onReload }) {
  const [data, setData]     = useState([]);
  const [editRow, setEditRow]   = useState(null);   // объект участника или null
  const [editForm, setEditForm] = useState({});     // состояние модалки

  /* загрузка */
  const load = async () => {
    const res = await fetch("/api/participants");
    setData(await res.json());
  };
  useEffect(() => { load(); }, [reloadFlag]);

  /* удалить */
  const remove = async (id) => {
    await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
    onReload();
  };

  /* открыть модалку */
  const openEdit = (row) => {
    setEditForm({ ...row });
    setEditRow(row);
  };

  /* сохранить изменения */
  const saveEdit = async () => {
    await fetch("/api/participants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditRow(null);
    onReload();
  };

  return (
    <>
      {/* ---------- таблица ---------- */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm text-gray-700 border-collapse rounded-md overflow-hidden shadow-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {["№","Фамилия","Имя","СУЗ","Год","Пол",""].map(h=>(
                <th key={h}
                    className="px-3 py-2 font-medium border border-gray-200 bg-gray-100 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((p,i)=>(
              <tr key={p.id}>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{i+1}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{p.lastName}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{p.firstName}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{p.abbrev}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{p.birthYear}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{p.gender}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap space-x-2">
                  <button onClick={()=>openEdit(p)}  className="text-blue-600">✏️</button>
                  <button onClick={()=>remove(p.id)} className="text-red-600">🗑️</button>
                </td>
              </tr>
            ))}
            {data.length===0 && (
              <tr>
                <td colSpan={8} className="px-6 py-6 text-center text-gray-500">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- модалка редактирования ---------- */}
      {editRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem] space-y-4">
            <h2 className="text-lg font-semibold">Редактировать участника</h2>

            {/* поля формы */}
            {["lastName","firstName","abbrev","institution","birthYear","gender"].map((field)=>(
              <input
                key={field}
                name={field}
                value={editForm[field] ?? ""}
                onChange={(e)=>setEditForm(f=>({...f,[field]:e.target.value}))}
                placeholder={field}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none"
              />
            ))}

            <div className="flex justify-end space-x-2">
              <button onClick={()=>setEditRow(null)}
                      className="px-4 py-2 bg-gray-200 rounded">
                Отмена
              </button>
              <button onClick={saveEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
