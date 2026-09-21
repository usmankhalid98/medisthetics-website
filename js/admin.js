/* Admin: title / image / price management.
   Two modes (chosen automatically):
   - CLOUD (js/supabase-config.js filled in): email+password login, stock +
     photos live in the Supabase database for every visitor.
   - LOCAL (not configured): demo password `admin123`, per-browser storage. */
(function () {
  const DEMO_PASSWORD = 'admin123'; // local demo mode only
  const SESSION = 'medisthetics_admin_ok';
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop';

  const cloud = () => window.MediStore.cloudOn();

  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const logoutBtn = document.getElementById('logout');
  const loginHint = document.getElementById('login-hint');
  const emailRow = document.getElementById('email-row');

  let products = window.MediStore.load();
  let editingId = null;
  let existingImage = '';

  function isAuthed() {
    if (cloud()) return !!window.MediSupa.getSession();
    return sessionStorage.getItem(SESSION) === '1';
  }

  async function show() {
    const ok = isAuthed();
    loginView.classList.toggle('hidden', ok);
    adminView.classList.toggle('hidden', !ok);
    logoutBtn.classList.toggle('hidden', !ok);
    if (ok) {
      if (cloud()) {
        try {
          products = await window.MediStore.refresh();
        } catch { products = window.MediStore.load(); }
      }
      renderList();
    }
  }

  // Login UI adapts to the backend in use.
  if (cloud()) {
    emailRow.classList.remove('hidden');
    document.getElementById('email').required = true;
    loginHint.innerHTML = 'Signed-in admins only. Create your login in Supabase → Authentication → Users, then sign in here. Stock saves to the shared database.';
    document.querySelector('#login-form button[type="submit"]').textContent = 'Sign in';
  } else {
    loginHint.innerHTML = 'Demo password: <code>admin123</code> — change <code>DEMO_PASSWORD</code> in <code>js/admin.js</code>. Add a cloud backend later (see README) to share stock across devices.';
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('login-note');
    note.textContent = '';
    if (cloud()) {
      const email = document.getElementById('email').value.trim();
      const pw = document.getElementById('password').value;
      try {
        note.textContent = 'Signing in…';
        await window.MediSupa.signIn(email, pw);
        document.getElementById('password').value = '';
        show();
      } catch (err) {
        note.textContent = err.message || 'Login failed.';
      }
      return;
    }
    if (document.getElementById('password').value === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION, '1');
      show();
    } else {
      note.textContent = 'Incorrect password (hint: admin123).';
    }
  });

  logoutBtn.addEventListener('click', () => {
    if (cloud()) window.MediSupa.signOut();
    sessionStorage.removeItem(SESSION);
    show();
  });

  // Image preview (file stays local until save; upload happens on save).
  const fileInput = document.getElementById('f-file');
  const urlInput = document.getElementById('f-imageUrl');
  const preview = document.getElementById('f-preview');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    preview.src = URL.createObjectURL(f);
  });
  urlInput.addEventListener('input', () => {
    if (!fileInput.files[0] && urlInput.value.trim()) preview.src = urlInput.value.trim();
  });

  // Save (add or update).
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('form-note');
    const title = document.getElementById('f-title').value.trim();
    const price = Number(document.getElementById('f-price').value);
    const badge = document.getElementById('f-badge').value.trim();
    const desc = document.getElementById('f-desc').value.trim();
    if (!title || Number.isNaN(price)) {
      note.textContent = 'Title and valid price are required.';
      return;
    }

    // Resolve the image: fresh upload > pasted URL > existing > fallback.
    let image = urlInput.value.trim() || existingImage || FALLBACK_IMG;
    const file = fileInput.files[0];
    if (file) {
      if (cloud()) {
        try {
          note.textContent = 'Uploading image…';
          image = await window.MediSupa.uploadImage(file);
        } catch (err) {
          note.textContent = err.message || 'Image upload failed.';
          return;
        }
      } else {
        image = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => reject(new Error('Could not read image file.'));
          r.readAsDataURL(file);
        }).catch((err) => { note.textContent = err.message; return null; });
        if (!image) return;
      }
    }

    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    try {
      if (cloud()) {
        const occupied = products.map((p) => Number(p.position) || 0);
        const position = editingId
          ? Math.max(0, products.findIndex((p) => String(p.id) === String(editingId)))
          : Math.min(0, ...occupied) - 1; // newest first
        const payload = { title, price, badge, desc, image };
        if (editingId) payload.id = editingId; else payload._new = true;
        try {
          const res = await window.MediStore.saveCloud(payload, position);
          products = res.items;
          note.textContent = 'Saved ✓ — live for every visitor now.';
        } catch (err) {
          // Keep the work locally so nothing is lost.
          if (editingId) {
            products = products.map((p) => String(p.id) === String(editingId) ? { ...p, title, price, badge, desc, image } : p);
          } else {
            products.unshift({ id: window.MediStore.uid(), title, price, badge, desc, image });
          }
          window.MediStore.save(products);
          note.textContent = (err.message || 'Cloud save failed.') + ' Kept in this browser only.';
        }
      } else {
        if (editingId) {
          products = products.map((p) => String(p.id) === String(editingId) ? { ...p, title, price, badge, desc, image } : p);
          note.textContent = 'Updated ✓ — live in this browser now.';
        } else {
          products.unshift({ id: window.MediStore.uid(), title, price, badge, desc, image });
          note.textContent = 'Added ✓ — live in this browser now.';
        }
        window.MediStore.save(products);
      }
      clearForm();
      renderList();
    } finally {
      saveBtn.disabled = false;
    }
  });

  function clearForm() {
    editingId = null;
    existingImage = '';
    document.getElementById('product-form').reset();
    preview.src = '';
    document.getElementById('form-title').textContent = 'Add machine';
    document.getElementById('save-btn').textContent = 'Add machine';
  }
  document.getElementById('reset-btn').addEventListener('click', () => { clearForm(); document.getElementById('form-note').textContent = ''; });

  function renderList() {
    const q = (document.getElementById('admin-search').value || '').toLowerCase();
    const list = document.getElementById('admin-list');
    document.getElementById('count').textContent = products.length;
    document.getElementById('cloud-note').textContent = cloud()
      ? 'SHARED DATABASE — CHANGES ARE PUBLIC INSTANTLY'
      : 'LOCAL DEMO — VISIBLE IN THIS BROWSER ONLY';
    list.innerHTML = '';
    products.filter((p) => !q || (p.title + ' ' + (p.desc || '')).toLowerCase().includes(q)).forEach((p) => {
      const el = document.createElement('div');
      el.className = 'admin-item';
      el.innerHTML = `
        <img src="${escapeHtml(p.image)}" onerror="this.src='${FALLBACK_IMG}'" alt="" />
        <div><strong>${escapeHtml(p.title)}</strong><span>${window.MediStore.gbp(p.price)} ${p.badge ? '• ' + escapeHtml(p.badge) : ''}</span></div>
        <div class="actions"><button class="btn-edit" data-edit="${escapeHtml(p.id)}">Edit</button><button class="btn-danger" data-del="${escapeHtml(p.id)}">Delete</button></div>`;
      list.appendChild(el);
    });
  }
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  document.getElementById('admin-list').addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (ed) {
      const p = products.find((x) => String(x.id) === String(ed.dataset.edit));
      if (!p) return;
      editingId = p.id;
      existingImage = p.image || '';
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
      const id = del.dataset.del;
      if (cloud()) {
        try {
          const res = await window.MediStore.deleteCloud(id);
          products = res.items;
          document.getElementById('form-note').textContent = 'Deleted — removed for every visitor.';
        } catch (err) {
          document.getElementById('form-note').textContent = err.message || 'Delete failed.';
          return;
        }
      } else {
        products = products.filter((x) => String(x.id) !== String(id));
        window.MediStore.save(products);
      }
      if (editingId && String(editingId) === String(id)) clearForm();
      renderList();
    }
  });

  document.getElementById('admin-search').addEventListener('input', renderList);

  document.getElementById('restore').addEventListener('click', async () => {
    if (cloud()) {
      if (!confirm('Replace the shared database with the 7 default machines?')) return;
      try {
        document.getElementById('form-note').textContent = 'Restoring…';
        const existing = await window.MediSupa.listProducts();
        for (const p of existing) await window.MediSupa.deleteProduct(p.id);
        const defaults = window.MediStore.reset();
        for (let i = 0; i < defaults.length; i++) {
          const d = defaults[i];
          await window.MediSupa.saveProduct({ _new: true, title: d.title, price: d.price, badge: d.badge, desc: d.desc, image: d.image }, i);
        }
        products = await window.MediStore.refresh();
        clearForm();
        renderList();
        document.getElementById('form-note').textContent = 'Defaults restored.';
      } catch (err) {
        document.getElementById('form-note').textContent = err.message || 'Restore failed.';
      }
      return;
    }
    if (!confirm('Restore the 7 default machines? Your edits will be replaced.')) return;
    products = window.MediStore.reset();
    clearForm();
    renderList();
  });

  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'medisthetics-products.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  show();
})();
