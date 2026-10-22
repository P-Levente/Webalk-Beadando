const OSZLOPOK = [
  "id",
  "rendszam",
  "marka",
  "modell",
  "evjarat",
  "uzemanyag",
  "napiAr",
  "berelheto",
  "bereltnapok",
];

let id = 0;
let autok = [];
let torlesf = 0;
let maxid = 0;
let berles = false;
let szerk = false;
let fajlKezelo = null; // File System Access API fájlkezelő (Chrome / Edge)
const menu = document.getElementById("MainCustomizingmenu");

/* ===== Segédfüggvények ===== */
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

/* ===== CSV kezelés (különálló szerver nélkül) ===== */
function csvParse(szoveg) {
  szoveg = szoveg.replace(/^\uFEFF/, "");
  const sorok = [];
  let sor = [],
    mezo = "",
    idezet = false;
  for (let i = 0; i < szoveg.length; i++) {
    const c = szoveg[i];
    if (idezet) {
      if (c === '"') {
        if (szoveg[i + 1] === '"') {
          mezo += '"';
          i++;
        } else idezet = false;
      } else mezo += c;
    } else if (c === '"') idezet = true;
    else if (c === ";") {
      sor.push(mezo);
      mezo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && szoveg[i + 1] === "\n") i++;
      sor.push(mezo);
      mezo = "";
      sorok.push(sor);
      sor = [];
    } else mezo += c;
  }
  if (mezo !== "" || sor.length) {
    sor.push(mezo);
    sorok.push(sor);
  }
  return sorok.filter((s) => s.some((x) => x.trim() !== ""));
}
let oid = 0;
function csvBetolt(szoveg) {
  const sorok = csvParse(szoveg);
  if (sorok.length === 0) return [];
  const fejlec = sorok[0].map((h) => h.trim());
  return sorok.slice(1).map((s) => {
    const o = {};
    fejlec.forEach((h, i) => (o[h] = (s[i] ?? "").trim()));
    return {
      id: Number(o.id),
      rendszam: o.rendszam,
      marka: o.marka,
      modell: o.modell,
      evjarat: Number(o.evjarat),
      uzemanyag: o.uzemanyag,
      napiAr: Number(o.napiAr),
      berelheto: o.berelheto === "true",
      bereltnapok: Number(o.bereltnapok) || 0,
    };
  });
}

