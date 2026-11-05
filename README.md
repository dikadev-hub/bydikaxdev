# bydikaxdev — nokos otp store

> website nokos murah, aman, dan terpercaya. tema neobrutalism x glassmorphism x komik halus.

**created & developed by: dika x dev** · gratis & open source (mit) — *tidak dijual belikan*.

## fitur

- landing page dengan logo 1:1, simulasi order interaktif, statistik (total user / order / otp sukses), leaderboard order
- beli nokos: pilih negara → layanan → server (harga, stok, tingkat otp realtime), support bulk order 1–10 nomor
- pantau otp realtime — auto refresh tiap 5 detik, tombol kirim ulang & batalkan (refund saldo otomatis)
- deposit qris — qr otomatis, auto-cek pembayaran tiap 5 detik, saldo masuk otomatis, bisa dibatalkan
- riwayat transaksi lengkap dengan filter
- semua nama website & harga diatur dari satu file `config.js` tanpa menyentuh html
- potong saldo server-side, validasi harga dari api asli, harga user = harga provider + markup

## struktur

```
bydikaxdev/
├── config.js          pengaturan: namaWebsite, baseUrl, baseApikey, markupHarga, port
├── server.js          express + proxy api + json db + auth session
├── credit.txt         credit & lisensi
├── database/
│   ├── user.json      user (dibuat otomatis)
│   └── trx.json       riwayat transaksi (dibuat otomatis)
├── media/
│   └── logo.jpg       logo 1:1
└── public/
    ├── assets/{style.css, app.js}
    ├── index.html     landing + simulasi order
    ├── dashboard.html dashboard (saldo, quick buy, order aktif, leaderboard)
    ├── nokos.html     beli nokos + pantau otp
    ├── deposit.html   deposit qris
    ├── trx.html       riwayat transaksi
    ├── docs.html      panduan pengguna
    └── 404.html
```

## cara menjalankan

```
npm install
```

isi api key di `config.js` pada baris `baseApikey` dengan x-user-id kamu dari provider.

```
npm start
```

buka `http://localhost:3120`. ubah port lewat `config.js` atau environment `PORT=8080 npm start`.

## konfigurasi (config.js)

| key | keterangan |
|---|---|
| namaWebsite | nama brand yang muncul di semua halaman |
| baseUrl | base url provider (default https://api.ruangotp.net/api) |
| baseApikey | wajib — isi x-user-id kamu dari provider |
| markupHarga | semua harga nokos naik sebesar ini |
| feeDepositPersen | fee deposit yang ditampilkan (mengikuti provider qris) |
| port | port server |

## api internal

| endpoint | fungsi |
|---|---|
| POST /api/auth/register · /api/auth/login | daftar & login (token session) |
| GET /api/me | profil + saldo |
| GET /api/stats | statistik publik + leaderboard |
| GET /api/nokos/countries · /services · /harga | data produk (harga sudah + markup) |
| GET /api/nokos/buy · /buy-bulk | beli nomor (auth, potong saldo) |
| GET /api/nokos/status/:orderId | cek otp (auto-update riwayat) |
| GET /api/nokos/resend/:orderId · /cancel/:orderId | resend / batal + refund |
| GET /api/deposit/create · /check/:id · /cancel/:id | qris deposit + auto verify |
| GET /api/trx | riwayat transaksi user |

## testing results

- register → login → deposit flow → buy flow → status → cancel/refund diuji end-to-end
- saldo persisten setelah restart (atomic write json)
- saldo tidak cukup ditolak sebelum request provider; refund otomatis saat order gagal/batal
- responsive 360px–1440px

## known limitations

- session in-memory: login hilang saat server restart (user tinggal login ulang)
- deposit mengikuti fee provider (±20%); ubah feeDepositPersen agar tampilan sesuai
- fitur live memerlukan baseApikey valid dari provider

## license

mit — bebas pakai & modifikasi. **dilarang menjual ulang script ini.** jangan hapus credit developer ya.
