// ================= CONFIG BYDIKAXDEV =================
// Edit file ini untuk mengubah SEMUA nama & harga di website.
// Tidak perlu menyentuh HTML — semua page membaca config ini via /api/config.

module.exports = {
  namaWebsite: "DikaOTP",
  tagline: "Nokos murah, aman, dan terpercaya",
  deskripsi: "website nokos murah aman dan terpercaya. Beli nomor OTP untuk WhatsApp dan 100+ layanan lain dari 20+ negara, proses instan, pembayaran QRIS otomatis.",
  baseUrl: "https://api.ruangotp.net/api",
  baseApikey: "",            // ← ISI x-user-id kamu di sini (wajib untuk live)
  markupHarga: 500,          // semua harga nokos naik 500p
  feeDepositPersen: 20,      // fee deposit % (mengikuti provider QRIS)
  port: 3120,
  logoPath: "/media/logo.jpg",
  currency: "IDR",
  footerText: "© 2026 {NAMA} — Small prices. Instant OTP."
};
