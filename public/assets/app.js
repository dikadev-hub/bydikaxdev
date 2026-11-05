// BYDIKAXDEV — shared frontend helper. Created & Developed By: Dika X Dev
const GA = (() => {
  let CFG = { namaWebsite: "DikaOTP", tagline: "", logoPath: "/media/logo.jpg", footerText: "", live: false };

  async function api(path, opts = {}) {
    const h = { "Content-Type": "application/json", ...(opts.headers || {}) };
    const tok = getToken();
    if (tok) h.Authorization = "Bearer " + tok;
    const r = await fetch(path, { ...opts, headers: h });
    return r.json().catch(() => ({ success: false, message: "Respon tidak valid" }));
  }
  const getToken = () => localStorage.getItem("bx_token") || "";
  const getUser = () => { try { return JSON.parse(localStorage.getItem("bx_user") || "null"); } catch { return null; } };
  function setSession(tok, user) {
    localStorage.setItem("bx_token", tok);
    localStorage.setItem("bx_user", JSON.stringify(user));
  }
  function logout() { localStorage.removeItem("bx_token"); localStorage.removeItem("bx_user"); location.href = "/"; }
  const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

  function toast(msg, type = "") {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = type; void t.offsetWidth; t.classList.add("show");
    clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("show"), 3200);
  }

  async function loadConfig() {
    const j = await api("/api/config");
    if (j.success) CFG = { ...CFG, ...j.data };
    document.querySelectorAll("[data-cfg='nama']").forEach(e => e.textContent = CFG.namaWebsite);
    document.querySelectorAll("[data-cfg='tagline']").forEach(e => e.textContent = CFG.tagline);
    document.querySelectorAll("[data-cfg='desk']").forEach(e => e.textContent = CFG.deskripsi);
    document.querySelectorAll("[data-cfg='footer']").forEach(e => e.textContent = CFG.footerText);
    document.querySelectorAll("img.brand-logo").forEach(e => { if (CFG.logoPath) e.src = CFG.logoPath; });
    document.title = CFG.namaWebsite + " — " + (CFG.tagline || "Nokos Murah");
    return CFG;
  }

  // shell: navbar (public & dashboard) + footer
  function nav(active, isDash = false) {
    const u = getUser();
    const links = isDash
      ? [["/dashboard", "Dashboard", "dash"], ["/deposit", "Deposit", "dep"], ["/nokos", "Buy Nokos", "nok"], ["/trx", "Riwayat", "trx"]]
      : [["/docs", "Docs", "docs"]];
    return `
    <nav class="nav glass">
      <button class="btn btn-sm sidebar-toggle" onclick="GA.sideToggle()">☰</button>
      <a class="brand" href="/"><img class="brand-logo" alt="logo"> <span data-cfg="nama">${CFG.namaWebsite}</span></a>
      <div class="nav-links" id="navLinks">
        ${links.map(l => `<a href="${l[0]}" class="${active === l[2] ? "active" : ""}">${l[1]}</a>`).join("")}
        ${u ? `<a href="/dashboard">Hi, ${u.nama.split(" ")[0]} 👋</a><a href="#" onclick="GA.logout();return false">Logout</a>`
            : `<a href="#" onclick="GA.openAuth();return false">Masuk / Daftar</a>`}
      </div>
    </nav>`;
  }
  const footer = () => `
    <footer><div class="container f-inner">
      <div class="credit-tag">Made with 🧡 by <b>Dika X Dev</b></div>
      <div><span data-cfg="footer"></span> · <a href="/docs">Docs</a></div>
      <div style="font-size:13px;color:#9b9188">Script gratis &amp; open source — tidak dijual belikan.</div>
    </div></footer>`;

  function sideToggle() {
    const s = document.querySelector(".sidebar"); if (s) s.classList.toggle("open");
    document.getElementById("navLinks")?.classList.toggle("open");
  }

  // auth modal (login + register)
  function openAuth() {
    const m = document.createElement("div");
    m.className = "modal-back show";
    m.innerHTML = `<div class="modal glass card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 id="authTitle">Masuk</h3>
        <button class="btn btn-sm" onclick="this.closest('.modal-back').remove()">✕</button>
      </div>
      <div class="field"><label>Email</label><input id="aEmail" type="email" placeholder="kamu@email.com"></div>
      <div class="field"><label>Password</label><input id="aPass" type="password" placeholder="••••••••"></div>
      <div class="field" id="aNamaWrap" style="display:none"><label>Nama</label><input id="aNama" placeholder="Nama kamu"></div>
      <button class="btn btn-yellow full" id="aBtn">Masuk</button>
      <p class="hint" style="text-align:center;margin-top:12px"><a href="#" id="aSwap" style="font-weight:800">Belum punya akun? Daftar</a></p>
    </div>`;
    document.body.appendChild(m);
    let mode = "login";
    const swap = m.querySelector("#aSwap"), title = m.querySelector("#authTitle"), btn = m.querySelector("#aBtn"), nw = m.querySelector("#aNamaWrap");
    swap.onclick = (e) => {
      e.preventDefault();
      mode = mode === "login" ? "register" : "login";
      title.textContent = mode === "login" ? "Masuk" : "Daftar";
      btn.textContent = mode === "login" ? "Masuk" : "Daftar";
      nw.style.display = mode === "login" ? "none" : "block";
      swap.textContent = mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk";
    };
    btn.onclick = async () => {
      const email = m.querySelector("#aEmail").value.trim(), pass = m.querySelector("#aPass").value, nama = m.querySelector("#aNama")?.value.trim();
      if (!email || !pass) return toast("Email & password wajib diisi", "err");
      btn.disabled = true;
      const j = await api("/api/auth/" + mode, { method: "POST", body: JSON.stringify({ email, password: pass, nama }) });
      btn.disabled = false;
      if (!j.success) return toast(j.message || "Gagal", "err");
      if (mode === "register") { toast("Daftar sukses! Silakan masuk", "ok"); swap.click(); return; }
      setSession(j.data.token, j.data.user);
      m.remove(); toast("Selamat datang, " + j.data.user.nama + "!", "ok");
      setTimeout(() => location.href = "/dashboard", 500);
    };
  }

  async function refreshSaldo() {
    const j = await api("/api/me");
    if (j.success) {
      const u = getUser(); if (u) { u.saldo = j.data.saldo; localStorage.setItem("bx_user", JSON.stringify(u)); }
      document.querySelectorAll("[data-saldo]").forEach(e => e.textContent = rp(j.data.saldo));
    }
    return j;
  }

  const statusPill = (s) => {
    const map = { WAIT_CODE: ["blue", "Menunggu OTP"], ACTIVE: ["yellow", "Aktif"], COMPLETED: ["green", "Sukses"], CANCELLED: ["red", "Batal"], CANCELED: ["red", "Batal"], PENDING: ["yellow", "Menunggu Bayar"], PAID: ["green", "Dibayar"], OK: ["green", "OK"], RESEND: ["pink", "Resend"], REFUND: ["pink", "Refund"], SALDO_MASUK: ["green", "Saldo Masuk"], DEPOSIT: ["blue", "Deposit"], ORDER: ["blue", "Order"], REGISTER: ["yellow", "Daftar"] };
    const m = map[s] || ["", s || "-"];
    return `<span class="pill ${m[0]}">${m[1]}</span>`;
  };

  return { api, getToken, getUser, setSession, logout, rp, toast, loadConfig, nav, footer, sideToggle, openAuth, refreshSaldo, statusPill, CFG };
})();
window.GA = GA;
