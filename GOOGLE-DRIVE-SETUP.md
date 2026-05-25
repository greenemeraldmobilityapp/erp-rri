# Google Drive Setup untuk ERP RRI

Panduan ini membantu tim IT RRI menyiapkan Google Drive API dan Service Account agar aplikasi ERP RRI bisa menggunakan Google Drive sebagai storage backend.

---

## Prasyarat

- Akun **Google Workspace for Education** (atau Google Workspace apa pun) dengan kuota penyimpanan 100GB+
- Akses ke **Google Cloud Console** (<https://console.cloud.google.com>)
- Role di Google Cloud: **Project Owner** atau **Project Editor**

---

## Langkah 1 — Buat Google Cloud Project

1. Buka <https://console.cloud.google.com>
2. Klik dropdown project di kiri atas → **New Project**
3. Isi:
   - **Project name**: `erp-rri`
   - **Location**: pilih organization `smk.belajar.id`
4. Klik **Create**
5. Setelah project jadi, pastikan project tersebut terpilih di dropdown

---

## Langkah 2 — Enable Google Drive API

1. Di sidebar kiri, buka **APIs & Services** → **Library**
2. Cari `Google Drive API`
3. Klik **Enable**

---

## Langkah 3 — Buat Service Account

1. **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → pilih **Service Account**
   - Saat ditanya *"What data will you be accessing?"*, pilih **Application data**
   - Penjelasan: aplikasi ERP berjalan di server (backend), bukan milik user Google individual. Service Account cocok untuk akses otomatis tanpa perlu login user.
3. Isi:
   - **Service account name**: `erp-rri-storage`
   - **Service account ID**: otomatis terisi (contoh: `erp-rri-storage@...`)
   - **Description**: `Service account untuk upload file ERP RRI`
4. Klik **Create and Continue**
5. Bagian **Grant this service account access to project** — **skip/lewati** (tidak perlu assign role). Service Account hanya perlu akses ke Shared Drive, bukan ke project GCP.
6. Klik **Done**

---

## Langkah 4 — Generate JSON Key

1. Di halaman **Service Accounts**, klik email service account yang baru dibuat
2. Buka tab **Keys**
3. Klik **Add Key** → **Create New Key**
4. Pilih format **JSON**
5. Klik **Create** — file JSON akan otomatis ter-download
6. **Simpan file JSON ini di tempat aman** — berisi `client_email` dan `private_key`

---

## Langkah 5 — Buat Shared Drive di Google Drive

1. Buka <https://drive.google.com> (pakai akun Education milik RRI)
2. Di sidebar kiri, klik **Shared Drives**
3. Klik **New** → isi nama: `RRI-ERP`
4. Klik **Create**

---

## Langkah 6 — Invite Service Account ke Shared Drive

1. Buka Shared Drive `RRI-ERP` yang baru dibuat
2. Klik nama Shared Drive di atas → **Manage members**
3. Klik **Add people and groups**
4. Masukkan email Service Account:
   ```
   erp-rri-storage@[PROJECT_ID].iam.gserviceaccount.com
   ```
   (lihat di file JSON yang didownload: isi `client_email`)
5. Pilih role: **Content Manager**
   - Bisa: upload, edit, delete, move file
   - Tidak bisa: manage members, delete shared drive
6. Klik **Send**

---

## Langkah 7 — Catat Shared Drive ID

Shared Drive ID adalah string panjang di URL saat Shared Drive terbuka di browser:

```
https://drive.google.com/drive/u/0/folders/0ABCDEFGHIJKLMNOPQRSTUVWXYZ
                              ↑____Shared Drive ID____↑
```

Catat ID ini (contoh: `0ABCDEFGHIJKLMNOPQRSTUVWXYZ`)

---

## Langkah 8 — Kumpulkan Environment Variables

Dari file JSON yang didownload dan Shared Drive ID, siapkan 3 nilai ini:

| Variable | Dari mana | Contoh |
|----------|-----------|--------|
| `GOOGLE_DRIVE_CLIENT_EMAIL` | File JSON → `client_email` | `erp-rri-storage@project.iam.gserviceaccount.com` |
| `GOOGLE_DRIVE_PRIVATE_KEY` | File JSON → `private_key` | `-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n` |
| `GOOGLE_DRIVE_SHARED_DRIVE_ID` | Langkah 7 | `0ABCDEFGHIJKLMNOPQRSTUVWXYZ` |

> **PENTING**: `private_key` harus diapit tanda kutip dua `"..."` dengan `\n` literal (bukan baris baru beneran).

Format untuk `.env`:
```env
GOOGLE_DRIVE_CLIENT_EMAIL=erp-rri-storage@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_SHARED_DRIVE_ID=0ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

## Langkah 9 — Verifikasi Koneksi

Jalankan script berikut di terminal untuk verifikasi Service Account bisa akses Shared Drive:

```bash
# Isi dari .env
GOOGLE_DRIVE_CLIENT_EMAIL="erp-rri-storage@project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_SHARED_DRIVE_ID="0ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# Generate JWT assertion dan dapatkan access token
JWT_HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64 -w0 | sed 's/+/-/g; s/\//_/g; s/=//g')
JWT_CLAIM=$(echo -n "{\"iss\":\"$GOOGLE_DRIVE_CLIENT_EMAIL\",\"scope\":\"https://www.googleapis.com/auth/drive\",\"aud\":\"https://oauth2.googleapis.com/token\",\"exp\":$(($(date +%s)+3600)),\"iat\":$(date +%s)}" | base64 -w0 | sed 's/+/-/g; s/\//_/g; s/=//g')

# (Untuk verifikasi penuh, sebaiknya pakai Google Auth Library)
# Alternatif: install dan jalankan script Node.js sederhana
```

Atau tunggu developer mengimplementasikan di aplikasi dan verifikasi via halaman System Health.

---

## Yang Harus Dikirim ke Developer

Setelah selesai, kirim 3 nilai ini:

```
GOOGLE_DRIVE_CLIENT_EMAIL=...
GOOGLE_DRIVE_PRIVATE_KEY="..."
GOOGLE_DRIVE_SHARED_DRIVE_ID=...
```

Developer akan memasang di file `.env` aplikasi.

---

## Referensi

- [Google Drive API Overview](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Accounts](https://cloud.google.com/iam/docs/service-account-overview)
- [Shared Drives API](https://developers.google.com/drive/api/guides/drive-folder)
