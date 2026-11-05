const GA = (() => {
  let CFG = { namaWebsite: "DikaOTP", tagline: "", logoPath: "/media/logo.jpg", footerText: "", live: false, minPriceLabel: "5k" };

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
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      document.body.appendChild(t);
    }
    t.innerHTML = (type === "err" ? '<i class="fa-solid fa-circle-exclamation"></i> ' : type === "ok" ? '<i class="fa-solid fa-circle-check"></i> ' : '<i class="fa-solid fa-circle-info"></i> ') + msg;
    t.className = type;
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove("show"), 3200);
  }

  async function loadConfig() {
    const j = await api("/api/config");
    if (j.success) CFG = { ...CFG, ...j.data };
    document.querySelectorAll("[data-cfg='nama']").forEach(e => e.textContent = CFG.namaWebsite);
    document.querySelectorAll("[data-cfg='tagline']").forEach(e => e.textContent = CFG.tagline);
    document.querySelectorAll("[data-cfg='desk']").forEach(e => e.textContent = CFG.deskripsi);
    document.querySelectorAll("[data-cfg='footer']").forEach(e => e.textContent = CFG.footerText);
    document.querySelectorAll("[data-cfg='minprice']").forEach(e => e.textContent = CFG.minPriceLabel || "5k");
    document.querySelectorAll("img.brand-logo").forEach(e => { if (CFG.logoPath) e.src = CFG.logoPath; });
    document.title = CFG.namaWebsite + " — Nokos Murah, Aman & Instan";
    return CFG;
  }

  function nav(active, isDash = false) {
    const u = getUser();
    const links = isDash
      ? [["/dashboard", "Dashboard", "fa-gauge-high", "dash"], ["/deposit", "Deposit", "fa-money-bill-transfer", "dep"], ["/nokos", "Beli Nokos", "fa-sim-card", "nok"], ["/trx", "Riwayat", "fa-receipt", "trx"]]
      : [["/docs", "Panduan", "fa-book-open", "docs"]];
    return `
    <nav class="topnav">
      <a class="nav-brand" href="/">
        <img class="brand-logo" alt="logo">
        <span data-cfg="nama">${CFG.namaWebsite}</span>
      </a>
      <div class="nav-right">
        ${links.map(l => `<a href="${l[0]}" class="nav-link ${active === l[3] ? "active" : ""}"><i class="fa-solid ${l[2]}"></i> ${l[1]}</a>`).join("")}
        ${u
          ? `<span class="nav-user"><i class="fa-solid fa-circle-user"></i> ${u.nama.split(" ")[0]}</span><a href="#" class="nav-link nav-out" onclick="GA.logout();return false"><i class="fa-solid fa-right-from-bracket"></i></a>`
          : `<a href="#" class="nav-link" onclick="GA.openAuth();return false"><i class="fa-solid fa-right-to-bracket"></i> Masuk / Daftar</a>`}
      </div>
    </nav>`;
  }

  const footer = () => `
    <footer class="site-footer">
      <div class="foot-inner">
        <div class="foot-brand">
          <img class="brand-logo" alt="logo">
          <div>
            <b data-cfg="nama">${CFG.namaWebsite}</b>
            <p data-cfg="tagline"></p>
          </div>
        </div>
        <div class="foot-links">
          <a href="/docs"><i class="fa-solid fa-book-open"></i> Panduan</a>
          <a href="/nokos"><i class="fa-solid fa-sim-card"></i> Beli Nokos</a>
          <a href="/deposit"><i class="fa-solid fa-qrcode"></i> Deposit QRIS</a>
        </div>
      </div>
      <div class="foot-copy">
        <span data-cfg="footer"></span> · made with <i class="fa-solid fa-heart" style="color:#ff5d8f"></i> by <b>dika x dev</b> · script gratis &amp; open source, tidak dijual belikan
      </div>
    </footer>`;

  function sideToggle() {
    const s = document.querySelector(".sidebar");
    if (s) s.classList.toggle("open");
  }

  function openAuth() {
    if (document.getElementById("authModalBack")) return;
    const m = document.createElement("div");
    m.className = "modal-back show";
    m.id = "authModalBack";
    m.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3 id="authTitle"><i class="fa-solid fa-right-to-bracket"></i> Masuk Akun</h3>
        <button class="modal-close" onclick="document.getElementById('authModalBack').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="field"><label><i class="fa-solid fa-envelope"></i> Email</label><input id="aEmail" type="email" placeholder="kamu@email.com"></div>
      <div class="field"><label><i class="fa-solid fa-lock"></i> Password</label><input id="aPass" type="password" placeholder="••••••••"></div>
      <div class="field" id="aNamaWrap" style="display:none"><label><i class="fa-solid fa-user"></i> Nama</label><input id="aNama" placeholder="Nama kamu"></div>
      <button class="btn btn-yellow full" id="aBtn"><i class="fa-solid fa-rocket"></i> Masuk Sekarang</button>
      <p class="hint" style="text-align:center;margin-top:12px"><a href="#" id="aSwap" style="font-weight:800;color:var(--ink)">belum punya akun? daftar</a></p>
    </div>`;
    document.body.appendChild(m);
    let mode = "login";
    const swap = m.querySelector("#aSwap"), title = m.querySelector("#authTitle"), btn = m.querySelector("#aBtn"), nw = m.querySelector("#aNamaWrap");
    swap.onclick = (e) => {
      e.preventDefault();
      mode = mode === "login" ? "register" : "login";
      title.innerHTML = mode === "login" ? '<i class="fa-solid fa-right-to-bracket"></i> Masuk Akun' : '<i class="fa-solid fa-user-plus"></i> Daftar Akun';
      btn.innerHTML = mode === "login" ? '<i class="fa-solid fa-rocket"></i> Masuk Sekarang' : '<i class="fa-solid fa-rocket"></i> Daftar Sekarang';
      nw.style.display = mode === "login" ? "none" : "block";
      swap.textContent = mode === "login" ? "belum punya akun? daftar" : "sudah punya akun? masuk";
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
      m.remove();
      toast("Selamat datang, " + j.data.user.nama + "!", "ok");
      setTimeout(() => location.href = "/dashboard", 500);
    };
  }

  async function refreshSaldo() {
    const j = await api("/api/me");
    if (j.success) {
      const u = getUser();
      if (u) {
        u.saldo = j.data.saldo;
        localStorage.setItem("bx_user", JSON.stringify(u));
      }
      document.querySelectorAll("[data-saldo]").forEach(e => e.textContent = rp(j.data.saldo));
    }
    return j;
  }

  const statusPill = (s) => {
    const map = {
      WAIT_CODE: ["st-wait", "fa-hourglass-half", "menunggu otp"],
      ACTIVE: ["st-act", "fa-bolt", "aktif"],
      COMPLETED: ["st-ok", "fa-circle-check", "sukses"],
      CANCELLED: ["st-bad", "fa-ban", "batal"],
      CANCELED: ["st-bad", "fa-ban", "batal"],
      PENDING: ["st-act", "fa-clock", "menunggu bayar"],
      PAID: ["st-ok", "fa-circle-check", "dibayar"],
      OK: ["st-ok", "fa-circle-check", "ok"],
      RESEND: ["st-resend", "fa-rotate", "resend"],
      REFUND: ["st-resend", "fa-rotate-left", "refund"],
      SALDO_MASUK: ["st-ok", "fa-wallet", "saldo masuk"],
      DEPOSIT: ["st-depo", "fa-qrcode", "deposit"],
      ORDER: ["st-depo", "fa-bag-shopping", "order"],
      REGISTER: ["st-act", "fa-user-plus", "daftar"]
    };
    const m = map[s] || ["", "fa-tag", s || "-"];
    return `<span class="pill ${m[0]}"><i class="fa-solid ${m[1]}"></i> ${m[2]}</span>`;
  };

  return { api, getToken, getUser, setSession, logout, rp, toast, loadConfig, nav, footer, sideToggle, openAuth, refreshSaldo, statusPill, CFG };
})();
window.GA = GA;
