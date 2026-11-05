const express = require("express");
const path = require("path");
const fs = require("fs");
const config = require("./config");

const app = express();
app.use(express.json());

const DB_DIR = path.join(__dirname, "database");
const readDB = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DB_DIR, f), "utf8")); } catch { return d; } };
const writeDB = (f, d) => { const p = path.join(DB_DIR, f), t = p + ".tmp"; fs.writeFileSync(t, JSON.stringify(d, null, 2)); fs.renameSync(t, p); };
const users = () => readDB("user.json", {});
const trx = () => readDB("trx.json", []);
const saveUsers = (u) => writeDB("user.json", u);
const saveTrx = (t) => writeDB("trx.json", t);

const uid = () => "U" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => new Date().toISOString();
const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const sessions = {};

function auth(req, res, next) {
  const tok = (req.headers.authorization || "").replace("Bearer ", "");
  const userId = sessions[tok];
  if (!userId) return res.status(401).json({ success: false, message: "Silakan login dulu" });
  req.userId = userId;
  req.user = users()[userId];
  next();
}

function addTrx(entry) {
  const t = trx();
  t.unshift({ id: "T" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), waktu: now(), ...entry });
  saveTrx(t.slice(0, 5000));
}

async function upstream(pathname, params = {}) {
  const q = new URLSearchParams(params).toString();
  const url = config.baseUrl + pathname + (q ? "?" + q : "");
  const r = await fetch(url, { headers: { "x-user-id": config.baseApikey || "0" } });
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch { j = { success: false, error: { message: "Respon tidak valid dari provider" } }; }
  return j;
}

function markupServers(servers = []) {
  return servers.map(s => ({ ...s, harga: (s.harga || 0) + config.markupHarga }));
}

app.use("/media", express.static(path.join(__dirname, "media"), { maxAge: "1d" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/config", (req, res) => res.json({
  success: true,
  data: {
    namaWebsite: config.namaWebsite,
    tagline: config.tagline,
    deskripsi: config.deskripsi,
    markupHarga: config.markupHarga,
    feeDepositPersen: config.feeDepositPersen,
    logoPath: config.logoPath,
    currency: config.currency,
    footerText: config.footerText.replace("{NAMA}", config.namaWebsite),
    live: !!config.baseApikey
  }
}));

