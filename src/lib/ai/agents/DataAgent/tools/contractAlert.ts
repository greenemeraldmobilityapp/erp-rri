import { supabaseAdmin } from '@/lib/api/supabase-server'
import { sendWhatsapp, getOwnerWhatsapp } from '@/lib/utils/whatsapp'
import { formatDateWIB } from '@/lib/utils/timezone'

export interface ContractAlertResult {
  contract_id: string
  contract_nomor: string
  supplier_nama: string
  items_count: number
  expiry_status: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE'
  days_until_expiry: number
  affected_barang: Array<{
    barang_id: string
    barang_nama: string
    current_price: number
    kontrak_price: number
    price_impact: 'INCREASE' | 'DECREASE' | 'NO_CHANGE'
  }>
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendations: string[]
  auto_renew_suggested: boolean
}

export async function checkContractAlerts(
  daysThreshold: number = 30,
  options?: { sendNotification?: boolean }
): Promise<ContractAlertResult[]> {
  const today = new Date()
  const thresholdDate = new Date(today)
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

  console.log('checkContractAlerts: Checking contracts with threshold', daysThreshold, 'days')

  const { data: contracts } = await supabaseAdmin
    .from('kontrak')
    .select('*, customer!customer_id(nama)')
    .eq('is_active', true)

  console.log('checkContractAlerts: Found', contracts?.length ?? 0, 'active contracts')

  const alerts: ContractAlertResult[] = []

  for (const kontrak of contracts ?? []) {
    const expiryDate = new Date((kontrak as { tanggal_selesai: string }).tanggal_selesai)
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry < 0) {
      alerts.push({
        contract_id: kontrak.id,
        contract_nomor: (kontrak as { nomor_kontrak: string }).nomor_kontrak,
        supplier_nama: (kontrak.customer as { nama: string }).nama,
        items_count: 0,
        expiry_status: 'EXPIRED',
        days_until_expiry: daysUntilExpiry,
        affected_barang: [],
        urgency: 'CRITICAL',
        recommendations: [
          'Contract EXPIRED - negosiasi ulang segera',
          'Harga bisa revert ke standard - monitor cost impact',
          'Pertimbangkan lock-in pricing baru',
        ],
        auto_renew_suggested: false,
      })
    } else if (daysUntilExpiry <= daysThreshold) {
      const { data: kontrakItems } = await supabaseAdmin
        .from('kontrak_item')
        .select('*, barang!barang_id(id, nama, harga_beli_default)')
        .eq('kontrak_id', kontrak.id)

      const affectedBarang = (kontrakItems ?? []).map((ki: {
        barang_id: string
        barang?: { id: string; nama: string; harga_beli_default: number | null }
        harga: number
      }) => {
        const currentDefault = ki.barang?.harga_beli_default ?? 0
        const priceImpact: 'INCREASE' | 'DECREASE' | 'NO_CHANGE' =
          ki.harga > currentDefault ? 'INCREASE' : ki.harga < currentDefault ? 'DECREASE' : 'NO_CHANGE'

        return {
          barang_id: ki.barang_id,
          barang_nama: ki.barang?.nama ?? 'Unknown',
          current_price: currentDefault,
          kontrak_price: ki.harga,
          price_impact: priceImpact,
        }
      })

      const hasIncrease = affectedBarang.some(b => b.price_impact === 'INCREASE')
      const hasDecrease = affectedBarang.some(b => b.price_impact === 'DECREASE')

      let urgency: ContractAlertResult['urgency']
      if (daysUntilExpiry <= 7) {
        urgency = 'CRITICAL'
      } else if (daysUntilExpiry <= 14) {
        urgency = 'HIGH'
      } else {
        urgency = 'MEDIUM'
      }

      const recommendations: string[] = [
        `Contract expiry dalam ${daysUntilExpiry} hari - initiate renewal sekarang`,
      ]

      if (hasIncrease) {
        recommendations.push('WARNING: Ada item dengan harga naik dari kontrak - budget review diperlukan')
      }
      if (hasDecrease) {
        recommendations.push('Opportunity: Ada item yang bisa dapat harga lebih murah dari current default')
      }

      alerts.push({
        contract_id: kontrak.id,
        contract_nomor: (kontrak as { nomor_kontrak: string }).nomor_kontrak,
        supplier_nama: (kontrak.customer as { nama: string }).nama,
        items_count: affectedBarang.length,
        expiry_status: 'EXPIRING_SOON',
        days_until_expiry: daysUntilExpiry,
        affected_barang: affectedBarang,
        urgency,
        recommendations,
        auto_renew_suggested: true,
      })
    }
  }

  return alerts.sort((a, b) => {
    if (a.expiry_status === 'EXPIRED' && b.expiry_status !== 'EXPIRED') return -1
    if (a.urgency === 'CRITICAL' && b.urgency !== 'CRITICAL') return -1
    return a.days_until_expiry - b.days_until_expiry
  })
}

export async function sendContractAlertNotifications(alerts: ContractAlertResult[]): Promise<void> {
  if (alerts.length === 0) {
    console.log('Contract alerts: No alerts to send')
    return
  }

  const ownerHps = await getOwnerWhatsapp()
  if (!ownerHps.length) {
    console.log('Contract alerts: owner_whatsapp not configured in site_settings, skipping notification')
    return
  }

  console.log('Contract alerts: Sending WhatsApp with', alerts.length, 'alerts')

  const expired = alerts.filter(a => a.expiry_status === 'EXPIRED')
  const expiringSoon = alerts.filter(a => a.expiry_status === 'EXPIRING_SOON')

  const lines: string[] = [
    '📋 Ringkasan Alert Kontrak RRI',
    `Tanggal: ${formatDateWIB(new Date())}`,
    '',
    `⚠️ KADALUARSA: ${expired.length}`,
    `⏰ Segera Berakhir: ${expiringSoon.length}`,
    '',
  ]

  if (expired.length > 0) {
    lines.push('--- KONTRAK KADALUARSA ---')
    for (const a of expired.slice(0, 5)) {
      lines.push(`• ${a.contract_nomor} (${a.supplier_nama}) - TERLAMBAT ${Math.abs(a.days_until_expiry)} hari`)
    }
    if (expired.length > 5) lines.push(`... dan ${expired.length - 5} lainnya`)
    lines.push('')
  }

  if (expiringSoon.length > 0) {
    lines.push('--- KONTRAK SEGERA BERAKHIR ---')
    for (const a of expiringSoon.slice(0, 5)) {
      lines.push(`• ${a.contract_nomor} (${a.supplier_nama}) - ${a.days_until_expiry} hari lagi`)
    }
    if (expiringSoon.length > 5) lines.push(`... dan ${expiringSoon.length - 5} lainnya`)
  }

  lines.push('')
  lines.push('Mohon tinjau dan ambil tindakan yang diperlukan.')

  for (const hp of ownerHps) {
    await sendWhatsapp(hp, lines.join('\n'))
  }
}

export async function getContractAlertSummary(): Promise<{
  expired: number
  expiring_soon: number
  total_alerts: number
  critical_count: number
}> {
  const alerts = await checkContractAlerts(30)
  return {
    expired: alerts.filter(a => a.expiry_status === 'EXPIRED').length,
    expiring_soon: alerts.filter(a => a.expiry_status === 'EXPIRING_SOON').length,
    total_alerts: alerts.length,
    critical_count: alerts.filter(a => a.urgency === 'CRITICAL').length,
  }
}