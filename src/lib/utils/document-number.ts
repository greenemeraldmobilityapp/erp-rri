import { supabase } from '@/lib/db/client';

export async function generateDocumentNumber(kodeDokumen: string): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;
  const yy = tahun.toString().slice(-2);
  const mm = bulan.toString().padStart(2, '0');

  const { data, error } = await supabase.rpc('increment_document_counter', {
    p_kode_dokumen: kodeDokumen,
    p_tahun: tahun,
    p_bulan: bulan,
  });

  if (error) throw new Error(`Failed to generate document number: ${error.message}`);

  const counter = String(data ?? 1).padStart(4, '0');
  return `RRI-${kodeDokumen}-${yy}-${mm}-${counter}`;
}
