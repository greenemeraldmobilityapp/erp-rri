import { emailLayout, tableRow, type FooterData } from '.'

interface QuotationData {
  nomor: string
  referensi: string | null
  perihal: string
  tanggal: string
  customerNama: string
  pdfUrl: string
}

interface CompanyData {
  company_nama?: string
  penandatangan_nama?: string
  company_no_hp?: string
  company_email?: string
}

export function quotationEmailHtml(data: QuotationData, company: CompanyData, picNama: string): string {
  const penandatangan = company.penandatangan_nama || 'Mohamad Marzuqi'
  const noHp = company.company_no_hp || '+6281 2607 5500'

  const footerData: FooterData = {
    companyNama: company.company_nama,
    companyNoHp: noHp,
    companyEmail: company.company_email,
  }

  const refRow = data.referensi
    ? tableRow('No. Ref RFQ', data.referensi)
    : tableRow('No. Ref RFQ', '-')

  return emailLayout(`
    <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6">Kepada Yth. <strong>${picNama}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6">Bersama ini kami sampaikan Quotation dengan detail sebagai berikut:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0">
      ${tableRow('Nomor', data.nomor)}
      ${refRow}
      ${tableRow('Perihal', data.perihal)}
      ${tableRow('Tanggal', data.tanggal)}
      ${tableRow('Customer', data.customerNama)}
    </table>
    <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6">Silakan akses dokumen detail Quotation lengkap melalui tautan berikut:</p>
    <p style="margin:0 0 16px"><a href="${data.pdfUrl}" style="color:#2563eb;font-size:15px;word-break:break-all">${data.pdfUrl}</a></p>
    <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.5">Tautan di atas dapat diakses dalam waktu 14 hari sejak email ini dikirimkan. Jika tautan telah kedaluwarsa, silakan hubungi kami untuk mendapatkan akses kembali.</p>
    <p style="margin:0 0 4px;color:#475569;font-size:15px;line-height:1.6">Terima kasih atas perhatian dan kerjasamanya.</p>
    <p style="margin:0;color:#475569;font-size:15px;line-height:1.6">Hormat kami,<br><strong>${penandatangan}</strong><br>${company.company_nama ?? 'PT. Rizqi Ridho Ilahi'}<br>${noHp}</p>
  `, `Quotation: ${data.nomor}`, footerData)
}
