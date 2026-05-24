import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0F172A', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, padding: '12 16', flex: 1, marginHorizontal: 4 },
  kpiLabel: { fontSize: 8, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' },
  kpiValue: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  table: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: '8 12' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '8 12' },
  tableCell: { flex: 1, fontSize: 9, color: '#0F172A' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: '4 0' },
  totalLabel: { fontSize: 10, color: '#64748B', width: 120 },
  totalValue: { fontSize: 10, fontWeight: 'bold', width: 120, textAlign: 'right' },
  grandTotal: { fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginTop: 8, borderTopWidth: 2, borderTopColor: '#0F172A', paddingTop: 8 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface MonthlyRow { label: string; keluaran: number; masukan: number; net: number }
interface PpnMasaData {
  tahun: string | null; bulan: string | null
  ppnKeluaran: number; ppnMasukan: number; kurangBayar: number
  monthly: MonthlyRow[]
}

export function PpnMasaPDF({ data }: { data: PpnMasaData }) {
  const periodText = data.bulan ? `${data.bulan} ${data.tahun}` : `Tahun ${data.tahun}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan PPN Masa</Text>
          <Text style={styles.subtitle}>Periode: {periodText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={[styles.kpiRow, { marginHorizontal: -4 }]}>
            <View style={[styles.kpiCard, { borderColor: '#3b82f6' }]}>
              <Text style={styles.kpiLabel}>PPN Keluaran (Penjualan)</Text>
              <Text style={[styles.kpiValue, { color: '#2563eb' }]}>Rp {data.ppnKeluaran.toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#f59e0b' }]}>
              <Text style={styles.kpiLabel}>PPN Masukan (Pembelian)</Text>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>Rp {data.ppnMasukan.toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: data.kurangBayar >= 0 ? '#22c55e' : '#ef4444' }]}>
              <Text style={styles.kpiLabel}>Kurang / Lebih Bayar</Text>
              <Text style={[styles.kpiValue, { color: data.kurangBayar >= 0 ? '#16a34a' : '#dc2626' }]}>
                {data.kurangBayar >= 0 ? '(KB)' : '(LB)'} Rp {Math.abs(data.kurangBayar).toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian per Bulan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Bulan</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>PPN Keluaran</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>PPN Masukan</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Kurang / Lebih Bayar</Text>
            </View>
            {data.monthly.map((m, i) => (
              <View key={i} style={[styles.tableRow, i === data.monthly.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{m.label}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.keluaran.toLocaleString('id-ID')}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.masukan.toLocaleString('id-ID')}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.net >= 0 ? '(KB)' : '(LB)'} {Math.abs(m.net).toLocaleString('id-ID')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total PPN Keluaran</Text><Text style={styles.totalValue}>Rp {data.ppnKeluaran.toLocaleString('id-ID')}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total PPN Masukan</Text><Text style={styles.totalValue}>Rp {data.ppnMasukan.toLocaleString('id-ID')}</Text></View>
          <View style={styles.grandTotal}><Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Kurang / Lebih Bayar</Text><Text style={[styles.totalValue, { color: data.kurangBayar >= 0 ? '#16a34a' : '#dc2626' }]}>Rp {data.kurangBayar.toLocaleString('id-ID')}</Text></View>
        </View>

        <Text style={styles.footer}>Dicetak dari ERP RRI - PT. Rizki Ridho Ilahi | Periode {periodText}</Text>
      </Page>
    </Document>
  )
}
