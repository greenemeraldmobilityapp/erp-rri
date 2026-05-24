import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748B', marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#0F172A', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { fontSize: 9, color: '#64748B' },
  value: { fontSize: 9, color: '#0F172A' },
  table: { borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, padding: '6 8' },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', padding: '6 8' },
  tableCell: { flex: 1, fontSize: 8, color: '#0F172A' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
})

interface DokumenUmumData {
  judul: string
  nomor: string
  tanggal: string
  infoRows: Array<{ label: string; value: string }>
  columns: Array<{ key: string; label: string; flex?: number }>
  items: Array<Record<string, string | number>>
  total?: number
  totalLabel?: string
}

export function DokumenUmumPDF({ data }: { data: DokumenUmumData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.judul}</Text>
          <Text style={styles.subtitle}>No. {data.nomor}</Text>
          <Text style={styles.subtitle}>Tanggal: {new Date(data.tanggal).toLocaleDateString('id-ID')}</Text>
        </View>
        {data.infoRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>
            {data.infoRows.map((row, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
        {data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {data.columns.map((col, i) => (
                  <Text key={i} style={[styles.tableHeaderCell, { flex: col.flex ?? 1 }]}>{col.label}</Text>
                ))}
              </View>
              {data.items.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  {data.columns.map((col, j) => (
                    <Text key={j} style={[styles.tableCell, { flex: col.flex ?? 1 }]}>
                      {typeof item[col.key] === 'number' ? (item[col.key] as number).toLocaleString('id-ID') : String(item[col.key] ?? '')}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
        {data.total != null && (
          <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{data.totalLabel ?? 'Total'}: Rp {data.total.toLocaleString('id-ID')}</Text>
          </View>
        )}
        <Text style={styles.footer}>Dicetak dari ERP RRI - PT. Rizki Ridho Ilahi</Text>
      </Page>
    </Document>
  )
}
