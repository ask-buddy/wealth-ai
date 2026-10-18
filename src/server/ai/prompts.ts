import { Type, type Schema } from "@google/genai";

export const FINANCIAL_AUDIT_SYSTEM_INSTRUCTION = `
Anda adalah Auditor Finansial AI institusional dengan akurasi 100%. Tugas utama Anda adalah mengekstrak data aset keuangan faktual dari setiap dokumen visual atau PDF yang dilampirkan ke dalam format JSON yang valid.

HANYA kembalikan satu objek JSON valid dengan struktur skema berikut:
{
  "assets": [
    {
      "asset_name": "string (nama institusi/produk/emiten/pemegang saham)",
      "category": "SAHAM | PERUSAHAAN_SENDIRI | CRYPTO | PROPERTI | KAS_DEPOSITO | EMAS_LOGAM_MULIA | OBLIGASI_SBN | KENDARAAN | LAINNYA",
      "estimated_value_idr": number (nilai moneter dalam rupiah, integer murni tanpa titik/koma/desimal),
      "quantity_or_ownership_detail": "string (contoh: '0.011 gram', 'Saldo Aktif', '60% saham', '100 Lot', dsb)",
      "source_file": "string (nama file dokumen asal item ini)",
      "box_2d": [ymin, xmin, ymax, xmax] (koordinat 2D bounding box integer ternormalisasi 0-1000 tempat baris/angka aset ini berada di gambar)
    }
  ],
  "liabilities": [],
  "unreadable_or_skipped_files": [],
  "executive_summary": "string (ringkasan 2-3 kalimat mengenai hasil audit dan total aset)"
}

PATUHI ATURAN AUDIT BERIKUT TANPA PENGECUALIAN:

1. ATURAN SCREENSHOT BANKING (myBCA / BCA Mobile / Mandiri / BRI / BNI / Bank Lainnya):
   - Masukkan ke kategori KAS_DEPOSITO.
   - Ekstrak "Active Balance" / "Saldo Efektif" / "Available Balance" / "Saldo Tabungan".
   - PERHATIAN FORMAT: Format myBCA (English UI) mencantumkan nilai seperti "IDR 56,498.48". Hilangkan sen desimal di belakang titik, bulatkan ke rupiah terdekat: 56498.

2. ATURAN FINTECH EMAS & INVESTASI (TREASURY, PEGADAIAN, PLUANG):
   - Pada screenshot yang menampilkan kartu rincian:
     * "Tabungan Emas" (dengan nominal dan gramasi) -> Masukkan ke kategori EMAS_LOGAM_MULIA. Contoh: nominal IDR 25.297, gramasi "0.011 gram" -> estimated_value_idr: 25297.
     * "Saldo IDR" / Dompet Tunai -> Masukkan ke kategori KAS_DEPOSITO. Contoh: nominal IDR 110.951 -> estimated_value_idr: 110951.
   - HINDARI DOUBLE-COUNTING: JANGAN ekstrak kartu "Total Aset" di atasnya (misal Rp 136.248) jika kartu rincian Tabungan Emas dan Saldo IDR sudah diekstrak.

3. ATURAN SEKURITAS & INVESTASI (AJAIB, STOCKBIT, IPOT, BIBIT, PLUANG):
   - Ekstrak setiap instrumen yang dimiliki:
     * Posisi Saham (misal: ENVY - Envy Technologies Indonesia Tbk.) -> Kategori SAHAM, nilai sesuai nominal nilai pasar saat ini (misal Rp 10.000 -> 10000).
     * Posisi Reksa Dana (misal: Eastspring Investments Cash Reserve) -> Kategori SAHAM, nilai sesuai Total Value (misal Rp 11.782 -> 11782).
   - HINDARI DOUBLE-COUNTING: JANGAN ekstrak kartu "Est. Total Aset" atau "Total Portofolio" jika instrumen saham dan reksa dana sudah diekstrak.

4. ATURAN DOKUMEN LEGAL (AKTA PENDIRIAN PERSEROAN / NOTARIS / KEMENKUMHAM):
   - Kategori: PERUSAHAAN_SENDIRI.
   - Ekstrak modal yang ditempatkan dan disetor penuh.
   - Jika terdapat daftar pemegang saham pendiri, ekstrak kepemilikan saham dari masing-masing pemegang saham pendiri:
     * Nama: "PT [Nama PT] - Saham [Nama Pendiri]"
     * Nilai: nominal modal disetor pemegang saham tersebut dalam Rupiah penuh
     * Detail: persentase dan jumlah lembar saham (contoh: "60% saham (2.400 Lembar)")

5. ATURAN FORMAT ANGKA (STRICT INTEGER):
   - estimated_value_idr HARUS berupa integer murni (Number) tanpa titik atau koma pemisah ribuan.
   - Contoh konversi:
     * "IDR 56,498.48" -> 56498
     * "Rp 136.248" -> 136248
     * "Rp 10.000" -> 10000
     * "Rp 11.782" -> 11782
     * "Rp 4.000.000.000" -> 4000000000

6. ATURAN SUMBER DOKUMEN (source_file):
   - Isi field source_file pada setiap aset persis sama dengan nama file asal dokumen tempat aset tersebut ditemukan.
`;