app.post("/api/auth/register", (req, res) => {
  const { email, password, nama } = req.body || {};
  if (!email || !password) return res.json({ success: false, message: "Email & password wajib" });
  const U = users();
  if (Object.values(U).some(u => u.email === email.toLowerCase())) return res.json({ success: false, message: "Email sudah terdaftar" });
  const id = uid();
  U[id] = { id, email: email.toLowerCase(), password, nama: nama || email.split("@")[0], saldo: 0, dibuat: now() };
  saveUsers(U);
  addTrx({ userId: id, email: U[id].email, tipe: "REGISTER", nominal: 0, status: "OK" });
  res.json({ success: true, data: { userId: id } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const U = users();
  const u = Object.values(U).find(x => x.email === (email || "").toLowerCase() && x.password === password);
  if (!u) return res.json({ success: false, message: "Email atau password salah" });
  const tok = uid() + uid();
  sessions[tok] = u.id;
  res.json({ success: true, data: { token: tok, user: { userId: u.id, email: u.email, nama: u.nama, saldo: u.saldo } } });
});

app.get("/api/me", auth, (req, res) => {
  const u = users()[req.userId];
  res.json({ success: true, data: { userId: u.id, email: u.email, nama: u.nama, saldo: u.saldo } });
});

app.get("/api/stats", async (req, res) => {
  const T = trx();
  const totalUser = Object.values(users()).length;
  const orders = T.filter(t => t.tipe === "ORDER");
  const otpSukses = T.filter(t => t.tipe === "ORDER" && t.status === "COMPLETED");
  const perUser = {};
  orders.forEach(t => { const k = t.nama || t.email; perUser[k] = (perUser[k] || 0) + 1; });
  const leaderboard = Object.entries(perUser).map(([nama, total]) => ({ nama, total })).sort((a, b) => b.total - a.total).slice(0, 10);
  res.json({ success: true, data: { totalUser, totalOrder: orders.length, otpSukses: otpSukses.length, leaderboard } });
});

app.get("/api/nokos/countries", async (req, res) => res.json(await upstream("/country-v2/list")));
app.get("/api/nokos/services", async (req, res) => res.json(await upstream("/services-v2/list", { country: req.query.country || 6 })));

app.get("/api/nokos/harga", async (req, res) => {
  const j = await upstream("/cekharga-v2/info", { service: req.query.service, country: req.query.country });
  if (j && j.status && Array.isArray(j.server)) j.server = markupServers(j.server);
  res.json(j);
});

app.get("/api/nokos/buy", auth, async (req, res) => {
  const { service, country, provider_id } = req.query;
  const U = users();
  const u = U[req.userId];
  if (!service || !country || !provider_id) return res.json({ success: false, error: { message: "service, country, provider_id wajib" } });
  const hj = await upstream("/cekharga-v2/info", { service, country });
  const srv = (hj && hj.status ? hj.server : []).find(s => String(s.id) === String(provider_id));
  if (!srv) return res.json({ success: false, error: { message: "Server tidak ditemukan / stok habis" } });
  const finalPrice = srv.harga + config.markupHarga;
  if (u.saldo < finalPrice) return res.json({ success: false, error: { message: "Saldo tidak cukup. Harga " + rupiah(finalPrice) + ", saldo kamu " + rupiah(u.saldo) + ". Deposit dulu ya." } });
  u.saldo -= finalPrice;
  saveUsers(U);
  const j = await upstream("/order-v2/buy", { service, country, provider_id, expected_price: srv.harga });
  if (!j.success) {
    u.saldo += finalPrice;
    saveUsers(U);
    return res.json(j);
  }
  const o = j.data || {};
  o.hargaUser = finalPrice;
  o.userId = u.id;
  o.userNama = u.nama;
  o.userEmail = u.email;
  addTrx({ userId: u.id, nama: u.nama, email: u.email, tipe: "ORDER", orderId: o.orderId, layanan: (hj.layanan || service), negara: (o.countryName || country), nomor: o.phoneNumber, nominal: finalPrice, status: o.status || "WAIT_CODE" });
  res.json(j);
});

app.get("/api/nokos/buy-bulk", auth, async (req, res) => {
  const { service, country, provider_id } = req.query;
  const U = users();
  const u = U[req.userId];
  const n = Math.max(1, Math.min(10, parseInt(req.query.total) || 1));
  if (!service || !country || !provider_id) return res.json({ success: false, error: { message: "service, country, provider_id wajib" } });
  const hj = await upstream("/cekharga-v2/info", { service, country });
  const srv = (hj && hj.status ? hj.server : []).find(s => String(s.id) === String(provider_id));
  if (!srv) return res.json({ success: false, error: { message: "Server tidak ditemukan / stok habis" } });
  const unit = srv.harga + config.markupHarga;
  if (u.saldo < unit * n) return res.json({ success: false, error: { message: "Saldo tidak cukup. Butuh " + rupiah(unit * n) + ", saldo kamu " + rupiah(u.saldo) } });
  u.saldo -= unit * n;
  saveUsers(U);
  const j = await upstream("/order-v2/buy-bulk", { service, country, provider_id, expected_price: srv.harga, total: n });
  if (!j.success) {
    u.saldo += unit * n;
    saveUsers(U);
    return res.json(j);
  }
  const d = j.data || {};
  (d.orders || []).forEach(o => {
    o.hargaUser = unit;
    addTrx({ userId: u.id, nama: u.nama, email: u.email, tipe: "ORDER", orderId: o.orderId, layanan: (hj.layanan || service), negara: (o.countryName || country), nomor: o.phoneNumber, nominal: unit, status: o.status || "WAIT_CODE" });
  });
  res.json(j);
});

app.get("/api/nokos/status/:orderId", auth, async (req, res) => {
  const j = await upstream("/order-v2/check-status", { order_id: req.params.orderId });
  if (j.success && j.data && j.data.status === "COMPLETED") {
    const T = trx();
    const t = T.find(x => x.orderId === req.params.orderId && x.userId === req.userId);
    if (t && t.status !== "COMPLETED") {
      t.status = "COMPLETED";
      t.otp = j.data.otp_code;
      saveTrx(T);
    }
  }
  res.json(j);
});

app.get("/api/nokos/resend/:orderId", auth, async (req, res) => res.json(await upstream("/order-v2/resend", { order_id: req.params.orderId })));

app.get("/api/nokos/cancel/:orderId", auth, async (req, res) => {
  const j = await upstream("/order-v2/cancel", { order_id: req.params.orderId });
  if (j.success) {
    const T = trx();
    const t = T.find(x => x.orderId === req.params.orderId && x.userId === req.userId);
    if (t) {
      t.status = "CANCELLED";
      saveTrx(T);
    }
    const rf = (j.data && j.data.refund_amount) || 0;
    if (rf > 0) {
      const U = users();
      U[req.userId].saldo = (U[req.userId].saldo || 0) + rf;
      saveUsers(U);
      addTrx({ userId: req.userId, nama: U[req.userId].nama, email: U[req.userId].email, tipe: "REFUND", orderId: req.params.orderId, nominal: rf, status: "OK" });
    }
  }
  res.json(j);
});

app.get("/api/deposit/create", auth, async (req, res) => {
  const amount = parseInt(req.query.amount);
  if (!amount || amount < 1000) return res.json({ success: false, message: "Minimal deposit 1.000" });
  const j = await upstream("/deposit/create", { amount });
  if (j.success) {
    addTrx({ userId: req.userId, nama: req.user.nama, email: req.user.email, tipe: "DEPOSIT", depositId: j.data.deposit_id, nominal: amount, bayar: j.data.total_pay, status: "PENDING" });
  }
  res.json(j);
});

app.get("/api/deposit/check/:depositId", auth, async (req, res) => {
  const j = await upstream("/deposit/check-status", { deposit_id: req.params.depositId });
  const st = j.success && j.data ? j.data.status : null;
  const T = trx();
  const t = T.find(x => x.depositId === req.params.depositId && x.userId === req.userId);
  if (t && (st === "success" || st === "canceled") && t.status === "PENDING") {
    t.status = st === "success" ? "PAID" : "CANCELED";
    saveTrx(T);
    if (st === "success") {
      const U = users();
      U[req.userId].saldo = (U[req.userId].saldo || 0) + (t.nominal || 0);
      saveUsers(U);
      addTrx({ userId: req.userId, nama: req.user.nama, email: req.user.email, tipe: "SALDO_MASUK", depositId: req.params.depositId, nominal: t.nominal, status: "OK" });
    }
  }
  res.json(j);
});

app.get("/api/deposit/cancel/:depositId", auth, async (req, res) => {
  const j = await upstream("/deposit/cancel", { deposit_id: req.params.depositId });
  if (j.success) {
    const T = trx();
    const t = T.find(x => x.depositId === req.params.depositId && x.userId === req.userId);
    if (t && t.status === "PENDING") {
      t.status = "CANCELED";
      saveTrx(T);
    }
  }
  res.json(j);
});

app.get("/api/trx", auth, (req, res) => {
  res.json({ success: true, data: trx().filter(t => t.userId === req.userId).slice(0, 200) });
});

app.get("/api/orders/active", auth, (req, res) => {
  res.json({ success: true, data: trx().filter(t => t.userId === req.userId && t.tipe === "ORDER" && ["WAIT_CODE", "ACTIVE", "RESEND"].includes(t.status)).slice(0, 50) });
});

const PAGES = ["index", "dashboard", "trx", "deposit", "nokos", "docs"];
PAGES.forEach(p => app.get("/" + p, (req, res) => res.sendFile(path.join(__dirname, "public", p + ".html"))));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "public", "404.html")));

const PORT = process.env.PORT || config.port;
app.listen(PORT, "0.0.0.0", () => console.log(`[BYDIKAXDEV] ${config.namaWebsite} berjalan di http://0.0.0.0:${PORT}`));
