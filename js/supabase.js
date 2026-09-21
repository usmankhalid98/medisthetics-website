/* Tiny Supabase client — plain fetch, no dependencies.
   Covers: email/password admin auth, products REST, image uploads.
   Used by js/store.js. All methods reject on error; callers fall back. */
(function () {
  const SESSION_KEY = 'medisthetics_sb_session';
  const BUCKET = 'product-images';

  function cfg() {
    const c = window.MEDISUPABASE || {};
    return { url: (c.url || '').replace(/\/+$/, ''), anonKey: c.anonKey || '' };
  }

  function configured() {
    const c = cfg();
    return Boolean(c.url && c.anonKey);
  }

  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.access_token && s.expires_at && s.expires_at > Date.now() + 10000) return s;
      return s && s.refresh_token ? s : null; // expired but refreshable
    } catch { return null; }
  }

  function setSession(s) {
    if (!s) { sessionStorage.removeItem(SESSION_KEY); return; }
    s.expires_at = Date.now() + (s.expires_in || 3600) * 1000;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  async function authFetch(path, { method = 'GET', body, auth = false, prefer } = {}) {
    const c = cfg();
    const headers = { apikey: c.anonKey };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (prefer) headers.Prefer = prefer;
    let session = auth ? getSession() : null;
    if (auth && session) headers.Authorization = 'Bearer ' + session.access_token;

    const doFetch = () => fetch(c.url + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let res = await doFetch();
    if (res.status === 401 && auth && session && session.refresh_token) {
      // access token expired — refresh once and retry
      const r = await fetch(c.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: c.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      if (!r.ok) { setSession(null); throw new Error('Session expired — please log in again.'); }
      const fresh = await r.json();
      fresh.refresh_token = fresh.refresh_token || session.refresh_token;
      setSession(fresh);
      headers.Authorization = 'Bearer ' + fresh.access_token;
      res = await doFetch();
    }
    if (!res.ok) {
      let msg = 'Request failed (' + res.status + ')';
      try { const j = await res.json(); if (j.msg || j.message || j.error_description) msg = j.msg || j.message || j.error_description; } catch { /* keep default */ }
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  function toApp(row) {
    return {
      id: String(row.id),
      title: row.title || '',
      price: Number(row.price) || 0,
      badge: row.badge || 'Refurbished',
      desc: row.description || '',
      image: row.image_url || '',
      position: Number(row.position) || 0
    };
  }

  async function signIn(email, password) {
    const c = cfg();
    const res = await fetch(c.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: c.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed — check email and password.');
    const s = await res.json();
    setSession(s);
    return s.user || null;
  }

  function signOut() { setSession(null); }

  async function listProducts() {
    const rows = await authFetch('/rest/v1/products?select=*&order=position.asc&order=created_at.asc');
    return (rows || []).map(toApp);
  }

  function isUuid(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
  }

  // p: {id?, title, price, badge, desc, image, _new?}
  async function saveProduct(p, position) {
    const payload = {
      title: p.title,
      price: Number(p.price) || 0,
      badge: p.badge || 'Refurbished',
      description: p.desc || '',
      image_url: p.image || '',
      position: position == null ? 0 : position
    };
    if (p._new || !isUuid(p.id)) {
      // insert — local-only ids from the old demo data become real uuids
      const rows = await authFetch('/rest/v1/products', { method: 'POST', body: payload, auth: true, prefer: 'return=representation' });
      return toApp(rows[0]);
    }
    const rows = await authFetch('/rest/v1/products?id=eq.' + encodeURIComponent(p.id),
      { method: 'PATCH', body: payload, auth: true, prefer: 'return=representation' });
    return toApp(rows[0] || { ...payload, id: p.id });
  }

  async function deleteProduct(id) {
    await authFetch('/rest/v1/products?id=eq.' + encodeURIComponent(id), { method: 'DELETE', auth: true });
  }

  function shrinkImage(file, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width: w, height: h } = img;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const keepPng = (file.type || '').toLowerCase() === 'image/png';
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Could not process image.')),
          keepPng ? 'image/png' : 'image/jpeg',
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image file.')); };
      img.src = url;
    });
  }

  async function uploadImage(file) {
    const c = cfg();
    const session = getSession();
    if (!session) throw new Error('Please log in first.');
    const blob = await shrinkImage(file);
    const ext = blob.type === 'image/png' ? 'png' : (blob.type === 'image/webp' ? 'webp' : 'jpg');
    const name = 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const res = await fetch(c.url + '/storage/v1/object/' + BUCKET + '/' + name, {
      method: 'POST',
      headers: {
        apikey: c.anonKey,
        Authorization: 'Bearer ' + session.access_token,
        'Content-Type': blob.type,
        'x-upsert': 'true'
      },
      body: blob
    });
    if (!res.ok) throw new Error('Image upload failed (' + res.status + ').');
    return c.url + '/storage/v1/object/public/' + BUCKET + '/' + name;
  }

  window.MediSupa = {
    configured, signIn, signOut, getSession,
    listProducts, saveProduct, deleteProduct, uploadImage
  };
})();
