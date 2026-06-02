const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
const BELASAN = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas']
const PULUHAN = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh']

function sebutRatusan(n: number): string {
  const ratus = Math.floor(n / 100)
  const sisa = n % 100
  let result = ''
  if (ratus === 1) result = 'Seratus'
  else if (ratus > 1) result = SATUAN[ratus] + ' Ratus'
  if (sisa === 0) return result
  const sisaStr = sebutPuluhan(sisa)
  return result ? result + ' ' + sisaStr : sisaStr
}

function sebutPuluhan(n: number): string {
  if (n < 10) return SATUAN[n]
  if (n < 20) return BELASAN[n - 10]
  const puluh = Math.floor(n / 10)
  const sisa = n % 10
  const p = PULUHAN[puluh]
  if (sisa === 0) return p
  return p + ' ' + SATUAN[sisa]
}

function sebut(n: number): string {
  if (n === 0) return 'Nol'
  const MILIAR = 1000000000
  const JUTA = 1000000
  const RIBU = 1000
  let result = ''
  let sisa = n
  const miliar = Math.floor(sisa / MILIAR)
  sisa %= MILIAR
  if (miliar > 0) {
    if (miliar === 1) result += 'Satu Miliar'
    else result += sebutRatusan(miliar) + ' Miliar'
  }
  const juta = Math.floor(sisa / JUTA)
  sisa %= JUTA
  if (juta > 0) {
    if (result) result += ' '
    if (juta === 1) result += 'Satu Juta'
    else result += sebutRatusan(juta) + ' Juta'
  }
  const ribu = Math.floor(sisa / RIBU)
  sisa %= RIBU
  if (ribu > 0) {
    if (result) result += ' '
    if (ribu === 1) result += 'Seribu'
    else result += sebutRatusan(ribu) + ' Ribu'
  }
  if (sisa > 0) {
    if (result) result += ' '
    result += sebutRatusan(sisa)
  }
  return result
}

export function terbilang(angka: number): string {
  const bulat = Math.abs(Math.round(angka))
  if (bulat === 0) return 'Nol Rupiah'
  const kata = sebut(bulat)
  if (!kata) return 'Nol Rupiah'
  return kata.charAt(0).toUpperCase() + kata.slice(1) + ' Rupiah'
}
