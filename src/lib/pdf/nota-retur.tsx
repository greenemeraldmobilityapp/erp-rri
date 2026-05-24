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
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface NotaReturData {
  nomor: string
  tanggal: string
  tipe: 'penjualan' | 'pembelian'
  pihak: string
  items: Array<{ nama: string; jumlah: number; harga: number; keterangan?: string }>
  total: number
}

export function NotaReturPDF({ data }: { data: NotaReturData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Nota Retur {data.tipe === 'penjualan' ? 'Penjualan' : 'Pembelian'}</Text>
          <Text style={styles.subtitle}>No. {data.nomor}</Text>
          <Text style={styles.subtitle}>Tanggal: {new Date(data.tanggal).toLocaleDateString('id-ID')}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Retur</Text>
          <View style={styles.row}><Text style={styles.label}>{data.tipe === 'penjualan' ? 'Customer' : 'Supplier'}</Text><Text style={styles.value}>{data.pihak}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Retur</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Barang</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Jumlah</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Harga</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Subtotal</Text>
            </View>
            {data.items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.nama}</Text>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.jumlah}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Rp {item.harga.toLocaleString('id-ID')}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Rp {(item.jumlah * item.harga).toLocaleString('id-ID')}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total: Rp {data.total.toLocaleString('id-ID')}</Text>
        </View>
        <Text style={styles.footer}>Dicetak dari ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
