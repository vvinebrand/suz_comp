"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import dayjs from "dayjs";

/* ---------- заголовки без изменений ---------- */
const initialCols = {
  girls : ["№ п/п","Фамилия, Имя","СУЗ","Год",
           "ВП-3","очки","рез.","Силовая","рез.","очки",
           "Лыжная гонка 2 км","рез.","очки",
           "Сумма очков","место"],

  boys  : ["№ п/п","Фамилия, Имя","СУЗ","Год",
           "ВП-3","очки","рез.","Силовая","рез.","очки",
           "Лыжная гонка 3 км","рез.","очки",
           "Сумма очков","место"],

  region: ["№ п/п","Фамилия, Имя","СУЗ","Год",
           "ВП-3","очки","рез.","Силовая","рез.","очки",
           "Лыжная гонка 2км","рез","очки",
           "Сумма очков","СО 3х уч.","место"],

  city  : ["№ п/п","Фамилия, Имя","СУЗ","Год",
           "ВП-3","очки","рез.","Силовая","рез.","очки",
           "Лыжная гонка 2км","рез","очки",
           "Сумма очков","СО 3х уч.","место"],
};

export default function FinalPage() {
  const [eventDate, setEventDate] = useState(dayjs().format("YYYY-MM-DD"));
  /* вкладки / фильтры ------------------------------------------------ */
  const [activeTab, setActiveTab] = useState("individual"); // individual | team
  const [gender,    setGender   ] = useState("girls");      // girls | boys
  const [scope,     setScope    ] = useState("region");     // region | city | all
  const [isEditing, setIsEditing] = useState(false);

  /* заголовки, редактируемые пользователем --------------------------- */
  const [colsGirls,  setColsGirls ] = useState(initialCols.girls);
  const [colsBoys,   setColsBoys  ] = useState(initialCols.boys);
  const [colsRegion, setColsRegion] = useState(initialCols.region);
  const [colsCity,   setColsCity  ] = useState(initialCols.city);

  const originalRef = useRef({});

  const startEdit  = () => {
    originalRef.current = { girls:colsGirls, boys:colsBoys,
                            region:colsRegion, city:colsCity };
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setColsGirls (originalRef.current.girls );
    setColsBoys  (originalRef.current.boys  );
    setColsRegion(originalRef.current.region);
    setColsCity  (originalRef.current.city  );
    setIsEditing(false);
  };
  const saveEdit   = () => setIsEditing(false);

  const changeCol = (list,setList,i,val)=>
    setList(list.map((c,idx)=>idx===i?val:c));

  /* выбор текущего массива заголовков -------------------------------- */
  const currentCols =
    activeTab==="individual"
      ? (gender==="girls"?colsGirls:colsBoys)
      : (scope==="region"?colsRegion:scope==="city"?colsCity:colsRegion);

  /* ---------- загрузка данных от API ---------- */
  const [rows,setRows] = useState([]);
  // const load = async ()=>{
  //   const qs = new URLSearchParams({ mode:activeTab, gender, scope });
  //   const res = await fetch(`/api/final?${qs}`);
  //   const j   = await res.json();
  //   setRows(j.rows);
  // };
  async function downloadPdf() {
  const body = {
    mode : activeTab,
    gender,
    scope,
    date : eventDate,
    allTabs : false
  };

  const res  = await fetch("/api/final/pdf", {
    method : "POST",
    headers: { "Content-Type":"application/json" },
    body   : JSON.stringify(body)
  });
  if (!res.ok) { alert("Ошибка PDF"); return; }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "itogi.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
  useEffect(() => {
  async function fetchRows() {
    const qs  = new URLSearchParams({ mode:activeTab, gender, scope });
    const res = await fetch(`/api/final?${qs}`);
    const j   = await res.json();
    setRows(j.rows);
  }
  fetchRows();
}, [activeTab, gender, scope]);


  /* ---------- вспом. функция для thead ---------- */
  const renderHeaderCell = (idx,row=1,col=1)=>(
    <th key={idx} rowSpan={row} colSpan={col}
        className="px-3 py-2 font-medium border border-gray-200 bg-gray-100 whitespace-nowrap">
      {isEditing ? (
        <input value={currentCols[idx]}
               onChange={e=>{
                 const maps = activeTab==="individual"
                              ? (gender==="girls"?[colsGirls,setColsGirls]
                                                :[colsBoys, setColsBoys])
                              : (scope==="region"||scope==="all"
                                  ?[colsRegion,setColsRegion]
                                  :[colsCity  ,setColsCity ]);
                 changeCol(...maps, idx, e.target.value);
               }}
               className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"/>
      ) : currentCols[idx]}
    </th>
  );

  /* ---------- разметка ---------- */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Итоги</h1>

      {/* вкладки Individual / Team */}
      <div className="flex border-b mb-4">
        {[
          {key:"individual",label:"Индивидуальный"},
          {key:"team",      label:"Командный"   },
        ].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={(activeTab===t.key
                       ?"border-blue-600 text-blue-600"
                       :"border-transparent text-gray-600 hover:text-gray-800")
                      +" px-4 py-2 -mb-px border-b-2 font-medium"}>
            {t.label}
          </button>
        ))}
      </div>

      {/* селекторы пола и охвата */}
      <div className="flex gap-4 mb-4">
        <select value={gender} disabled={activeTab==="team"}
                onChange={e=>setGender(e.target.value)}
                className="border px-3 py-1 rounded">
          <option value="girls">Девушки</option>
          <option value="boys" >Юноши</option>
        </select>

        <select value={scope}
                onChange={e=>setScope(e.target.value)}
                className="border px-3 py-1 rounded">
          <option value="region">Область</option>
          <option value="city"  >Город</option>
          <option value="all"   >Общее</option>
        </select>
      </div>

      {/* кнопки редактирования заголовков */}
      <div className="flex items-center mb-4 space-x-2">
        {!isEditing
          ? <button onClick={startEdit}
                    className="px-3 py-1 bg-blue-400 text-white rounded hover:bg-blue-500">
              Редактировать заголовки
            </button>
          : <>
              <button onClick={saveEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                Сохранить
              </button>
              <button onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                Отменить
              </button>
            </>
        }
        {/* выбор даты */}
        <label className="flex items-center gap-2 text-sm">
          Дата:&nbsp;
          <input
            type="date"
            value={eventDate}
            onChange={(e)=>setEventDate(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </label>
        <button
          onClick={downloadPdf}
          className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded"
        >
          Скачать PDF
        </button>
      </div>

      {/* -------------------- ТАБЛИЦА -------------------- */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm text-gray-700 border-collapse rounded-md overflow-hidden shadow-sm">
          <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
            <tr>
              {renderHeaderCell(0,2)}
              {renderHeaderCell(1,2)}
              {renderHeaderCell(2,2)}
              {renderHeaderCell(3,2)}
              {renderHeaderCell(4,1,2)}  {/* ВП-3 colspan 2 */}
              {renderHeaderCell(7,1,2)}  {/* Силовая */}
              {renderHeaderCell(10,1,2)} {/* Лыжи */}
              {renderHeaderCell(13,2)}   {/* Сумма очков */}
              {activeTab==="team" && renderHeaderCell(14,2)}  {/* Сумма топ-3 */}
              {renderHeaderCell(activeTab==="team"?15:14,2)}  {/* место */}
            </tr>
            <tr>
              {renderHeaderCell(5)}
              {renderHeaderCell(6)}
              {renderHeaderCell(8)}
              {renderHeaderCell(9)}
              {renderHeaderCell(11)}
              {renderHeaderCell(12)}
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              activeTab === "team" ? (
                (() => {
                  let idx = 0;
                  return rows.map((team) => (
                    <Fragment key={team.institution}>
                      <tr>
                        <td
                          colSpan={currentCols.length}
                          className="px-3 py-2 font-semibold text-center bg-gray-50 border border-gray-100"
                        >
                          {team.institution}
                        </td>
                      </tr>
                      {team.participants.map((p, i) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 border border-gray-100">{++idx}</td>
                          <td className="px-3 py-2 border border-gray-100">
                            {p.lastName} {p.firstName}
                          </td>
                          <td className="px-3 py-2 border border-gray-100">{p.abbrev}</td>
                          <td className="px-3 py-2 border border-gray-100">{p.birthYear}</td>

                          <td className="px-3 py-2 border border-gray-100">{p.vp3_res ?? "—"}</td>
                          <td className="px-3 py-2 border border-gray-100">{p.vp3_pts ?? "—"}</td>

                          <td className="px-3 py-2 border border-gray-100">{p.str_res ?? "—"}</td>
                          <td className="px-3 py-2 border border-gray-100">{p.str_pts ?? "—"}</td>

                          <td className="px-3 py-2 border border-gray-100">{p.ski_res ?? "—"}</td>
                          <td className="px-3 py-2 border border-gray-100">{p.ski_pts ?? "—"}</td>

                          <td className="px-3 py-2 border border-gray-100">{p.total_points ?? "—"}</td>

                          <td className="px-3 py-2 border border-gray-100">
                            {i === 0 ? team.team_sum3 ?? "—" : ""}
                          </td>

                          <td className="px-3 py-2 border border-gray-100">
                            {i === 0 ? team.place ?? "—" : ""}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ));
                })()
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 border border-gray-100">{i + 1}</td>
                    <td className="px-3 py-2 border border-gray-100">
                      {r.lastName} {r.firstName}
                    </td>
                    <td className="px-3 py-2 border border-gray-100">{r.abbrev}</td>
                    <td className="px-3 py-2 border border-gray-100">{r.birthYear}</td>

                    <td className="px-3 py-2 border border-gray-100">{r.vp3_res ?? "—"}</td>
                    <td className="px-3 py-2 border border-gray-100">{r.vp3_pts ?? "—"}</td>

                    <td className="px-3 py-2 border border-gray-100">{r.str_res ?? "—"}</td>
                    <td className="px-3 py-2 border border-gray-100">{r.str_pts ?? "—"}</td>

                    <td className="px-3 py-2 border border-gray-100">{r.ski_res ?? "—"}</td>
                    <td className="px-3 py-2 border border-gray-100">{r.ski_pts ?? "—"}</td>

                    <td className="px-3 py-2 border border-gray-100">{r.total_points ?? "—"}</td>

                    {activeTab === "team" && (
                      <td className="px-3 py-2 border border-gray-100">
                        {r.team_sum3 ?? "—"}
                      </td>
                    )}

                    <td className="px-3 py-2 border border-gray-100">{r.place ?? "—"}</td>
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={currentCols.length} className="text-center px-3 py-2 border border-gray-100">
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
