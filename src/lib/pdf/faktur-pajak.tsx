import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748B', marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#0F172A', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 9, color: '#64748B' },
  value: { fontSize: 9, color: '#0F172A', fontWeight: 'bold' },
  table: { borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, padding: '6 8' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '6 8' },
  tableCell: { flex: 1, fontSize: 8, color: '#0F172A' },
  totalSection: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', padding: '3 0' },
  totalLabel: { fontSize: 9, color: '#64748B', width: 100 },
  totalValue: { fontSize: 9, fontWeight: 'bold', width: 100, textAlign: 'right' },
  grandTotal: { fontSize: 11, fontWeight: 'bold', color: '#0F172A', marginTop: 6, borderTopWidth: 2, borderTopColor: '#0F172A', paddingTop: 6 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface FakturPajakData {
  nomor: string
  tanggal: string
  customerNama?: string
  supplierNama?: string
  dpp: number
  ppn: number
  pph: number | null
  items?: Array<{ nama: string; jumlah: number; harga: number; diskon: number | null }>
}

export function FakturPajakPDF({ data }: { data: FakturPajakData }) {
  const total = data.dpp + data.ppn - (data.pph ?? 0)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Faktur Pajak</Text>
          <Text style={styles.subtitle}>No. {data.nomor}</Text>
          <Text style={styles.subtitle}>Tanggal: {new Date(data.tanggal).toLocaleDateString('id-ID')}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Transaksi</Text>
          <View style={styles.row}><Text style={styles.label}>Customer / Supplier</Text><Text style={styles.value}>{data.customerNama ?? data.supplierNama ?? '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>DPP</Text><Text style={styles.value}>Rp {data.dpp.toLocaleString('id-ID')}</Text></View>
          <View style={styles.row}><Text style={styles.label}>PPN (11%)</Text><Text style={styles.value}>Rp {data.ppn.toLocaleString('id-ID')}</Text></View>
          {data.pph != null && <View style={styles.row}><Text style={styles.label}>PPh</Text><Text style={styles.value}>Rp {data.pph.toLocaleString('id-ID')}</Text></View>}
        </View>
        {data.items && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detail Item</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nama</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Jml</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Harga</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Subtotal</Text>
              </View>
              {data.items.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.nama}</Text>
                  <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.jumlah}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>Rp {item.harga.toLocaleString('id-ID')}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>Rp {(item.harga * item.jumlah - (item.diskon ?? 0)).toLocaleString('id-ID')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>DPP</Text><Text style={styles.totalValue}>Rp {data.dpp.toLocaleString('id-ID')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>PPN 11%</Text><Text style={styles.totalValue}>Rp {data.ppn.toLocaleString('id-ID')}</Text></View>
          {data.pph != null && <View style={styles.totalRow}><Text style={styles.totalLabel}>PPh</Text><Text style={styles.totalValue}>Rp {data.pph.toLocaleString('id-ID')}</Text></View>}
          <View style={styles.grandTotal}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>Rp {total.toLocaleString('id-ID')}</Text></View>
        </View>
        <Text style={styles.footer}>Dicetak dari ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
