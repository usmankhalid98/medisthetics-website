/* Admin: login + CRUD for title / image / price */
(function () {
  const ADMIN_PASSWORD = 'admin123'; // <-- change this
  const SESSION = 'medisthetics_admin_ok';

  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const logoutBtn = document.getElementById('logout');

  let products = window.MediStore.load();
  let editingId = null;
  let uploadedDataUrl = '';

  function isAuthed() { return sessionStorage.getItem(SESSION) === '1'; }
  function show() {
    const ok = isAuthed();
    loginView.classList.toggle('hidden', ok);
    adminView.classList.toggle('hidden', !ok);
    logoutBtn.classList.toggle('hidden', !ok);
    if (ok) renderList();
  }

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = document.getElementById('password').value;
    if (v === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION, '1');
      show();
    } else {
      document.getElementById('login-note').textContent = 'Incorrect password (hint: admin123).';
    }
  });
  logoutBtn.addEventListener('click', () => { sessionStorage.removeItem(SESSION); show(); });

  // image handling
  const fileInput = document.getElementById('f-file');
  const urlInput = document.getElementById('f-imageUrl');
  const preview = document.getElementById('f-preview');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { uploadedDataUrl = r.result; preview.src = uploadedDataUrl; };
    r.readAsDataURL(f);
  });
  urlInput.addEventListener('input', () => {
    if (!uploadedDataUrl) preview.src = urlInput.value;
  });

  // save
  document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('f-title').value.trim();
    const price = Number(document.getElementById('f-price').value);
    const badge = document.getElementById('f-badge').value.trim();
    const desc = document.getElementById('f-desc').value.trim();
    const image = uploadedDataUrl || urlInput.value.trim() || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop';
    if (!title || Number.isNaN(price)) {
      document.getElementById('form-note').textContent = 'Title and valid price are required.';
      return;
    }
    if (editingId) {
      products = products.map(p => p.id === editingId ? { ...p, title, price, badge, desc, image } : p);
      document.getElementById('form-note').textContent = 'Updated ✓ — live on the shop now.';
    } else {
      products.unshift({ id: window.MediStore.uid(), title, price, badge, desc, image });
      document.getElementById('form-note').textContent = 'Added ✓ — live on the shop now.';
    }
    window.MediStore.save(products);
    clearForm(); renderList();
  });

  function clearForm() {
    editingId = null; uploadedDataUrl = '';
    document.getElementById('product-form').reset();
    preview.src = '';
    document.getElementById('form-title').textContent = 'Add machine';
    document.getElementById('save-btn').textContent = 'Add machine';
  }
  document.getElementById('reset-btn').addEventListener('click', () => { clearForm(); document.getElementById('form-note').textContent=''; });

  function renderList() {
    const q = (document.getElementById('admin-search').value || '').toLowerCase();
    const list = document.getElementById('admin-list');
    document.getElementById('count').textContent = products.length;
    list.innerHTML = '';
    products.filter(p => !q || (p.title + ' ' + (p.desc||'')).toLowerCase().includes(q)).forEach(p => {
      const el = document.createElement('div');
      el.className = 'admin-item';
      el.innerHTML = `
        <img src="${p.image}" onerror="this.src='https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=200&auto=format&fit=crop'"/>
        <div><strong>${escapeHtml(p.title)}</strong><span>${window.MediStore.gbp(p.price)} ${p.badge ? '• ' + escapeHtml(p.badge) : ''}</span></div>
        <div class="actions"><button class="btn-edit" data-edit="${p.id}">Edit</button><button class="btn-danger" data-del="${p.id}">Delete</button></div>`;
      list.appendChild(el);
    });
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  document.getElementById('admin-list').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (ed) {
      const p = products.find(x => String(x.id) === String(ed.dataset.edit));
      if (!p) return;
      editingId = p.id; uploadedDataUrl = '';
      document.getElementById('f-title').value = p.title;
      document.getElementById('f-price').value = p.price;
      document.getElementById('f-badge').value = p.badge || '';
      document.getElementById('f-desc').value = p.desc || '';
      document.getElementById('f-imageUrl').value = (p.image || '').startsWith('data:') ? '' : (p.image || '');
      preview.src = p.image || '';
      document.getElementById('form-title').textContent = 'Edit machine';
      document.getElementById('save-btn').textContent = 'Save changes';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (del) {
      if (!confirm('Delete this machine?')) return;
      products = products.filter(x => String(x.id) !== String(del.dataset.del));
      window.MediStore.save(products); renderList();
    }
  });

  document.getElementById('admin-search').addEventListener('input', renderList);
  document.getElementById('restore').addEventListener('click', () => {
    if (!confirm('Restore the 7 default machines? Your edits will be replaced.')) return;
    products = window.MediStore.reset(); clearForm(); renderList();
  });
  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'medisthetics-products.json'; a.click();
  });

  show();
})();
