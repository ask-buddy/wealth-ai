"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-md border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-sm bg-[#eef5ff] border border-[#d2e3fc] flex items-center justify-center text-[#1A76FF]">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-sm cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3
            id="confirm-delete-title"
            className="text-lg font-bold text-stone-900 tracking-tight"
          >
            Hapus Seluruh Data Portofolio?
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
            Tindakan ini akan menghapus seluruh data ringkasan kekayaan, rincian
            aset, liabilitas, dan riwayat audit dokumen dari penyimpanan browser
            Anda. Data yang telah dihapus tidak dapat dipulihkan.
          </p>
        </div>

        <div className="p-3 rounded-sm bg-stone-50 border border-stone-200/80 flex items-center gap-2.5 text-xs text-stone-600 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Privasi terjamin: Data hanya hidup di browser dan akan bersih total.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-sm bg-[#1A76FF] hover:bg-[#0d5fd9] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Semua Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
