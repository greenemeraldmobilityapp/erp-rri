import { supabase } from '@/lib/db/client';

function formatNumber(kodeDokumen: string, tahun: number, bulan: number, counter: number): string {
  const yy = tahun.toString().slice(-2);
  const mm = bulan.toString().padStart(2, '0');
  const padded = String(counter).padStart(4, '0');
  return `RRI-${kodeDokumen}-${yy}-${mm}-${padded}`;
}

export async function generateDocumentNumber(kodeDokumen: string): Promise<string> {
  const now = new Date();
  const { data, error } = await supabase.rpc('increment_document_counter', {
    p_kode_dokumen: kodeDokumen,
    p_tahun: now.getFullYear(),
    p_bulan: now.getMonth() + 1,
  });

  if (error) throw new Error(`Failed to generate document number: ${error.message}`);
  return formatNumber(kodeDokumen, now.getFullYear(), now.getMonth() + 1, data ?? 1);
}

export async function generateGlobalDocumentNumber(kodeDokumen: string): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;

  const { data, error } = await supabase.rpc('increment_global_counter', {
    p_tahun: tahun,
    p_bulan: bulan,
  });

  if (error) throw new Error(`Failed to generate global document number: ${error.message}`);
  return formatNumber(kodeDokumen, tahun, bulan, data ?? 1);
}

export function formatChildNumber(parentNomor: string, childKode: string): string {
  const parts = parentNomor.split('-');
  if (parts.length < 5) {
    throw new Error(`Invalid parent nomor format: ${parentNomor}`);
  }
  const yy = parts[2];
  const mm = parts[3];
  const counter = parts[4];
  return `RRI-${childKode}-${yy}-${mm}-${counter}`;
}
