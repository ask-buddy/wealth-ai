import { Type } from "@google/genai";

export const wealthAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: "Ringkasan eksekutif 2-3 kalimat mengenai total portofolio, konsentrasi aset, dan profil kekayaan.",
    },
    currency: {
      type: Type.STRING,
      description: "Mata uang acuan, selalu 'IDR'.",
    },
    keyHighlights: {
      type: Type.ARRAY,
      description: "3-5 poin penting temuan dari dokumen (misal: likuiditas tinggi, aset properti dominan, dll).",
      items: {
        type: Type.STRING,
      },
    },
    assets: {
      type: Type.ARRAY,
      description: "Daftar seluruh item aset yang teridentifikasi dari seluruh dokumen yang diunggah.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "ID unik singkat (e.g. 'ast-1', 'ast-2').",
          },
          name: {
            type: Type.STRING,
            description: "Nama spesifik aset (e.g. 'BBCA - PT Bank Central Asia Tbk', 'Bitcoin (BTC)', 'Ruko Kelapa Gading').",
          },
          category: {
            type: Type.STRING,
            description: "Salah satu dari: 'SAHAM', 'PERUSAHAAN_SENDIRI', 'CRYPTO', 'PROPERTI', 'KAS_DEPOSITO', 'LAINNYA'.",
          },
          institution: {
            type: Type.STRING,
            description: "Institusi/platform tempat aset berada jika tertera (e.g. 'BCA', 'Mandiri Sekuritas', 'Tokocrypto', 'Notaris XYZ').",
          },
          quantity: {
            type: Type.NUMBER,
            description: "Jumlah volume, lembar, lot, unit, koin, atau luas jika ada di dokumen.",
          },
          unit: {
            type: Type.STRING,
            description: "Satuan kuantitas (e.g. 'lot', 'lembar', 'BTC', 'm2', 'unit').",
          },
          valueIdr: {
            type: Type.NUMBER,
            description: "Nilai aset dalam Rupiah (IDR). Jika di dokumen tertulis mata uang asing, konversikan ke estimasi IDR wajar.",
          },
          originalCurrency: {
            type: Type.STRING,
            description: "Mata uang awal yang tercantum di dokumen (e.g. 'IDR', 'USD', 'SGD').",
          },
          originalValue: {
            type: Type.NUMBER,
            description: "Nilai nominal asli sebelum konversi jika berbeda dari IDR.",
          },
          sourceFile: {
            type: Type.STRING,
            description: "PERSIS nama file sumber dokumen tempat aset ini ditemukan (e.g. 'portofolio_saham.pdf', 'screenshot_bca.png').",
          },
          notes: {
            type: Type.STRING,
            description: "Catatan penting pendukung (e.g. 'Porsi kepemilikan 35%', 'Harga per lembar Rp 10.200').",
          },
        },
        required: ["id", "name", "category", "valueIdr", "sourceFile"],
      },
    },
    liabilities: {
      type: Type.ARRAY,
      description: "Daftar hutang atau liabilitas jika tertera dalam dokumen.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "ID unik singkat (e.g. 'lia-1').",
          },
          name: {
            type: Type.STRING,
            description: "Nama liabilitas (e.g. 'KPR Bank Mandiri', 'Margin Facility').",
          },
          lender: {
            type: Type.STRING,
            description: "Pemberi pinjaman / bank.",
          },
          amountIdr: {
            type: Type.NUMBER,
            description: "Jumlah sisa hutang dalam Rupiah (IDR).",
          },
          sourceFile: {
            type: Type.STRING,
            description: "Nama file sumber dokumen tempat hutang ini ditemukan.",
          },
          notes: {
            type: Type.STRING,
            description: "Keterangan tenor, suku bunga, atau jaminan.",
          },
        },
        required: ["id", "name", "amountIdr", "sourceFile"],
      },
    },
  },
  required: ["executiveSummary", "currency", "keyHighlights", "assets", "liabilities"],
};
