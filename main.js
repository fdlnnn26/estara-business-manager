import { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, google } from './firebase-core.js';
import { loadAll, S } from './firebase-features.js';
import { pages, act, setRender } from './features.js';
const $ = s => document.querySelector(s);
const tabs = [['home', 'Beranda'], ['pos', 'Kasir'], ['prod', 'Produk'], ['inv', 'Invoice'], ['exp', 'Biaya'], ['rep', 'Laporan'], ['ai', 'AI'], ['set', 'Atur']];
let tab = 'home';
$('#nav').innerHTML = tabs.map(t => `<button data-a="go" data-t="${t[0]}">${t[1]}</button>`).join('');
function render() {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.t == tab));
  $('#shop').textContent = S.biz.name || '';
  $('#m').innerHTML = S.biz.name ? pages[tab]() : pages.set();
}
setRender(render);
act.go = d => { tab = d.t; render(); };
const cred = () => [$('#em').value.trim(), $('#pw').value];
const guard = fn => async () => { try { await fn(); } catch (e) { $('#err').textContent = e.message.replace('Firebase: ', ''); } };
act.login = guard(() => signInWithEmailAndPassword(auth, ...cred()));
act.register = guard(() => createUserWithEmailAndPassword(auth, ...cred()));
act.google = guard(() => google());
act.logout = () => signOut(auth);
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && act[b.dataset.a]) act[b.dataset.a](b.dataset, b); });
document.addEventListener('input', e => { if (e.target.id == 'q') act.search(e.target.value); });
onAuthStateChanged(auth, async u => {
  $('#auth').hidden = !!u; $('#app').hidden = !u;
  if (u) { try { await loadAll(); } catch (e) { alert('Gagal memuat data: ' + e.message); } tab = 'home'; render(); }
});
