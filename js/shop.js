/* Shop page: search + sort + tag filter + detail modal + contact form */
(function () {
  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('product-empty');
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const pills = document.getElementById('filter-pills');
  const count = document.getElementById('result-count');
  const clearSearch = document.getElementById('clear-search');
  const clearFilters = document.getElementById('clear-filters');
  const emptyReset = document.getElementById('empty-reset');

  const modal = document.getElementById('detail-modal');
  const modalClose = document.getElementById('detail-close');
  const dImage = document.getElementById('detail-image');
  const dBadge = document.getElementById('detail-badge');
  const dTitle = document.getElementById('detail-title');
  const dPrice = document.getElementById('detail-price');
  const dDesc = document.getElementById('detail-desc');
  const dNote = document.getElementById('detail-note');

  const FALLBACK = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop';

  let products = window.MediStore.load();
  let activeTag = 'All';
  let current = null;

  window.addEventListener('storage', (e) => {
    if (e.key === 'medisthetics_products_v1') {
      products = window.MediStore.load();
      renderPills();
      render();
    }
  });

  // Pre-fill search from ?q= or ?search=
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('search') || '';
    if (q && search) search.value = q;
    const tag = params.get('tag');
    if (tag) activeTag = tag;
  } catch { /* ignore */ }

  function tagCounts() {
    const map = new Map();
    products.forEach((p) => {
      const t = (p.badge || 'Refurbished').trim() || 'Refurbished';
      const key = t.toLowerCase();
      if (!map.has(key)) map.set(key, { label: t, n: 0 });
      map.get(key).n += 1;
    });
    return map;
  }

  function tags() {
    const counts = tagCounts();
    const sorted = [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
    return [{ label: 'All', n: products.length }, ...sorted];
  }

  function renderPills() {
    const list = tags();
    if (!list.some((t) => t.label === activeTag)) activeTag = 'All';
    pills.innerHTML = '';
    list.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pill' + (t.label === activeTag ? ' active' : '');
      b.textContent = `${t.label} (${t.n})`;
      b.setAttribute('aria-pressed', String(t.label === activeTag));
      b.addEventListener('click', () => { activeTag = t.label; renderPills(); render(); });
      pills.appendChild(b);
    });
  }

  function hasActiveFilters() {
    return ((search.value || '').trim() !== '') || activeTag !== 'All' || sort.value !== 'featured';
  }

  function filtered() {
    const q = (search.value || '').toLowerCase().trim();
    let list = products.filter((p) => {
      const matchesQ = !q || (p.title + ' ' + (p.desc || '') + ' ' + (p.badge || '')).toLowerCase().includes(q);
      const matchesT = activeTag === 'All' || ((p.badge || 'Refurbished').toLowerCase() === activeTag.toLowerCase());
      return matchesQ && matchesT;
    });
    const s = sort.value;
    if (s === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (s === 'high') list = [...list].sort((a, b) => b.price - a.price);
    if (s === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }

  function card(p) {
    const badge = (p.badge || 'Refurbished').trim() || 'Refurbished';
    const isPremium = badge.toLowerCase() === 'premium';
    const el = document.createElement('article');
    el.className = 'product';
    el.innerHTML = `
      <div class="product-img">
        <button class="img-btn" data-view="${p.id}" aria-label="View ${escapeHtml(p.title)}">
          <img loading="lazy" src="${escapeHtml(p.image || FALLBACK)}" alt="${escapeHtml(p.title)}" onerror="this.src='${FALLBACK}'"/>
        </button>
        <span class="product-badge${isPremium ? ' is-premium' : ''}">${escapeHtml(badge)}</span>
        <span class="product-warranty">✓ 3-mo warranty</span>
      </div>
      <div class="product-body">
        <p class="product-kicker mono">${escapeHtml(badge)} · SERVICED</p>
        <h3><button class="title-btn" data-view="${p.id}">${escapeHtml(p.title)}</button></h3>
        <p class="product-desc">${escapeHtml(p.desc || 'Refurbished to manufacturer standard. Contact us for full spec & service history.')}</p>
        <div class="product-foot">
          <div class="product-price-row">
            <div class="price">${window.MediStore.gbp(p.price)}<small>INCL. VAT + DELIVERY</small></div>
            <span class="price-note">IN STOCK</span>
          </div>
          <button class="btn-view" data-view="${p.id}">View details →</button>
        </div>
      </div>`;
    return el;
  }

  function render() {
    const list = filtered();
    grid.innerHTML = '';
    list.forEach((p) => grid.appendChild(card(p)));
    empty.classList.toggle('hidden', list.length > 0);
    grid.classList.toggle('hidden', list.length === 0);
    count.textContent = list.length === products.length
      ? `${list.length} IN STOCK`
      : `${list.length} OF ${products.length}`;
    if (clearSearch) clearSearch.classList.toggle('hidden', !(search.value || '').trim());
    if (clearFilters) clearFilters.classList.toggle('hidden', !hasActiveFilters());
  }

  function resetFilters() {
    search.value = '';
    sort.value = 'featured';
    activeTag = 'All';
    renderPills();
    render();
    search.focus();
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function openDetail(id) {
    current = products.find((p) => String(p.id) === String(id));
    if (!current) return;
    dImage.src = current.image || FALLBACK;
    dImage.alt = current.title;
    dImage.onerror = () => { dImage.src = FALLBACK; };
    dBadge.textContent = (current.badge || 'Refurbished').toUpperCase();
    dTitle.textContent = current.title;
    dPrice.textContent = window.MediStore.gbp(current.price) + ' incl. VAT & delivery';
    dDesc.textContent = current.desc || 'Refurbished to manufacturer standard. Contact us for full spec & service history.';
    dNote.textContent = '';
    document.getElementById('detail-form').reset();
    modal.classList.remove('hidden');
    modalClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    openDetail(btn.dataset.view);
  });
  modalClose.addEventListener('click', closeDetail);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeDetail(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeDetail();
  });

  document.getElementById('detail-form').addEventListener('submit', (e) => {
    e.preventDefault();
    dNote.textContent = 'Thanks — enquiry noted (demo). Please also call 07458 390786 or use the contact form below.';
    setTimeout(closeDetail, 1400);
  });

  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const subject = encodeURIComponent(`Website enquiry: ${fd.get('subject') || fd.get('name') || 'Service visit'}`);
      const body = encodeURIComponent(`Name: ${fd.get('name') || ''}\nPhone: ${fd.get('phone') || ''}\nEmail: ${fd.get('email') || ''}\nModel + fault: ${fd.get('subject') || ''}\n\n${fd.get('message') || ''}`);
      window.location.href = `mailto:service@medisthetics.co.uk?subject=${subject}&body=${body}`;
    });
  }

  search.addEventListener('input', render);
  sort.addEventListener('change', render);
  if (clearSearch) clearSearch.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  if (clearFilters) clearFilters.addEventListener('click', resetFilters);
  if (emptyReset) emptyReset.addEventListener('click', resetFilters);

  // mobile nav
  const nav = document.getElementById('nav');
  const burger = document.getElementById('hamburger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  });

  renderPills();
  render();
})();
