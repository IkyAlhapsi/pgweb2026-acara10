/* Acara 10: pola L.map, tileLayer, marker, control.layers dan scale dari modul. */
(function () {
    "use strict";
    const pesan = document.getElementById("pesan-peta");
    if (typeof L === "undefined") {
        pesan.textContent = "Leaflet belum termuat. Pastikan folder assets/vendor/leaflet ikut disalin.";
        return;
    }
    const data = JSON.parse(document.getElementById("data-cctv").textContent);
    // Leaflet menerima [latitude, longitude], bukan urutan kolom tabel.
    const map = L.map("map").setView([-0.502, 117.153], 12);

    const basemap1 = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
    );
    const basemap2 = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        { maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"], attribution: "Map data &copy; Google" }
    );
    // Alternatif bila layanan peta dasar pada contoh modul tidak dapat diakses.
    const basemap3 = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    basemap1.addTo(map);
    [basemap1, basemap2, basemap3].forEach(function (layer) {
        layer.on("tileerror", function () {
            pesan.textContent = "Sebagian peta dasar gagal dimuat. Periksa internet atau pilih peta dasar lain pada kontrol layer.";
        });
    });

    const layerCctv = L.featureGroup().addTo(map);
    const layerUkur = L.layerGroup().addTo(map);
    const atribut = [
        ["no", "Nomor sumber"], ["provinsi", "Provinsi"], ["kab_kota", "Kota"],
        ["kecamatan", "Kecamatan"], ["kelurahan", "Kelurahan"],
        ["nama_cctv", "Nama CCTV"], ["status", "Status"], ["alamat", "Alamat"],
        ["longitude", "Longitude"], ["latitude", "Latitude"]
    ];
    data.forEach(function (row) {
        const marker = L.marker([row.latitude, row.longitude]).addTo(layerCctv);
        // textContent dipakai agar isi database ditampilkan sebagai teks.
        const tabel = document.createElement("table");
        tabel.className = "popup-cctv";
        atribut.forEach(function (item) {
            const tr = tabel.insertRow();
            const th = document.createElement("th");
            th.textContent = item[1];
            tr.appendChild(th);
            const td = tr.insertCell();
            td.textContent = row[item[0]] == null ? "-" : String(row[item[0]]);
        });
        marker.bindPopup(tabel, { maxWidth: 340 });
    });

    function tampilkanSemua() {
        if (data.length) {
            if (!map.hasLayer(layerCctv)) { map.addLayer(layerCctv); }
            map.fitBounds(layerCctv.getBounds(), { padding: [35, 35], maxZoom: 16 });
        } else {
            map.setView([-0.502, 117.153], 12);
        }
    }
    tampilkanSemua();
    const baseMaps = { "Esri Imagery": basemap1, "Google Street": basemap2, "OpenStreetMap": basemap3 };
    const overlayMaps = { "Titik CCTV Samarinda": layerCctv, "Hasil pengukuran": layerUkur };
    L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);
    L.control.scale({ maxWidth: 150, position: "bottomright", imperial: false }).addTo(map);

    /* Pengembangan langkah 3: pengukuran panjang lintasan dari klik titik. */
    let mengukur = false;
    let titikUkur = [];
    let garisUkur = null;
    let totalMeter = 0;
    const alat = L.control({ position: "topleft" });
    alat.onAdd = function () {
        const panel = L.DomUtil.create("div", "alat-peta");
                panel.innerHTML =
            '<details>' +
            '<summary style="cursor:pointer"><strong>Alat Peta</strong></summary>' +
            '<button type="button" id="semua-titik">Tampilkan semua CCTV</button>' +
            '<button type="button" id="mulai-ukur" aria-pressed="false">Mulai ukur jarak</button>' +
            '<button type="button" id="hapus-ukur">Hapus hasil ukur</button>' +
            '<p id="hasil-ukur" aria-live="polite">Jarak: 0 m</p>' +
            '<p>Klik Mulai, lalu klik sedikitnya dua lokasi pada peta. Klik Selesai untuk berhenti.</p>' +
            '</details>';
        L.DomEvent.disableClickPropagation(panel);
        L.DomEvent.disableScrollPropagation(panel);
        return panel;
    };
    alat.addTo(map);
    const tombolUkur = document.getElementById("mulai-ukur");
    const hasilUkur = document.getElementById("hasil-ukur");
    function modeUkur(aktif) {
        mengukur = aktif;
        tombolUkur.textContent = aktif ? "Selesai mengukur" : "Mulai ukur jarak";
        tombolUkur.setAttribute("aria-pressed", String(aktif));
        map.getContainer().style.cursor = aktif ? "crosshair" : "";
        if (aktif) { map.doubleClickZoom.disable(); } else { map.doubleClickZoom.enable(); }
    }
    function bersihkan() {
        modeUkur(false);
        layerUkur.clearLayers();
        titikUkur = [];
        garisUkur = null;
        totalMeter = 0;
        hasilUkur.textContent = "Jarak: 0 m";
    }
    document.getElementById("semua-titik").addEventListener("click", tampilkanSemua);
    document.getElementById("hapus-ukur").addEventListener("click", bersihkan);
    tombolUkur.addEventListener("click", function () {
        if (mengukur) { modeUkur(false); return; }
        bersihkan();
        if (!map.hasLayer(layerUkur)) { map.addLayer(layerUkur); }
        modeUkur(true);
    });
    map.on("click", function (event) {
        if (!mengukur) { return; }
        if (titikUkur.length) {
            totalMeter += map.distance(titikUkur[titikUkur.length - 1], event.latlng);
        }
        titikUkur.push(event.latlng);
        L.circleMarker(event.latlng, { radius: 4, color: "#ba3217", fillOpacity: 1 }).addTo(layerUkur);
        if (!garisUkur) {
            garisUkur = L.polyline(titikUkur, { color: "#ba3217", weight: 3 }).addTo(layerUkur);
        } else { garisUkur.setLatLngs(titikUkur); }
        const nilai = totalMeter >= 1000 ? (totalMeter / 1000).toFixed(2) + " km" : totalMeter.toFixed(1) + " m";
        hasilUkur.textContent = "Jarak: " + nilai;
    });
})();
