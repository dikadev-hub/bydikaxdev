# 💳 BYDIKAXDEV — Nokos OTP Store

> Website nokos murah, aman, dan terpercaya. Dibuat dengan tema **neobrutalism × glassmorphism × smooth comic**.

**Created & Developed By: Dika X Dev** · Gratis & open source (MIT) — *tidak dijual belikan*.

---

## ✨ Fitur

- 🏠 **Landing page** — logo 1:1, penjelasan, grid statistik (total user / total order / OTP sukses), leaderboard order terbanyak
- ⚡ **Buy Nokos** — pilih negara → layanan → server (harga, stok, tingkat OTP realtime), support **bulk order** 1–10 nomor
- 📱 **Pantau OTP realtime** — modal auto-refresh tiap 5 detik, tombol kirim ulang & batalkan (refund saldo otomatis)
- 💰 **Deposit QRIS** — QR otomatis, auto-cek pembayaran tiap 5 detik, saldo masuk otomatis, bisa dibatalkan
- 🧾 **Riwayat transaksi** — semua order, deposit, refund tercatat dengan filter
- 🎛️ **Config tunggal** — semua nama website, markup harga, port diatur dari `config.js` tanpa sentuh HTML
- 🔒 Potong saldo server-side, validasi harga dari API asli (bukan percaya client), harga user = harga provider + markup

## 🗂️ Struktur

```
bydikaxdev/
├── config.js          # SEMUA pengaturan: namaWebsite, baseUrl, baseApikey, markupHarga, port
├── server.js          # Express + proxy API + JSON DB + auth session
├── credit.txt         # Credit & lisensi
├── database/
│   ├── user.json      # User (dibuat otomatis)
│   └── trx.json       # Riwayat transaksi (dibuat otomatis)
├── media/
│   └── logo.jpg       # Logo 1:1
└── public/
    ├── assets/{style.css, app.js}
    ├── index.html     # Landing
    ├── dashboard.html # Dashboard (saldo, quick buy, order aktif, leaderboard)
    ├── nokos.html     # Buy nokos + pantau OTP
    ├── deposit.html   # Deposit QRIS
    ├── trx.html       # Riwayat transaksi
    ├── docs.html      # Dokumentasi pengguna
    └── 404.html
```

## 🚀 Cara Menjalankan

```bash
# 1. Install dependency
npm install

# 2. Isi API key di config.js
#    baseApikey: "USER_ID_RUANGOTP_KAMU"

# 3. Jalankan
npm start
# → http://localhost:3120
```

Ubah port lewat `config.js` (`port`) atau environment `PORT=8080 npm start`.

## ⚙️ Konfigurasi (`config.js`)

| Key | Keterangan |
|---|---|
| `namaWebsite` | Nama brand yang muncul di semua halaman |
| `baseUrl` | Base URL provider (default `https://api.ruangotp.net/api`) |
| `baseApikey` | **WAJIB** — isi `x-user-id` kamu dari provider |
| `markupHarga` | Semua harga nokos naik sebesar ini (poin/rupiah) |
| `feeDepositPersen` | Fee deposit yang ditampilkan (mengikuti provider QRIS) |
| `port` | Port server |

## 🔌 API Internal

| Endpoint | Fungsi |
|---|---|
| `POST /api/auth/register` · `/api/auth/login` | Daftar & login (token session) |
| `GET /api/me` | Profil + saldo |
| `GET /api/stats` | Statistik publik + leaderboard |
| `GET /api/nokos/countries` · `/services` · `/harga` | Data produk (harga sudah + markup) |
| `GET /api/nokos/buy` · `/buy-bulk` | Beli nomor (auth, potong saldo) |
| `GET /api/nokos/status/:orderId` | Cek OTP (auto-update riwayat) |
| `GET /api/nokos/resend/:orderId` · `/cancel/:orderId` | Resend / batal + refund |
| `GET /api/deposit/create` · `/check/:id` · `/cancel/:id` | QRIS deposit + auto verify |
| `GET /api/trx` | Riwayat transaksi user |

## 🧪 Testing Results

- ✅ 20+ halaman & endpoint diuji (register → login → deposit flow → buy flow → status → cancel/refund)
- ✅ Saldo persisten setelah restart (atomic write JSON)
- ✅ Guard: saldo tidak cukup ditolak sebelum request provider; refund otomatis saat order gagal/batal
- ✅ Responsive 360px–1440px, sidebar & nav mobile

## ⚠️ Known Limitations

- Session in-memory: login hilang saat server restart (user tinggal login ulang).
- Deposit mengikuti fee provider (±20%); ubah `feeDepositPersen` agar tampilan sesuai.
- Fitur live memerlukan `baseApikey` valid dari provider.

## 🛣️ Roadmap

- [ ] Notifikasi Telegram untuk OTP masuk
- [ ] Multi-admin / panel owner
- [ ] Riwayat export CSV

## 📄 License

MIT — bebas pakai & modifikasi. **Dilarang menjual ulang script ini.** Jangan hapus credit developer ya 🧡
