import type { ReactElement } from 'react'
import { Font, StyleSheet } from '@react-pdf/renderer'

Font.register({
  family: 'Arial',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial@1.0.4/Arial.ttf', fontWeight: 'normal', fontStyle: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold@1.0.4/Arial%20Bold.ttf', fontWeight: 'bold', fontStyle: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-italic@1.0.4/Arial%20Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/arial-bold-italic@1.0.4/Arial%20Bold%20Italic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

Font.registerHyphenationCallback((word) => [word])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createEl(type: any, props?: any, ...children: any[]): ReactElement {
  return {
    $$typeof: Symbol.for('react.element'),
    type,
    key: null,
    ref: null,
    props: { ...props, children: children.length ? children : undefined },
    _owner: null,
  } as unknown as ReactElement
}

const BLUE = '#0000FF'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Arial',
    fontSize: 10,
    flexDirection: 'column',
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0000FF',
    textDecoration: 'underline',
  },
  companyLine: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // --- Content ---
  contentWrap: {
    flex: 1,
    flexDirection: 'column',
    padding: '6mm 0 8mm',
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 4,
    letterSpacing: 2,
  },
  titleNomor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  formTable: {
    marginBottom: 4,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  formLabel: {
    width: '25%',
  },
  formLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 3,
  },
  formLabelSub: {
    fontSize: 10,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  formColon: {
    width: '3%',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
  },
  formValue: {
    flex: 1,
    borderBottom: '1px dashed #374151',
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
  },
  formValueText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  terbilangText: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#000',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  amountBlueBox: {
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
  },
  amountBlueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  signatureBlock: {
    textAlign: 'center',
    width: '40%',
  },
  signatureDate: {
    fontSize: 11,
    marginBottom: 4,
  },
  signatureCompany: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signatureSpace: {
    height: 80,
  },
  signatureName: {
    fontSize: 11,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  signatureTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  // --- Footer ---
  footer: {
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingTop: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 10,
  },
})

interface KwitansiPDFData {
  nomor: string
  customerNama: string
  tanggal: string
  terbilangStr: string
  total: number
  keterangan: string | null
  invoiceNomor: string
  refType: 'DI' | 'PO' | null
  refNomor: string | null
  companyNama: string
  penandatanganNama: string
  penandatanganJabatan: string
  companyLogoUrl: string | null
  companyBidangUsaha: string | null
  companyAlamat: string | null
  companyNoHp: string | null
  companyEmail: string | null
}

function FormRow(label: string, labelSub: string | undefined, valueEl: ReactElement | null): ReactElement {
  return createEl(
    'VIEW',
    { style: styles.formRow },
    createEl(
      'VIEW',
      { style: styles.formLabel },
      label ? createEl('TEXT', { style: styles.formLabelText }, label) : null,
      labelSub ? createEl('TEXT', { style: styles.formLabelSub }, labelSub) : null,
    ),
    label
      ? createEl('TEXT', { style: styles.formColon }, ':')
      : createEl('VIEW', { style: { width: '3%' } }),
    createEl(
      'VIEW',
      { style: styles.formValue },
      valueEl,
    ),
  )
}

function formatRp(n: number): string {
  return `Rp. ${n.toLocaleString('id-ID')},-`
}

export function KwitansiPDF({ data }: { data: KwitansiPDFData }): ReactElement {
  const showRef = data.refType && data.refNomor

  // --- Header ---
  const bidangUsaha = data.companyBidangUsaha || 'Furniture, Welding, General Trading, Services'
  const bidangLines = bidangUsaha.includes('\n')
    ? bidangUsaha.split('\n').map(s => s.trim()).filter(Boolean)
    : bidangUsaha.split(',').map(s => s.trim()).filter(Boolean)

  const headerSection = createEl('VIEW', { style: styles.header },
    data.companyLogoUrl
      ? createEl('IMAGE', { src: data.companyLogoUrl, style: { width: 80, height: 80 } })
      : createEl('VIEW', { style: styles.logoBox },
          createEl('TEXT', { style: styles.logoText }, 'R')
        ),
    createEl('VIEW', { style: styles.headerRight },
      createEl('TEXT', { style: styles.companyName }, data.companyNama),
      ...bidangLines.map((line) =>
        createEl('TEXT', { style: styles.companyLine }, line)
      ),
    ),
  )

  // Double border line (from header style — same as quotation/invoice)
  const doubleBorder = createEl('VIEW', null,
    createEl('VIEW', { style: { borderBottomWidth: 2, borderBottomColor: '#000', marginTop: 3 } }),
    createEl('VIEW', { style: { height: 3 } }),
    createEl('VIEW', { style: { borderBottomWidth: 0.5, borderBottomColor: '#000' } }),
  )

  // --- Footer ---
  const footerSection = createEl('VIEW', { style: styles.footer },
    createEl('TEXT', { style: styles.footerText }, data.companyAlamat || 'Jerukwangi - Bangsri, Jepara'),
    createEl('TEXT', { style: styles.footerText },
      (data.companyNoHp || '+6281 2607 5500') + ', ' + (data.companyEmail || 'mazzjoeq@gmail.com')
    ),
  )

  return createEl(
    'DOCUMENT',
    null,
    createEl(
      'PAGE',
      { size: 'A4', style: styles.page },
      headerSection,
      doubleBorder,
      createEl(
        'VIEW',
        { style: styles.contentWrap },
        createEl(
          'VIEW',
          { style: styles.titleSection },
          createEl('TEXT', { style: styles.titleText },
            'KWITANSI / ',
            createEl('TEXT', { style: { fontStyle: 'italic' } }, 'RECEIPT'),
          ),
          createEl('TEXT', { style: styles.titleNomor }, `No : ${data.nomor}`),
        ),
        createEl(
          'VIEW',
          { style: styles.formTable },
          FormRow('Telah terima dari', 'Received from',
            createEl('TEXT', { style: styles.formValueText }, data.customerNama),
          ),
            FormRow('Sejumlah uang', 'Amount received',
              createEl('TEXT', { style: styles.terbilangText }, data.terbilangStr),
            ),
          FormRow('Untuk pembayaran', 'In payment of',
            createEl('TEXT', { style: styles.formValueText }, data.keterangan || 'Pembelian Barang'),
          ),
          showRef ? FormRow('', undefined,
            createEl('TEXT', { style: { ...styles.formValueText, fontSize: 10 } },
              `No. Ref. ${data.refType} : ${data.refNomor}`
            ),
          ) : null,
          FormRow('', undefined,
            createEl('TEXT', { style: { ...styles.formValueText, fontSize: 10 } },
              `No. Invoice : ${data.invoiceNomor}`
            ),
          ),
        ),
        createEl(
          'VIEW',
          { style: styles.bottomSection },
          createEl(
            'VIEW',
            { style: styles.amountBlueBox },
            createEl('TEXT', { style: styles.amountBlueText }, formatRp(data.total)),
          ),
          createEl(
            'VIEW',
            { style: styles.signatureBlock },
            createEl('TEXT', { style: styles.signatureDate }, data.tanggal),
            createEl('TEXT', { style: styles.signatureCompany }, data.companyNama),
            createEl('VIEW', { style: styles.signatureSpace }),
            createEl('TEXT', { style: styles.signatureName }, data.penandatanganNama),
            createEl('TEXT', { style: styles.signatureTitle }, data.penandatanganJabatan),
          ),
        ),
      ),
      footerSection,
    ),
  )
}