function csvKeszit(lista) {
  const cella = (v) => {
    const s = String(v ?? "");
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const sorok = [OSZLOPOK.join(";")];
  lista.forEach((a) => sorok.push(OSZLOPOK.map((k) => cella(a[k])).join(";")));
  return "\uFEFF" + sorok.join("\r\n") + "\r\n";
}

/* ===== Fájlkezelő tárolása (IndexedDB), hogy ne kelljen mindig újra kiválasztani ===== */
function idb() {
  return new Promise((ok, hiba) => {
    const r = indexedDB.open("autokolcsonzo", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => hiba(r.error);
  });
}
async function idbGet() {
  const db = await idb();
  return new Promise((ok, hiba) => {
    const q = db.transaction("kv").objectStore("kv").get("kezelo");
    q.onsuccess = () => ok(q.result);
    q.onerror = () => hiba(q.error);
  });
}
async function idbSet(v) {
  const db = await idb();
  return new Promise((ok, hiba) => {
    const q = db
      .transaction("kv", "readwrite")
      .objectStore("kv")
      .put(v, "kezelo");
    q.onsuccess = () => ok();
    q.onerror = () => hiba(q.error);
  });
}

/* ===== Betöltés / mentés ===== */
function allapotFrissit() {
  const el = document.getElementById("allapot");
  if (fajlKezelo)
    el.textContent =
      "Csatlakoztatott fájl: " +
      fajlKezelo.name +
      " (a módosítások automatikusan mentődnek)";
  else if (autok.length || maxid)
    el.textContent =
      "Nincs csatlakoztatott fájl – mentéskor az autok.csv letöltődik.";
  else el.textContent = "";
}

async function betoltFajlbol() {
  const fajl = await fajlKezelo.getFile();
  autok = csvBetolt(await fajl.text());
  maxid = autok.reduce((m, a) => Math.max(m, a.id), 0);
  allapotFrissit();
  feltoltes();
}

async function fajlMegnyitas() {
  try {
    const [kezelo] = await window.showOpenFilePicker({
      types: [{ description: "CSV fájl", accept: { "text/csv": [".csv"] } }],
    });
    if ((await kezelo.requestPermission({ mode: "readwrite" })) !== "granted") {
      alert("A fájl írásához engedély kell!");
      return;
    }
    fajlKezelo = kezelo;
    try {
      await idbSet(kezelo);
    } catch (e) {
      console.warn(e);
    }
    await betoltFajlbol();
  } catch (hiba) {
    if (hiba.name !== "AbortError") {
      console.error(hiba);
      alert("Nem sikerült megnyitni a fájlt!");
    }
  }
}

async function folytatas() {
  try {
    if (
      (await fajlKezelo.requestPermission({ mode: "readwrite" })) !== "granted"
    )
      throw new Error("Nincs engedély");
    await betoltFajlbol();
  } catch (hiba) {
    console.error(hiba);
    fajlKezelo = null;
    kezdoKepernyo(false);
    alert("Nem sikerült újra megnyitni a fájlt, válassza ki kézzel.");
  }
}

// Tartalék megoldás (Firefox/Safari): fájl beolvasása, mentés letöltésként
async function fajlValasztva(input) {
  const fajl = input.files[0];
  if (!fajl) return;
  autok = csvBetolt(await fajl.text());
  maxid = autok.reduce((m, a) => Math.max(m, a.id), 0);
  fajlKezelo = null;
  allapotFrissit();
  feltoltes();
}

async function autokMentese() {
  const szoveg = csvKeszit(autok);
  if (fajlKezelo) {
    const iro = await fajlKezelo.createWritable();
    await iro.write(szoveg);
    await iro.close();
  } else {
    const url = URL.createObjectURL(
      new Blob([szoveg], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "autok.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function mentesEsFrissites() {
  try {
    await autokMentese();
    feltoltes();
    exit();
  } catch (hiba) {
    console.error(hiba);
    alert("Nem sikerült elmenteni az adatokat!");
  }
}

function kezdoKepernyo(vanMentettFajl) {
  const tamogatott = "showOpenFilePicker" in window;
  let html =
    '<div class="kezdo"><p>Válassza ki az <b>autok.csv</b> fájlt a használathoz.</p>';
  if (tamogatott) {
    if (vanMentettFajl)
      html += `<button onclick="folytatas()">Folytatás: ${esc(fajlKezelo.name)}</button>`;
    html += '<button onclick="fajlMegnyitas()">autok.csv megnyitása</button>';
  } else {
    html +=
      '<input type="file" accept=".csv" onchange="fajlValasztva(this)">' +
      "<p>Ez a böngésző nem tud közvetlenül fájlba írni, ezért mentéskor az autok.csv letöltődik. Teljes működéshez használjon Chrome-ot vagy Edge-et.</p>";
  }
  document.getElementById("datatable").innerHTML = html + "</div>";
}

async function indulas() {
  if ("showOpenFilePicker" in window) {
    try {
      const mentett = await idbGet();
      if (mentett) {
        fajlKezelo = mentett;
        if (
          (await mentett.queryPermission({ mode: "readwrite" })) === "granted"
        ) {
          await betoltFajlbol();
          return;
        }
        kezdoKepernyo(true);
        return;
      }
    } catch (e) {
      console.warn(e);
    }
  }
  kezdoKepernyo(false);
}

/* ===== Táblázat ===== */
function feltoltes() {
  let h = `<table id="data"><tr>
    <td>Autó Id</td><td>Rendszám</td><td>Márka</td><td>Modell</td>
    <td>Évjárat</td><td>Üzemanyag</td><td>Napiár(ft)</td><td>Bérelhető</td></tr>`;
  autok.forEach((a) => {
    h += `<tr onclick="selectCar(${Number(a.id)})"><td>${esc(a.id)}</td><td>${esc(a.rendszam)}</td><td>${esc(a.marka)}</td>
      <td>${esc(a.modell)}</td><td>${esc(a.evjarat)}</td><td>${esc(a.uzemanyag)}</td><td>${esc(a.napiAr)}</td>
      <td>${a.berelheto ? "igen" : "nem (még " + esc(a.bereltnapok) + " napig)"}</td></tr>`;
    if (a.id > maxid) maxid = a.id;
  });
  document.getElementById("datatable").innerHTML = h + "</table>";
}

/* ===== Közös űrlap (hozzáadás / szerkesztés) ===== */
function urlapHtml(p, a, mentes) {
  return `<div id="Customizingmenu">
    Rendszám: <input type="text" id="${p}rendszam" value="${esc(a.rendszam)}">
    <br>Márka: <input type="text" id="${p}marka" value="${esc(a.marka)}">
    <br>Modell: <input type="text" id="${p}modell" value="${esc(a.modell)}">
    <br>Évjárat: <input type="number" id="${p}evjarat" value="${esc(a.evjarat)}">
    <br>Üzemanyag: <input type="text" id="${p}uzemanyag" value="${esc(a.uzemanyag)}">
    <br>Napiár: <input type="number" id="${p}napiAr" value="${esc(a.napiAr)}">
    <br>Bérelhető:<br>
    <input name="${p}berelheto" type="radio" id="${p}berelhetotrue" ${a.berelheto ? "checked" : ""}>Igen<br>
    <input name="${p}berelheto" type="radio" id="${p}berelhetofalse" ${a.berelheto ? "" : "checked"}>Nem<br>
    <div id="${p}bereltnapokcontainer">Még hány napig:
      <input type="number" min="1" id="${p}bereltnapok" value="${esc(a.bereltnapok || 1)}"></div>
    <button onclick="${mentes}()">Mentés</button>
    <button onclick="exit()">Kilépés</button>
  </div>`;
}

function urlapKapcsolas(p) {
  const frissit = () => {
    document.getElementById(p + "bereltnapokcontainer").style.display =
      document.getElementById(p + "berelhetotrue").checked ? "none" : "block";
  };
  document
    .getElementById(p + "berelhetotrue")
    .addEventListener("change", frissit);
  document
    .getElementById(p + "berelhetofalse")
    .addEventListener("change", frissit);
  frissit();
}

function urlapOlvas(p) {
  const ertek = (k) => document.getElementById(p + k).value.trim();
  const berelheto = document.getElementById(p + "berelhetotrue").checked;
  const adat = {
    rendszam: ertek("rendszam").toUpperCase(),
    marka: ertek("marka"),
    modell: ertek("modell"),
    evjarat: Number(ertek("evjarat")),
    uzemanyag: ertek("uzemanyag"),
    napiAr: Number(ertek("napiAr")),
    berelheto,
    bereltnapok: berelheto ? 0 : Number(ertek("bereltnapok")),
  };
  if (!adat.rendszam || !adat.marka || !adat.modell || !adat.uzemanyag) {
    alert("Minden szöveges mezőt ki kell tölteni!");
    return null;
  }
  if (!adat.evjarat || adat.napiAr < 0 || ertek("napiAr") === "") {
    alert("Az évjárat és a napiár érvényes szám kell legyen!");
    return null;
  }
  if (!berelheto && !(adat.bereltnapok >= 1)) {
    alert("A bérelt napok száma legalább 1 legyen!");
    return null;
  }
  return adat;
}

/* ===== Hozzáadás ===== */
function add() {
  menu.innerHTML = urlapHtml(
    "add",
    {
      rendszam: "",
      marka: "",
      modell: "",
      evjarat: "",
      uzemanyag: "",
      napiAr: "",
      berelheto: true,
      bereltnapok: 1,
    },
    "addsave",
  );
  urlapKapcsolas("add");
}

async function addsave() {
  const adat = urlapOlvas("add");
  if (!adat) return;
  if (autok.some((a) => a.rendszam === adat.rendszam)) {
    alert("Ilyen rendszámú autó már létezik!");
    return;
  }
  autok.push({ id: maxid + 1, ...adat });
  await mentesEsFrissites();
}

/* ===== Szerkesztés ===== */
function change() {
  const bevitel = prompt("Adja meg a módosítani kívánt autó ID-jét:");
  if (bevitel === null) return;
  id = Number(bevitel);
  const auto = autok.find((a) => a.id === id);
  if (!auto) {
    alert("Nincs ilyen ID-jű autó!");
    return;
  }
  menu.innerHTML = urlapHtml("change", auto, "changesave");
  urlapKapcsolas("change");
}

async function changesave() {
  const auto = autok.find((a) => a.id === id);
  const adat = urlapOlvas("change");
  if (!auto || !adat) return;
  if (autok.some((a) => a.id !== id && a.rendszam === adat.rendszam)) {
    alert("Ilyen rendszámú autó már létezik!");
    return;
  }
  Object.assign(auto, adat);
  await mentesEsFrissites();
}

/* ===== Törlés ===== */
function del() {
  menu.innerHTML = `<div id="Customizingmenu">Mi szerint akarja törölni az autót?<br>
  <button onclick="delid()">ID szerint</button>
  <button onclick="delrendszam()">Rendszám szerint</button>
  <button onclick="exit()">Kilépés</button></div>`;
}
function delid() {
  menu.innerHTML = `<div id="Customizingmenu">Adja meg a törölni kívánt autó ID-jét:<br>
  <input name="delid" type="number" id="delidinput">
  <button id="deltorles">Törlés</button>
  <button onclick="exit()">Kilépés</button></div>`;
  document.getElementById("deltorles").addEventListener("click", () => {
    torlesf = 1;
    deletesave();
  });
}
function delrendszam() {
  menu.innerHTML = `<div id="Customizingmenu">Adja meg a törölni kívánt autó rendszámát:<br>
  <input name="delrendszam" type="text" id="delrendszaminput">
  <button id="deltorles">Törlés</button>
  <button onclick="exit()">Kilépés</button></div>`;
  document.getElementById("deltorles").addEventListener("click", () => {
    torlesf = 2;
    deletesave();
  });
}
async function deletesave() {
  const ujautok = autok.filter((a) =>
    torlesf === 1
      ? a.id != document.getElementById("delidinput").value
      : a.rendszam.toUpperCase() !==
        document.getElementById("delrendszaminput").value.trim().toUpperCase(),
  );
  if (ujautok.length === autok.length) {
    alert("Nincs ilyen autó!");
    return;
  }
  ujautok.forEach((a, i) => (a.id = i + 1)); // az ID-k újraszámozása, mint eddig
  autok = ujautok;
  maxid = autok.length;
  await mentesEsFrissites();
}

/* ===== Menü ===== */
function exit() {
  menu.innerHTML = "";
}
function fszerk() {
  const nav = document.getElementById("szerkeztes");
  if (szerk) {
    szerk = false;
    document.getElementById("buttons").innerHTML = "";
    nav.textContent = "Flotta Szerkesztése";
    menu.innerHTML = "";
  } else {
    szerk = true;
    nav.textContent = "Flotta Szerkesztésének abbahagyása";
    document.getElementById("buttons").innerHTML =
      `<button id="Add" onclick="add()">Hozzáadás</button>
       <button id="change" onclick="change()">Szerkesztés</button>
       <button id="Delete" onclick="del()">Törlés</button>`;
  }
}
function berel() {
  if (berles) {
    berles = false;
    document.getElementById("berles").textContent = "Bérlés";
    menu.innerHTML = "";
  } else {
    berles = true;
    document.getElementById("berles").textContent = "Bérlés Visszavonása";
  }
}

/* ===== Bérlés ===== */
function selectCar(aid) {
  if (!berles || szerk) return;
  const auto = autok.find((a) => a.id === aid);
  if (!auto) return alert("Nincs ilyen autó!");
  if (!auto.berelheto) return alert("Az autó nem bérelhető.");
  id = aid;
  autoberel();
}
function autoberel() {
  menu.innerHTML = `<div id="Customizingmenu">Adja meg, hány napig béreli az autót:<br>
  <input name="bereltnapok" type="number" min="1" id="bereltnapokinput">
  <button onclick="autoberelsave()">Mentés</button>
  <button onclick="exit()">Kilépés</button></div>`;
}
async function autoberelsave() {
  const napok = Number(document.getElementById("bereltnapokinput").value);
  if (!(napok >= 1)) {
    alert("Adjon meg legalább 1 napot!");
    return;
  }
  const auto = autok.find((a) => a.id === id);
  if (!auto) return;
  auto.bereltnapok = napok;
  auto.berelheto = false;
  await mentesEsFrissites();
}

indulas();
