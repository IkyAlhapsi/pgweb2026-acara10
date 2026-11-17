<?php
// Sesuaikan dengan setting MySQL pada komputer Anda
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "acara10";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
$sql = "SELECT * FROM cctv";
$result = $conn->query($sql);
// Hasil query dipakai bersama untuk tabel dan peta.
$dataCctv = [];
$dataPeta = [];
while ($row = $result->fetch_assoc()) {
    $dataCctv[] = $row;
    if ($row['latitude'] !== null && $row['longitude'] !== null
        && is_numeric($row['latitude']) && is_numeric($row['longitude'])
        && (float) $row['latitude'] >= -90 && (float) $row['latitude'] <= 90
        && (float) $row['longitude'] >= -180 && (float) $row['longitude'] <= 180) {
        $row['latitude'] = (float) $row['latitude'];
        $row['longitude'] = (float) $row['longitude'];
        $dataPeta[] = $row;
    }
}
$jsonPeta = json_encode($dataPeta, JSON_HEX_TAG | JSON_HEX_AMP
    | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE);
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Acara 10 - Web GIS CCTV Samarinda</title>
<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">
<link rel="stylesheet" href="assets/peta.css">
</head>
<body>
<div class="header-halaman">
    <h1>Web GIS CCTV Kota Samarinda</h1>

    <button type="button" class="tombol-info"
        id="buka-info" aria-label="Informasi pembuat peta">
    ⓘ
    </button>
</div>
<p><a href="input/index.html">Input Data</a></p>
<div id="map" aria-label="Peta titik CCTV Kota Samarinda"></div>
<p id="pesan-peta" role="status">Pilih marker untuk melihat atribut CCTV. Peta dasar memerlukan internet.</p>
<h2>Tabel Data CCTV</h2>
<div class="tabel-container">
<?php
if (count($dataCctv) > 0) {
    echo "<table border='1px'><tr>";
    echo "<th>Nomor Sumber</th>";
    echo "<th>Provinsi</th>";
    echo "<th>Kabupaten/Kota</th>";
    echo "<th>Kecamatan</th>";
    echo "<th>Kelurahan</th>";
    echo "<th>Nama CCTV</th>";
    echo "<th>Status</th>";
    echo "<th>Alamat</th>";
    echo "<th>Longitude</th>";
    echo "<th>Latitude</th>";
    echo "<th colspan='2'>Aksi</th></tr>";
    foreach ($dataCctv as $row) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars((string) ($row["no"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["provinsi"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["kab_kota"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["kecamatan"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["kelurahan"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["nama_cctv"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["status"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["alamat"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["longitude"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td>" . htmlspecialchars((string) ($row["latitude"] ?? ""), ENT_QUOTES, "UTF-8") . "</td>";
        echo "<td><a href='delete.php?id=" . (int) $row["id"] . "'>hapus</a></td>";
        echo "<td><a href='edit/index.php?id=" . (int) $row["id"] . "'>edit</a></td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "Data belum tersedia. Klik Input Data untuk menambahkan data geoportal.";
}
$conn->close();
?>
</div>
<p>Sumber: <a href="https://geoportal.samarindakota.go.id/satu-peta">Geoportal Kota Samarinda</a>, layer Titik CCTV Kota Samarinda.</p>
<script id="data-cctv" type="application/json"><?php echo $jsonPeta; ?></script>
<script src="assets/vendor/leaflet/leaflet.js"></script>
<script src="assets/peta.js"></script>
<dialog id="dialog-pembuat" aria-labelledby="judul-pembuat">
    <h2 id="judul-pembuat">Pembuat Peta</h2>

    <p>
        <strong>Rifkya Firman Alhapsi</strong><br>
        Pemrograman Geospasial Website
    </p>

    <form method="dialog">
        <button type="submit">Tutup</button>
    </form>
</dialog>

<script>
    const tombolInfo = document.getElementById("buka-info");
    const dialogPembuat = document.getElementById("dialog-pembuat");

    tombolInfo.addEventListener("click", function () {
        dialogPembuat.showModal();
    });
</script>
</body>
</html>
