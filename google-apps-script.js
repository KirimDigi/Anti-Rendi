/**
 * ====================================================================
 * GOOGLE APPS SCRIPT - UCAPAN & RSVP WEDDING ANTI & SUNDA
 * ====================================================================
 * 
 * Spreadsheet ID : 1-b3EYi3gtZAaqOuE9vphlFHqKfJwaACIvNmufjcDrQ4
 * Sheet Name     : Sheet1
 * 
 * Kolom yang dihasilkan otomatis:
 * 1. Timestamp
 * 2. Nama Tamu
 * 3. Ucapan
 * 4. Konfirmasi Kehadiran
 * 5. Jumlah Tamu
 * 
 * --------------------------------------------------------------------
 * CARA DEPLOY KE GOOGLE APPS SCRIPT (SANGAT MUDAH):
 * 1. Buka spreadsheet: https://docs.google.com/spreadsheets/d/1-b3EYi3gtZAaqOuE9vphlFHqKfJwaACIvNmufjcDrQ4/edit
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode default di Apps Script, lalu paste seluruh isi file ini.
 * 4. Klik tombol simpan (ikon disket / Ctrl + S).
 * 5. Klik tombol "Terapkan" (Deploy) di kanan atas > "Deployment Baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Pada setting:
 *    - Deskripsi       : RSVP Web
 *    - Jalankan sebagai (Execute as) : Saya (Me)
 *    - Siapa yang memiliki akses (Who has access) : Siapa saja (Anyone) -> [PENTING!]
 * 8. Klik "Terapkan" (Deploy), lalu klik "Berikan Akses" (Authorize Access) jika diminta izin Google.
 * 9. Salin URL Aplikasi Web (Web App URL) yang berakhiran `/exec`.
 * 10. Buka file `index.html`, cari variabel `GOOGLE_SCRIPT_URL` lalu paste URL tersebut.
 * ====================================================================
 */

const SPREADSHEET_ID = "1-b3EYi3gtZAaqOuE9vphlFHqKfJwaACIvNmufjcDrQ4";
const SHEET_NAME = "Sheet1";

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Inisialisasi Header otomatis jika baris masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Nama Tamu",
      "Ucapan",
      "Konfirmasi Kehadiran",
      "Jumlah Tamu"
    ]);
    sheet.getRange(1, 1, 1, 5)
      .setFontWeight("bold")
      .setBackground("#95A682")
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// -------------------------------------------------------------
// GET: Mengambil daftar ucapan untuk ditampilkan di web
// -------------------------------------------------------------
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Jika baru ada header saja
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        total: 0,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ambil data ucapan dari baris terakhir ke baris pertama (terbaru di atas)
    const rows = data.slice(1);
    const list = [];
    
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (!row[1] && !row[2]) continue; // lewati baris kosong
      
      let formattedTime = "";
      if (row[0] instanceof Date) {
        formattedTime = Utilities.formatDate(row[0], "Asia/Jakarta", "dd/MM/yyyy HH:mm");
      } else {
        formattedTime = String(row[0] || "");
      }
      
      list.push({
        timestamp: formattedTime,
        nama: String(row[1] || ""),
        ucapan: String(row[2] || ""),
        kehadiran: String(row[3] || ""),
        jumlah: String(row[4] || "-")
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      total: list.length,
      data: list
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------
// POST: Menyimpan ucapan & RSVP baru dari form web
// -------------------------------------------------------------
function doPost(e) {
  try {
    let payload = {};
    
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    const nama = (payload.nama || payload.author || "").trim();
    const ucapan = (payload.ucapan || payload.comment || "").trim();
    let kehadiran = (payload.kehadiran || payload.attendance || "").trim();
    let jumlah = (payload.jumlah || payload.guest || "1").trim();
    
    // Normalisasi teks kehadiran
    if (kehadiran === "present" || kehadiran.toLowerCase() === "hadir") {
      kehadiran = "Hadir";
    } else if (kehadiran === "notpresent" || kehadiran.toLowerCase() === "tidak hadir") {
      kehadiran = "Tidak Hadir";
      jumlah = "-";
    } else {
      kehadiran = "Hadir";
    }
    
    if (kehadiran === "Hadir" && jumlah !== "-") {
      jumlah = jumlah.includes("Orang") ? jumlah : jumlah + " Orang";
    }
    
    if (!nama || !ucapan) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Nama dan ucapan wajib diisi."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = getSheet();
    const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
    
    sheet.appendRow([
      timestamp,
      nama,
      ucapan,
      kehadiran,
      jumlah
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Terima kasih, ucapan Anda berhasil disimpan!",
      data: {
        timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm"),
        nama: nama,
        ucapan: ucapan,
        kehadiran: kehadiran,
        jumlah: jumlah
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
