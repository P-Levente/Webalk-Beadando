let id = 0;
let autok = [
  {
    id: 1,
    rendszam: "ABC-123",
    marka: "Toyota",
    modell: "Corolla",
    evjarat: 2022,
    uzemanyag: "Benzin",
    napiAr: 15000,
    berelheto: true,
  },
  {
    id: 2,
    rendszam: "DEF-456",
    marka: "Volkswagen",
    modell: "Golf",
    evjarat: 2021,
    uzemanyag: "Dízel",
    napiAr: 17000,
    berelheto: true,
  },
  {
    id: 3,
    rendszam: "GHI-789",
    marka: "Ford",
    modell: "Focus",
    evjarat: 2020,
    uzemanyag: "Benzin",
    napiAr: 14000,
    berelheto: false,
  },
  {
    id: 4,
    rendszam: "JKL-321",
    marka: "BMW",
    modell: "320i",
    evjarat: 2023,
    uzemanyag: "Benzin",
    napiAr: 25000,
    berelheto: true,
  },
  {
    id: 5,
    rendszam: "MNO-654",
    marka: "Skoda",
    modell: "Octavia",
    evjarat: 2022,
    uzemanyag: "Dízel",
    napiAr: 18000,
    berelheto: true,
  },
  {
    id: 6,
    rendszam: "PQR-987",
    marka: "Kia",
    modell: "Ceed",
    evjarat: 2021,
    uzemanyag: "Benzin",
    napiAr: 14500,
    berelheto: false,
  },
  {
    id: 7,
    rendszam: "STU-147",
    marka: "Audi",
    modell: "A4",
    evjarat: 2023,
    uzemanyag: "Dízel",
    napiAr: 26000,
    berelheto: true,
  },
  {
    id: 8,
    rendszam: "VWX-258",
    marka: "Hyundai",
    modell: "i30",
    evjarat: 2020,
    uzemanyag: "Benzin",
    napiAr: 13000,
    berelheto: true,
  },
];
let torlesf = 0;
let maxid = 0;
let deleted = false;
const menu = document.getElementById("MainCustomizingmenu");
function feltoltes() {
    deleted = false;
    let jegyekTablazat = `<table>
        <tr>
          <td>Autó Id</td>
          <td>Rendszám</td>
          <td>Márka</td>
          <td>Modell</td>
          <td>Évjárat</td>
          <td>Üzemanyag</td>
          <td>Napiár(ft)</td>
          <td>Bérelhető</td>
        </tr>
        `;

  autok.forEach((i) => {
    jegyekTablazat +=
      "<tr><td>" +
      i.id +
      "</td><td>" +
      i.rendszam +
      "</td><td>" +
      i.marka +
      "</td><td>" +
      i.modell +
      "</td><td>" +
      i.evjarat +
      "</td><td>" +
      i.uzemanyag +
      "</td><td>" +
      i.napiAr +
      "</td><td>";
    if (i.berelheto) {
      jegyekTablazat += "igen</td></tr>";
    } else {
      jegyekTablazat += "nem</td></tr>";
    }
    if (i.id > maxid) {
      maxid = i.id;
    }
  });

  jegyekTablazat += "</table>";
  const tablazat = document.getElementById("datatable");
  tablazat.innerHTML = jegyekTablazat;
}

