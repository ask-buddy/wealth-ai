import { Type, type Schema } from "@google/genai";

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
        "Daftar faktual liabilitas/hutang yang ditemukan di dalam dokumen. Kosongkan array jika tidak ada hutang.",
      items: {
        type: Type.OBJECT,
        properties: {
          liability_name: {
            type: Type.STRING,
            description:
              "Nama hutang/pinjaman (Contoh: 'Kredit Pemilikan Rumah (KPR)', 'Kartu Kredit Mandiri', 'Pinjaman Modal Kerja').",
          },
          lender: {
            type: Type.STRING,
            description: "Pemberi pinjaman atau bank kreditur.",
          },
          amount_idr: {
            type: Type.NUMBER,
            description:
              "Jumlah sisa kewajiban/hutang dalam angka Rupiah penuh (Integer murni).",
          },
          source_file: {
            type: Type.STRING,
            description:
              "Nama file dokumen asal tempat kewajiban ini ditemukan.",
          },
          notes: {
            type: Type.STRING,
            description: "Keterangan tambahan mengenai liabilitas jika ada.",
          },
          box_2d: {
            type: Type.ARRAY,
            description:
              "Koordinat 2D bounding box [ymin, xmin, ymax, xmax] dengan skala 0 sampai 1000 pada gambar tempat baris liabilitas ini berada.",
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
        "Daftar nama file yang gagal dibaca karena buram atau tidak berisi informasi aset keuangan sama sekali.",
      items: { type: Type.STRING },
    },
    executive_summary: {
      type: Type.STRING,
      description:
        "Ringkasan objektif 2-3 kalimat dalam bahasa Indonesia mengenai komposisi aset yang berhasil diekstrak dari dokumen.",
    },
  },
  required: ["assets", "executive_summary"],
};