export const LOCATE_ASSET_PROMPT = (assetName: string, assetValue?: string) => `
Anda adalah AI visual grounding dan OCR precision specialist.
Tugas Anda: Cari dan temukan posisi baris/angka dari aset "${assetName}" (dengan perkiraan nominal "${assetValue || ""}") pada gambar screenshot/dokumen ini.

Panduan:
1. Cari baris ticker/nama/kode instrumen (misalnya: jika aset adalah ADRO, cari baris "ADRO" beserta angka nominalnya di tabel atau daftar portofolio).
2. Kembalikan 2D bounding box [ymin, xmin, ymax, xmax] yang menutupi baris atau angka nilai dari instrumen tersebut.
3. Koordinat harus berupa integer ternormalisasi 0 sampai 1000:
   - ymin: posisi tepi atas (0-1000)
   - xmin: posisi tepi kiri (0-1000)
   - ymax: posisi tepi bawah (0-1000)
   - xmax: posisi tepi kanan (0-1000)
4. Bounding box ini akan dipakai untuk menggambar stabilo highlight transparan tepat di atas baris instrumen tersebut.

Format output HANYA JSON valid:
{
  "box_2d": [ymin, xmin, ymax, xmax]
}
`;

export const assetExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    assets: {
      type: Type.ARRAY,
      description:
        "Daftar faktual aset yang ditemukan di dalam dokumen. Kosongkan array jika tidak ada data aset yang valid.",
      items: {
        type: Type.OBJECT,
        properties: {
          asset_name: {
            type: Type.STRING,
            description:
              "Nama spesifik aset/institusi sesuai yang tertulis di dokumen (Contoh: 'Bank Central Asia (BBCA)', 'PT Sumber Makmur', 'Bitcoin (BTC)', 'Tabungan BCA ****4829').",
          },
          category: {
            type: Type.STRING,
            enum: [
              "SAHAM",
              "PERUSAHAAN_SENDIRI",
              "CRYPTO",
              "PROPERTI",
              "KAS_DEPOSITO",
              "EMAS_LOGAM_MULIA",
              "OBLIGASI_SBN",
              "KENDARAAN",
              "LAINNYA",
            ],
            description: "Kategori aset untuk kalkulasi persentase kekayaan.",
          },
          estimated_value_idr: {
            type: Type.NUMBER,
            description:
              "Nilai valuasi aset dalam angka Rupiah penuh (Integer murni tanpa titik/koma) sesuai yang tertulis di dokumen.",
          },
          quantity_or_ownership_detail: {
            type: Type.STRING,
            description:
              "Detail kuantitas/kepemilikan yang tertulis di dokumen (Contoh: '500 Lot @ Rp 10.200', '40% Saham (4.000 Lembar)', '0.25 BTC ($17,500 USD)', 'Luas Tanah 200m2').",
          },
          source_file: {
            type: Type.STRING,
            description:
              "Nama file dokumen asal tempat item aset ini ditemukan, harus persis dengan label Nama File yang diberikan.",
          },
          box_2d: {
            type: Type.ARRAY,
            description:
              "Koordinat 2D bounding box [ymin, xmin, ymax, xmax] dengan skala 0 sampai 1000 pada gambar tempat baris atau angka nilai aset ini berada di dokumen.",
            items: {
              type: Type.INTEGER,
            },
          },
        },
        required: [
          "asset_name",
          "category",
          "estimated_value_idr",
          "quantity_or_ownership_detail",
          "source_file",
        ],
      },
    },
    liabilities: {
      type: Type.ARRAY,
      description:
        "Daftar kewajiban finansial atau hutang yang tercatat di dalam dokumen. Kosongkan array jika tidak ada hutang.",
      items: {
        type: Type.OBJECT,
        properties: {
          liability_name: {
            type: Type.STRING,
            description:
              "Nama kewajiban atau hutang (Contoh: 'KPR Bank Mandiri', 'Pinjaman Modal Usaha', 'Kartu Kredit').",
          },
          lender: {
            type: Type.STRING,
            description: "Nama bank, lembaga keuangan, atau pihak pemberi pinjaman.",
          },
          amount_idr: {
            type: Type.NUMBER,
            description:
              "Sisa pokok hutang atau kewajiban dalam angka Rupiah penuh (Integer murni).",
          },
          source_file: {
            type: Type.STRING,
            description: "Nama file dokumen asal.",
          },
          box_2d: {
            type: Type.ARRAY,
            description:
              "Koordinat 2D bounding box [ymin, xmin, ymax, xmax] dengan skala 0 sampai 1000.",
            items: {
              type: Type.INTEGER,
            },
          },
        },
        required: ["liability_name", "amount_idr", "source_file"],
      },
    },
    unreadable_or_skipped_files: {
      type: Type.ARRAY,
      description:
        "Daftar nama file dokumen yang tidak terbaca, buram, korup, atau bukan dokumen finansial. Kosongkan jika semua terbaca.",
      items: {
        type: Type.STRING,
      },
    },
    executive_summary: {
      type: Type.STRING,
      description:
        "Ringkasan naratif profesional formal 2-3 kalimat mengenai status aset dan temuan utama.",
    },
  },
  required: [
    "assets",
    "liabilities",
    "unreadable_or_skipped_files",
    "executive_summary",
  ],
};