function add() {
  menu.innerHTML = `<div id="Customizingmenu">Rendszám: <input name="kocsirendszam" type="text" id="addrendszam">
    <br>Márka: <input name="kocsimarka" type="text" id="addmarka">
    <br>Modell: <input name="kocsimodell" type="text" id="addmodell">
    <br>Évjárat:<input name="kocsievjarat" type="number" id="addevjarat">
    <br>Üzemanyag: <input name="kocsiuzemanyag" type="text" id="adduzemanyag">
    <br>Napiár: <input name="kocsinapiAr" type="number" id="addnapiAr">
    <br>Bérelhető: <br>
     <input name="kocsiberelheto" type="radio" id="addberelhetotrue">Igen<br>
      <input name="kocsiberelheto" type="radio" id="addberelhetofalse">Nem<br>
     <button onclick="addsave()">Mentés</button>
     <button onclick="exit()">Kilépés</button></div>
     `;
}
function addsave() {
  let berelhetoseg = document.getElementById("addberelhetotrue");
  autok.push({
    id: maxid + 1,
    rendszam: document.getElementById("addrendszam").value.toUpperCase(),
    marka: document.getElementById("addmarka").value,
    modell: document.getElementById("addmodell").value,
    evjarat: document.getElementById("addevjarat").value,
    uzemanyag: document.getElementById("adduzemanyag").value,
    napiAr: document.getElementById("addnapiAr").value,
    berelheto: berelhetoseg.checked,
  });
  feltoltes();
}
function change() {
  id = prompt("Adja meg a módosítani kívánt autó ID-jét:");
  let auto = autok.find((a) => a.id == id);
  if (auto) {
    menu.innerHTML = `<div id="Customizingmenu">Rendszám: <input name="kocsirendszam" type="text" id="changerendszam" value="${auto.rendszam}">
    <br>Márka: <input name="kocsimarka" type="text" id="changemarka" value="${auto.marka}">
    <br>Modell: <input name="kocsimodell" type="text" id="changemodell" value="${auto.modell}">
    <br>Évjárat:<input name="kocsievjarat" type="number" id="changeevjarat" value="${auto.evjarat}">
    <br>Üzemanyag: <input name="kocsiuzemanyag" type="text" id="changeuzemanyag" value="${auto.uzemanyag}">
    <br>Napiár: <input name="kocsinapiAr" type="number" id="changenapiAr" value="${auto.napiAr}">
    <br>Bérelhetőség: 
     <input name="kocsiberelheto" type="radio" id="changeberelhetotrue" text="Igen" ${auto.berelheto ? 'checked' : ''}> <input name="kocsiberelheto" type="radio" id="changeberelhetofalse" text="Nem" ${!auto.berelheto ? 'checked' : ''}><br>
     <button onclick="changesave()">Mentés</button>
     <button onclick="exit()">Kilépés</button>
     </div>`;
  } else {
    alert("Nincs ilyen ID-jű autó!");
  }
}
function changesave() {
  auto = autok.find((a) => a.id == id);
  auto.rendszam = document.getElementById("changerendszam").value;
  auto.marka = document.getElementById("changemarka").value;
  auto.modell = document.getElementById("changemodell").value;
  auto.evjarat = document.getElementById("changeevjarat").value;
  auto.uzemanyag = document.getElementById("changeuzemanyag").value;
  auto.napiAr = document.getElementById("changenapiAr").value;
  let berelhetoseg = document.getElementById("changeberelhetotrue");
  auto.berelheto = berelhetoseg.checked;
  autok.forEach((a) => {
    if (a.id == id) {
      a = auto;
    }
  });
  feltoltes();
}
function del() {
  menu.innerHTML = `<div id="Customizingmenu">Mi Szerint akarja törölni az autót?<br>
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
  feltoltes();
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
  feltoltes();
}
function deletesave() {
  let ujautok = [];
  autok.forEach((a) => {
    if (torlesf ==1 && a.id != document.getElementById("delidinput").value) {
      ujautok.push(a);
    }
    
    if (torlesf == 2 && a.rendszam != document.getElementById("delrendszaminput").value) {
      ujautok.push(a);
    }
  });
  let eid=0;
  ujautok.forEach((a) => {
    if (a.id-1 > eid) {
      a.id = a.id - 1;
      console.log(a.id + " " + eid);
    }
    eid = a.id;
  });
  autok = ujautok;
  feltoltes();
}
function exit() {
  menu.innerHTML = ``;
}
feltoltes();
