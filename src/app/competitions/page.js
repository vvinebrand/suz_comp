"use client";
import { useState, useEffect } from "react";

const tabs = [
  { key: "стрельба",          label: "Стрельба" },
  { key: "силовые_девушки",   label: "Силовые упражнения (девушки)" },
  { key: "силовые_юноши",     label: "Силовые упражнения (юноши)" },
  { key: "лыжи_девушки",      label: "Старт лыжи (девушки)" },
  { key: "лыжи_юноши",        label: "Старт лыжи (юноши)" },
];

export default function CompetitionsPage() {
  const [active, setActive]  = useState(tabs[0].key);
  const [mode,   setMode]    = useState("individual");
  const [scope,  setScope]   = useState("all"); // region | city | all
  const [columns, setCols]   = useState([]);
  const [rows,    setRows]   = useState([]);
  const [editId,  setEditId] = useState(null);      // id строки, редактируемой сейчас
  const [draft,   setDraft]  = useState({ value:"", points:"" });

  /* загрузка */
  const load = async (key, md, sc) => {
    const json = await fetch(`/api/competitions?key=${key}&mode=${md}&scope=${sc}`).then(r=>r.json());
    setCols(json.columns);
    setRows(json.rows);
    setEditId(null);
  };
  useEffect(()=>{ load(active, mode, scope); }, [active, mode, scope]);

  /* сохранить */
  const saveRow = async (row) => {
    await fetch("/api/competitions", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        participantId: row.id,
        disciplineKey: active,
        value:  draft.value  || null,
        points: draft.points || null,
      }),
    });
    load(active, mode, scope);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Соревнования</h1>

      {/* режим участия */}
      <div className="flex gap-4 mb-4">
        {[{key:"individual",label:"Индивидуальный"},
          {key:"team",label:"Командный"}].map(t=>(
          <button key={t.key} onClick={()=>setMode(t.key)}
            className={(mode===t.key
                      ?"border-blue-600 text-blue-600"
                      :"border-transparent text-gray-600 hover:text-gray-800")
                    +" px-4 py-1 border-b-2 font-medium"}>
            {t.label}
          </button>
        ))}

        <select value={scope} onChange={e=>setScope(e.target.value)}
                className="border px-3 py-1 rounded ml-4">
          <option value="region">Область</option>
          <option value="city">Город</option>
          <option value="all">Все</option>
        </select>
      </div>

      {/* вкладки */}
      <div className="flex border-b mb-4">
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setActive(t.key)}
            className={(active===t.key
              ?"border-blue-600 text-blue-600"
              :"border-transparent text-gray-600 hover:text-gray-800")
              +" px-4 py-2 -mb-px border-b-2 font-medium"}>
            {t.label}
          </button>
        ))}
      </div>

      {/* таблица */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm text-gray-700 border-collapse rounded-md overflow-hidden shadow-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {columns.map((c,i)=>(
                <th key={i} className="px-3 py-2 font-medium border border-gray-200 bg-gray-100 whitespace-nowrap">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2 font-medium border border-gray-200 bg-gray-100 whitespace-nowrap" />
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r,i)=>(
              <tr key={r.id}>
                {/* --- фиксированные колонки --- */}
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{i+1}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">
                  {`${r.lastName} ${r.firstName}`}
                </td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{r.abbrev}</td>
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">{r.gender}</td>

                {/* --- value --- */}
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">
                  {editId===r.id
                    ? <input value={draft.value}
                             onChange={e=>setDraft(d=>({...d,value:e.target.value}))}
                             onKeyDown={e=>{ if(e.key==="Enter") saveRow(r); }}
                             className="w-24 border border-gray-300 rounded px-1 py-0.5"/>
                    : (r.value ?? "—")}
                </td>

                {/* --- points --- */}
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">
                  {editId===r.id
                    ? <input type="number"
                             value={draft.points}
                             onChange={e=>setDraft(d=>({...d,points:e.target.value}))}
                             onKeyDown={e=>{ if(e.key==="Enter") saveRow(r); }}
                             className="w-20 border border-gray-300 rounded px-1 py-0.5"/>
                    : (r.points ?? "—")}
                </td>

                {/* --- действия --- */}
                <td className="px-3 py-2 border border-gray-100 whitespace-nowrap">
                  {editId===r.id ? (
                    <>
                      <button onClick={()=>saveRow(r)}  className="text-green-600 mr-2">💾</button>
                      <button onClick={()=>setEditId(null)} className="text-gray-500">✖</button>
                    </>
                  ) : (
                    <button onClick={()=>{
                              setEditId(r.id);
                              setDraft({ value:r.value||"", points:r.points||"" });
                            }}
                            className="text-blue-600">
                      {r.value==null&&r.points==null ? "➕ Добавить" : "✏️ Редакт."}
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {rows.length===0 && (
              <tr>
                <td colSpan={columns.length+1}
                    className="px-6 py-6 text-center text-gray-500">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
