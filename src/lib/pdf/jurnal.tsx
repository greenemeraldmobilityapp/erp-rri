import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.cdnfonts.com/s/29131/Helvetica.woff', fontStyle: 'normal', fontWeight: 'normal' },
    { src: 'https://fonts.cdnfonts.com/s/29131/Helvetica-Bold.woff', fontStyle: 'normal', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', marginTop: 4 },
  infoBox: { fontSize: 9, marginBottom: 20 },
  infoLabel: { color: '#64748B', marginBottom: 2 },
  infoValue: { color: '#0F172A', fontWeight: 'bold', marginBottom: 6 },
  table: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: '8 12' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '8 12' },
  tableCell: { flex: 1, fontSize: 9, color: '#0F172A' },
  debitCell: { flex: 1, fontSize: 9, color: '#0F172A', textAlign: 'right' },
  creditCell: { flex: 1, fontSize: 9, color: '#0F172A', textAlign: 'right' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: '4 0' },
  totalLabel: { fontSize: 10, color: '#64748B', width: 100 },
  totalValue: { fontSize: 10, fontWeight: 'bold', width: 120, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface JurnalItem { akun: { kode: string; nama: string }; debit: number; credit: number; keterangan: string | null }
interface JurnalData { nomor: string; tanggal: string; keterangan: string | null; items: JurnalItem[] }

export function JurnalPDF({ data }: { data: JurnalData }) {
  const totalDebit = data.items.reduce((sum, i) => sum + i.debit, 0)
  const totalCredit = data.items.reduce((sum, i) => sum + i.credit, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>JURNAL UMUM</Text>
          <Text style={styles.subtitle}>{data.nomor}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal</Text>
          <Text style={styles.infoValue}>{data.tanggal}</Text>
          {data.keterangan && (
            <>
              <Text style={styles.infoLabel}>Keterangan</Text>
              <Text style={styles.infoValue}>{data.keterangan}</Text>
            </>
          )}
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>Kode</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Akun</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Keterangan</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Debit</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Kredit</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 0.4 }]}>{item.akun.kode}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.akun.nama}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.keterangan ?? '-'}</Text>
              <Text style={[styles.debitCell, { flex: 0.8 }]}>{item.debit > 0 ? item.debit.toLocaleString('id-ID') : '-'}</Text>
              <Text style={[styles.creditCell, { flex: 0.8 }]}>{item.credit > 0 ? item.credit.toLocaleString('id-ID') : '-'}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalSection}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Debit</Text><Text style={styles.totalValue}>{totalDebit.toLocaleString('id-ID')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Kredit</Text><Text style={styles.totalValue}>{totalCredit.toLocaleString('id-ID')}</Text></View>
        </View>
        <Text style={styles.footer}>Dokumen ini sah dan diproses secara elektronik | ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
