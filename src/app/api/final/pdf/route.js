// src/app/api/final/pdf/route.js
import { NextResponse }               from "next/server";
import dayjs                          from "dayjs";
import { pdf, Document, Page, Text,
         View, StyleSheet }           from "@react-pdf/renderer";
import path               from "node:path";
import { Font }           from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  src   : path.resolve(
           process.cwd(),
           "src/fonts/Roboto-Regular.ttf"
         ),
});

// ──────────────────────────────────────────────────────────
// 1. стили
// ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page : { fontFamily:"Roboto", padding:24 },
  title: { textAlign:"center", fontSize:16, marginBottom:12 },

  table:{ width:"100%", borderWidth:1, borderColor:"#000" },

  row         : { flexDirection:"row" },
  rowHeader   : { flexDirection:"row", backgroundColor:"#f6f7f9" },

  cell        : { borderRightWidth:1, borderBottomWidth:1,
                  borderColor:"#000", fontSize:9, padding:4,
                  justifyContent:"center" },
  bold        : { fontWeight:700 },

  wN :{ width:"4%"  },
  wF :{ width:"16%" },
  wI :{ width:"16%" },
  wS :{ width:"10%" },
  wY :{ width:"6%"  },
  wTot:{ width:"10%"},
  wPlc:{ width:"6%" },

  wGrp:{ width:"12%", borderRightWidth:1, borderColor:"#000" },

  subCell:{ flex:1, borderBottomWidth:1, borderColor:"#000",
            alignItems:"center", paddingVertical:2 },
});

const Cell = ({w,children,style})=>(
  <View style={[styles.cell, w, style]}><Text>{children}</Text></View>);

const Group = ({title})=>(
  <View style={[styles.wGrp]}>

    <View style={[styles.cell, {borderBottomWidth:1}]}>
      <Text style={styles.bold}>{title}</Text>
    </View>

    <View style={{flexDirection:"row"}}>
      <View style={[styles.subCell,{borderRightWidth:1}]}><Text>рез.</Text></View>
      <View style={styles.subCell}><Text>очки</Text></View>
    </View>
  </View>
);

// ──────────────────────────────────────────────────────────
// 2. документ
// ──────────────────────────────────────────────────────────
function buildPdf({ caption, date, rows }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        {/* заголовки */}
        <Text style={styles.title}>{caption}</Text>
        <Text style={{textAlign:"right",fontSize:10,marginBottom:8}}>
          Дата проведения: {date}
        </Text>

        {/* ---- таблица ---- */}
        <View style={styles.table}>
          {/* шапка */}
          <View style={styles.rowHeader}>
            <Cell w={styles.wN } style={styles.bold}>№ п/п</Cell>
            <Cell w={styles.wF } style={styles.bold}>Фамилия</Cell>
            <Cell w={styles.wI } style={styles.bold}>Имя</Cell>
            <Cell w={styles.wS } style={styles.bold}>СУЗ</Cell>
            <Cell w={styles.wY } style={styles.bold}>Год</Cell>

            {/* три составные группы */}
            <Group title="ВП-3"      />
            <Group title="Силовая"   />
            <Group title="Лыжная гонка 2 км"/>

            <Cell w={styles.wTot} style={styles.bold}>Сумма очков</Cell>
            <Cell w={styles.wPlc} style={styles.bold}>Место</Cell>
          </View>

          {/* ---- данные ---- */}
          {rows.map((r,i)=>(
            <View key={r.id} style={styles.row}>
              <Cell w={styles.wN }>{i+1}</Cell>
              <Cell w={styles.wF }>{r.lastName}</Cell>
              <Cell w={styles.wI }>{r.firstName}</Cell>
              <Cell w={styles.wS }>{r.abbrev}</Cell>
              <Cell w={styles.wY }>{r.birthYear}</Cell>

              {/* ВП-3 */}
              <Cell w={{width:"6%"}}>{r.vp3_res ?? "—"}</Cell>
              <Cell w={{width:"6%"}}>{r.vp3_pts ?? "—"}</Cell>

              {/* Силовая */}
              <Cell w={{width:"6%"}}>{r.str_res ?? "—"}</Cell>
              <Cell w={{width:"6%"}}>{r.str_pts ?? "—"}</Cell>

              {/* Лыжи */}
              <Cell w={{width:"6%"}}>{r.ski_res ?? "—"}</Cell>
              <Cell w={{width:"6%"}}>{r.ski_pts ?? "—"}</Cell>

              <Cell w={styles.wTot}>{r.total_points ?? "—"}</Cell>
              <Cell w={styles.wPlc}>{r.place ?? "—"}</Cell>
            </View>
          ))}
        </View>

      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────
// 3. API-хендлер
// ──────────────────────────────────────────────────────────

export async function POST(req) {
  const {
    mode   = "individual",          // individual | team
    gender = "girls",               // girls | boys
    scope  = "region",              // region | city | all
    date   = dayjs().format("YYYY-MM-DD"),
  } = await req.json();

  const qs   = new URLSearchParams({ mode, gender, scope }).toString();
  const resp = await fetch(`${req.nextUrl.origin}/api/final?${qs}`);
  const { rows } = await resp.json();

  const doc = buildPdf({
    caption : mode === "individual" ? "Индивидуальный зачёт"
                                    : "Командный зачёт",
    date    : dayjs(date).format("DD.MM.YYYY"),
    rows,
  });
  const buffer = await pdf(doc).toBuffer();

  const safeDate = dayjs(date).format("YYYY-MM-DD");
  const filename = `itogi_${safeDate}.pdf`;

  const headers = new Headers({
    "content-type":
      "application/pdf",
    "content-disposition":
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });

  return new Response(buffer, { status: 200, headers });
}


