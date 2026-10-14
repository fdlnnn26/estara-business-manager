import { S, saveBiz, addProduct, stockIn, checkout, addExpense, addInvoice, setInvStatus } from './firebase-features.js';
import { token } from './firebase-core.js';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rp = n => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0), day = t => new Date(t).toDateString();
const profit = a => sum(a, t => sum(t.items, i => (i.price - i.cost) * i.qty) - t.disc);
const m0 = (o = 0) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() - o, 1).getTime(); };
let cart = {}, cat = 'Semua', q = '', busy = false, render = () => {};
export const setRender = f => render = f;
const close = () => $('#md')?.remove();
const modal = h => { close(); const m = document.createElement('div'); m.id = 'md'; m.className = 'modal'; m.innerHTML = `<div class="sheet">${h}</div>`; document.body.append(m); };
const items = () => Object.entries(cart).map(([id, qty]) => { const p = S.prods.find(x => x.id == id); return { id, name: p.name, price: p.price, cost: p.cost, qty }; });
const wa = (t, phone = '') => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(t)}`, '_blank');
const api = async (path, body) => {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() }, body: JSON.stringify(body || {}) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Gagal'); return j;
};
const rcpText = t => [S.biz.name?.toUpperCase(), S.biz.addr, '', 'No: ' + t.no, new Date(t.at).toLocaleString('id-ID'), '',
  ...t.items.map(i => `${i.name}\n  ${i.qty} x ${i.price.toLocaleString('id-ID')} = ${(i.qty * i.price).toLocaleString('id-ID')}`),
  ...(t.disc ? ['Diskon  -' + t.disc.toLocaleString('id-ID')] : []), '------------------------', 'TOTAL   ' + rp(t.total), t.method + '  ' + rp(t.paid),
  ...(t.method == 'Tunai' ? ['Kembali ' + rp(t.paid - t.total)] : []), '', S.biz.footer || 'Terima kasih'].filter(x => x !== undefined).join('\n');
const invText = i => `INVOICE ${i.no}\n\nDari: ${S.biz.name}\nKepada: ${i.customer}\n\n${i.item}\n${i.qty} x ${rp(i.price)}\n\nTOTAL: ${rp(i.total)}\nJatuh tempo: ${i.due}\nStatus: ${i.status}\n\n${S.biz.wa ? 'Hubungi: ' + S.biz.wa : ''}`;
const receipt = (t, fresh) => modal(`<h2 class="${fresh ? 'up' : ''}">${fresh ? 'Transaksi berhasil' : 'Nota'}</h2><pre>${esc(rcpText(t))}</pre><button class="btn" data-a="waRcp" data-no="${t.no}">Kirim WhatsApp</button><button class="btn g" onclick="print()">Cetak nota</button><button class="btn g" data-a="close">${fresh ? 'Transaksi baru' : 'Tutup'}</button>`);
function summary() {
  const cur = S.trx.filter(t => t.at >= m0()), prev = S.trx.filter(t => t.at >= m0(1) && t.at < m0());
  const by = a => { const o = {}; a.forEach(t => t.items.forEach(i => o[i.name] = (o[i.name] || 0) + i.qty)); return o; }, c = by(cur), p = by(prev);
  return { omzet_bulan_ini: sum(cur, t => t.total), omzet_bulan_lalu: sum(prev, t => t.total), laba_estimasi: profit(cur) - sum(S.exp.filter(e => e.at >= m0()), e => e.amount),
    pengeluaran_bulan_ini: sum(S.exp.filter(e => e.at >= m0()), e => e.amount), jumlah_transaksi: cur.length,
    produk_terlaris: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5), produk_turun: Object.keys(p).filter(k => (c[k] || 0) < p[k]).map(k => ({ produk: k, lalu: p[k], kini: c[k] || 0 })),
    stok_menipis: S.prods.filter(x => x.stock <= 5).map(x => x.name), piutang: sum(S.inv.filter(i => i.status != 'PAID'), i => i.total) };
}
export const pages = {
  home() {
    const d = S.trx.filter(t => day(t.at) == day(Date.now())), y = sum(S.trx.filter(t => day(t.at) == day(Date.now() - 864e5)), t => t.total), om = sum(d, t => t.total), ch = y ? (om - y) / y * 100 : null;
    const c = {}; d.forEach(t => t.items.forEach(i => c[i.name] = (c[i.name] || 0) + i.qty));
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3), low = S.prods.filter(p => p.stock <= 5);
    return `<h2>Halo, ${esc(S.biz.name)}</h2><div class="hero"><div class="mu">Omzet hari ini</div><div class="big">${rp(om)}</div>${ch !== null ? `<div class="${ch >= 0 ? 'up' : 'bad'}">${ch >= 0 ? 'naik' : 'turun'} ${Math.abs(ch).toFixed(1)}% dari kemarin</div>` : '<div class="mu">Belum ada pembanding kemarin</div>'}</div>
    <div class="row"><div class="card"><div class="mu">Transaksi</div><div class="big sm">${d.length}</div></div><div class="card"><div class="mu">Estimasi laba</div><div class="big sm">${rp(profit(d))}</div></div></div>
    <h3>Produk terlaris hari ini</h3><div class="card">${top.map(t => `<div class="li"><span>${esc(t[0])}</span><span class="mu">${t[1]} terjual</span></div>`).join('') || '<span class="mu">Belum ada penjualan. Buka Kasir untuk transaksi pertama.</span>'}</div>
    <h3>Stok menipis</h3><div class="card">${low.map(p => `<div class="li"><span>${esc(p.name)}</span><span class="warn">${p.stock} tersisa</span></div>`).join('') || '<span class="mu">Semua stok aman.</span>'}</div>`;
  },
  pos() {
    const cats = ['Semua', ...new Set(S.prods.map(p => p.cat))], list = S.prods.filter(p => (cat == 'Semua' || p.cat == cat) && p.name.toLowerCase().includes(q.toLowerCase())), it = items(), tot = sum(it, i => i.price * i.qty);
    return `<input id="q" placeholder="Cari produk" value="${esc(q)}"><div class="chips">${cats.map(c => `<button class="chip ${c == cat ? 'on' : ''}" data-a="cat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="grid">${list.map(p => `<button class="p" data-a="add" data-id="${p.id}" ${p.stock <= (cart[p.id] || 0) ? 'disabled' : ''}><b>${esc(p.name)}</b>${rp(p.price)}<div class="mu">Stok ${p.stock}</div></button>`).join('') || '<p class="mu">Belum ada produk. Tambahkan di menu Produk.</p>'}</div>
    <div class="cart"><b>Keranjang</b>${it.map(i => `<div class="li"><span>${esc(i.name)}</span><span class="q"><button data-a="sub" data-id="${i.id}">−</button> ${i.qty} <button data-a="add" data-id="${i.id}">+</button></span><span>${rp(i.price * i.qty)}</span></div>`).join('') || '<p class="mu">Pilih produk untuk memulai.</p>'}
    <div class="li"><b>Total</b><b>${rp(tot)}</b></div><button class="btn" data-a="pay" ${tot ? '' : 'disabled'}>Bayar</button></div>`;
  },
  prod() {
    return `<h2>Produk dan stok</h2><div class="card">${S.prods.map(p => `<div class="li"><span>${esc(p.name)}<br><span class="mu">Jual ${rp(p.price)} · Modal ${rp(p.cost)}</span></span><span style="text-align:right"><span class="${p.stock <= 5 ? 'warn' : ''}">Stok ${p.stock}</span><br><button class="chip" data-a="stockIn" data-id="${p.id}">Stok masuk</button></span></div>`).join('') || '<span class="mu">Belum ada produk.</span>'}</div>
    <h3>Tambah produk</h3><div class="card"><input id="pn" placeholder="Nama produk"><input id="ph" type="number" inputmode="numeric" placeholder="Harga jual"><input id="pc" type="number" inputmode="numeric" placeholder="Harga modal"><input id="ps" type="number" inputmode="numeric" placeholder="Stok awal"><input id="pk" placeholder="Kategori (Makanan, Minuman, Jasa)"><button class="btn" data-a="addProd">Simpan produk</button></div>`;
  },
  inv() {
    return `<h2>Invoice</h2><div class="card"><input id="ic" placeholder="Nama pelanggan"><input id="ii" placeholder="Deskripsi item"><input id="iq" type="number" inputmode="numeric" placeholder="Jumlah" value="1"><input id="ip" type="number" inputmode="numeric" placeholder="Harga satuan"><label class="mu">Jatuh tempo<input id="id" type="date"></label><button class="btn" data-a="addInv">Buat invoice</button></div>
    <h3>Daftar invoice</h3><div class="card">${S.inv.map(i => `<div class="li"><span>${esc(i.no)}<br><span class="mu">${esc(i.customer)} · jatuh tempo ${esc(i.due)}</span></span><span style="text-align:right">${rp(i.total)}<br><span class="${i.status == 'PAID' ? 'up' : 'warn'}">${i.status == 'PAID' ? 'Lunas' : 'Belum bayar'}</span><br><button class="chip" data-a="viewInv" data-id="${i.id}">Buka</button></span></div>`).join('') || '<span class="mu">Belum ada invoice.</span>'}</div>`;
  },
  exp() {
    return `<h2>Pengeluaran</h2><div class="card"><select id="ek">${['Bahan baku', 'Listrik', 'Internet', 'Gaji', 'Sewa', 'Transport', 'Operasional', 'Lainnya'].map(k => `<option>${k}</option>`).join('')}</select><input id="en" placeholder="Keterangan"><input id="ea" type="number" inputmode="numeric" placeholder="Nominal"><button class="btn" data-a="addExp">Simpan pengeluaran</button></div>
    <h3>Riwayat</h3><div class="card">${S.exp.slice(0, 30).map(e => `<div class="li"><span>${esc(e.cat)}<br><span class="mu">${esc(e.note)} · ${new Date(e.at).toLocaleDateString('id-ID')}</span></span><span>${rp(e.amount)}</span></div>`).join('') || '<span class="mu">Belum ada pengeluaran.</span>'}</div>`;
  },
  rep() {
    const row = (l, t, e) => { const om = sum(t, x => x.total), mod = sum(t, x => sum(x.items, i => i.cost * i.qty)), ex = sum(e, x => x.amount); return `<div class="card"><b>${l}</b><div class="li"><span>Omzet</span><span>${rp(om)}</span></div><div class="li"><span>Modal</span><span>${rp(mod)}</span></div><div class="li"><span>Pengeluaran</span><span>${rp(ex)}</span></div><div class="li"><b>Estimasi laba</b><b class="${om - mod - ex < 0 ? 'bad' : 'up'}">${rp(om - mod - ex)}</b></div><div class="mu">${t.length} transaksi</div></div>`; };
    const td = day(Date.now());
    return `<h2>Laporan</h2>${row('Hari ini', S.trx.filter(t => day(t.at) == td), S.exp.filter(e => day(e.at) == td))}<h3>Bulan ini</h3>${row(new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), S.trx.filter(t => t.at >= m0()), S.exp.filter(e => e.at >= m0()))}<h3>Riwayat nota</h3><div class="card">${S.trx.slice(0, 30).map(t => `<button class="li rowbtn" data-a="viewRcp" data-no="${t.no}"><span>${t.no}<br><span class="mu">${new Date(t.at).toLocaleString('id-ID')} · ${t.method}</span></span><b>${rp(t.total)}</b></button>`).join('') || '<span class="mu">Belum ada transaksi.</span>'}</div>`;
  },
  ai() {
    return `<h2>AI Business Assistant</h2><p class="mu">Angka dihitung aplikasi. AI hanya menganalisis ringkasannya.</p><div class="chips" style="flex-wrap:wrap">${['Analisis bisnis saya bulan ini', 'Kenapa penjualan saya turun?', 'Produk apa yang perlu dipromosikan?', 'Buatkan teks promo untuk WhatsApp'].map(s => `<button class="chip" data-a="ask" data-s="${s}">${s}</button>`).join('')}</div><input id="aq" placeholder="Tanyakan sesuatu tentang bisnis Anda"><button class="btn" data-a="ask">Tanya AI</button><div id="ao" class="card" style="margin-top:14px;white-space:pre-wrap" hidden></div>`;
  },
  set() {
    const b = S.biz;
    return `<h2>${b.name ? 'Pengaturan' : 'Selamat datang di ESTARA'}</h2>${b.name ? '' : '<p class="mu">Isi profil usaha Anda untuk mulai.</p>'}<div class="card">${b.logo ? `<img src="${esc(b.logo)}" alt="Logo" style="height:56px;border-radius:8px;margin-bottom:8px">` : ''}<input id="sn" placeholder="Nama usaha" value="${esc(b.name)}"><input id="sa" placeholder="Alamat" value="${esc(b.addr)}"><input id="sw" placeholder="Nomor WhatsApp (628...)" value="${esc(b.wa)}"><input id="sf" placeholder="Footer nota" value="${esc(b.footer)}"><button class="btn" data-a="saveSet">Simpan profil</button></div>
    ${b.name ? '<h3>Logo usaha</h3><div class="card"><input id="lf" type="file" accept="image/*"><button class="btn g" data-a="logo">Unggah logo</button></div><button class="btn g" style="margin-top:16px" data-a="logout">Keluar</button>' : ''}`;
  }
};
export const act = {
  cat: d => { cat = d.c; render(); }, add: d => { cart[d.id] = (cart[d.id] || 0) + 1; render(); },
  sub: d => { if (--cart[d.id] <= 0) delete cart[d.id]; render(); }, close, search(v) { q = v; render(); const e = $('#q'); e.focus(); e.setSelectionRange(v.length, v.length); },
  pay() { const tot = sum(items(), i => i.price * i.qty); modal(`<h2>Total ${rp(tot)}</h2><select id="mt">${['Tunai', 'QRIS', 'Transfer', 'E-Wallet'].map(m => `<option>${m}</option>`).join('')}</select><label class="mu">Diskon (Rp)<input id="ds" type="number" inputmode="numeric" value="0"></label><label class="mu">Uang diterima (tunai)<input id="rc" type="number" inputmode="numeric" value="${tot}"></label><button class="btn" data-a="done">Selesaikan</button><button class="btn g" data-a="close">Batal</button>`); },
  async done() {
    if (busy) return; busy = true;
    try {
      const it = items(), ds = +$('#ds').value || 0, tot = sum(it, i => i.price * i.qty) - ds, mt = $('#mt').value, pd = mt == 'Tunai' ? +$('#rc').value || 0 : tot;
      if (pd < tot) return alert('Uang diterima kurang.');
      const d = new Date(), n = S.trx.filter(t => day(t.at) == day(d)).length + 1;
      const t = { no: `INV-${d.toISOString().slice(0, 10).replace(/-/g, '')}-${String(n).padStart(4, '0')}`, at: +d, method: mt, disc: ds, total: tot, paid: pd, items: it };
      await checkout(t); cart = {}; render(); receipt(t, true);
    } catch (e) { alert('Gagal menyimpan: ' + e.message); } finally { busy = false; }
  },
  waRcp: d => wa(rcpText(S.trx.find(t => t.no == d.no))), viewRcp: d => receipt(S.trx.find(t => t.no == d.no)),
  async addProd() { if (!$('#pn').value.trim() || !+$('#ph').value) return alert('Isi nama dan harga jual.'); await addProduct({ name: $('#pn').value.trim(), price: +$('#ph').value, cost: +$('#pc').value || 0, stock: +$('#ps').value || 0, cat: $('#pk').value.trim() || 'Lainnya' }); render(); },
  async stockIn(d) { const v = parseInt(prompt('Jumlah stok masuk:')); if (v > 0) { await stockIn(d.id, v); render(); } },
  async addInv() { const qty = +$('#iq').value || 1, price = +$('#ip').value; if (!$('#ic').value.trim() || !price) return alert('Isi pelanggan dan harga.'); await addInvoice({ no: `INV-${new Date().getFullYear()}-${String(S.inv.length + 1).padStart(5, '0')}`, customer: $('#ic').value.trim(), item: $('#ii').value.trim() || 'Jasa', qty, price, total: qty * price, due: $('#id').value || '-', status: 'UNPAID' }); render(); },
  viewInv(d) { const i = S.inv.find(x => x.id == d.id); modal(`<h2>${esc(i.no)}</h2><pre>${esc(invText(i))}</pre><button class="btn" data-a="waInv" data-id="${i.id}">Kirim WhatsApp</button>${i.status != 'PAID' ? `<button class="btn g" data-a="paid" data-id="${i.id}">Tandai lunas</button>` : ''}<button class="btn g" onclick="print()">Cetak / simpan PDF</button><button class="btn g" data-a="close">Tutup</button>`); },
  waInv: d => wa(invText(S.inv.find(i => i.id == d.id))), async paid(d) { await setInvStatus(d.id, 'PAID'); close(); render(); },
  async addExp() { if (!+$('#ea').value) return alert('Isi nominal.'); await addExpense({ cat: $('#ek').value, note: $('#en').value.trim(), amount: +$('#ea').value }); render(); },
  async ask(d) {
    const s = d.s || $('#aq').value.trim(); if (!s) return; const o = $('#ao'); o.hidden = false; o.textContent = 'Menganalisis…';
    try { o.textContent = (await api('/api/gemini', { question: s, summary: summary() })).answer; } catch (e) { o.textContent = 'AI gagal: ' + e.message; }
  },
  async saveSet() { if (!$('#sn').value.trim()) return alert('Nama usaha wajib diisi.'); await saveBiz({ name: $('#sn').value.trim(), addr: $('#sa').value.trim(), wa: $('#sw').value.trim(), footer: $('#sf').value.trim() }); render(); },
  async logo() {
    const f = $('#lf').files[0]; if (!f) return alert('Pilih gambar dulu.');
    try {
      const s = await api('/api/cloudinary-sign'), fd = new FormData();
      fd.append('file', f); fd.append('api_key', s.apiKey); fd.append('timestamp', s.timestamp); fd.append('signature', s.signature); fd.append('folder', s.folder);
      const r = await (await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: 'POST', body: fd })).json();
      if (!r.secure_url) throw new Error(r.error?.message || 'Upload gagal');
      await saveBiz({ logo: r.secure_url }); render();
    } catch (e) { alert('Gagal unggah: ' + e.message); }
  }
};
