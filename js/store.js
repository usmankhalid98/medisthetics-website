/* Product store — localStorage cache + optional Supabase cloud backend.
   - Works with NO configuration: behaves exactly like before (local demo data).
   - With js/supabase-config.js filled in: shop pages pull live stock from the
     cloud database; admin writes go to the cloud and every visitor sees them.
   Sync API (load/save) stays synchronous so pages render instantly; cloud
   methods are async and fall back to the local cache on any failure. */
(function () {
  const STORE_KEY = 'medisthetics_products_v1';

  const DEFAULT_PRODUCTS = [
    {
      id: 'excelight',
      title: 'Lynton Lasers Excelight',
      price: 15000,
      badge: 'Refurbished',
      desc: 'IPL system, MK2 2021–present style. Fully serviced, consumables replaced, touched up. 3-mo parts warranty.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2023/08/359752396_1348862642333833_5605400565994651627_n.jpg'
    },
    {
      id: 'initia',
      title: 'Lynton Lasers Initia Diode',
      price: 24500,
      badge: 'Refurbished',
      desc: 'Diode laser for hair removal. Manufacturer-standard refurb, full service before delivery.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2023/08/360036607_1311013256158118_4040038408890133275_n.jpg'
    },
    {
      id: 'luminette-q',
      title: 'Lynton Lasers Luminette Q',
      price: 8000,
      badge: 'Refurbished',
      desc: 'Q-switch system ideal for tattoo removal & pigmentation. Serviced + calibrated.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2023/08/LUMINETTE-Q.png'
    },
    {
      id: 'luminette-adv',
      title: 'Lynton Lasers Luminette Advance',
      price: 6000,
      badge: 'Refurbished',
      desc: 'Compact workhorse. Consumables replaced in machine + handpiece.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2023/08/360044391_654632126548283_4934307316790470406_n.jpg'
    },
    {
      id: 'cryo5',
      title: 'Zimmer Cryo 5 Cooler',
      price: 2500,
      badge: 'Refurbished',
      desc: 'Cold-air cooling for laser comfort. Tested, serviced, delivery included.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2023/08/363885656_274215708560216_2065974859361690547_n.jpg'
    },
    {
      id: 'lumina',
      title: 'Lynton Lasers Lumina IPL & Tattoo Removal',
      price: 18000,
      badge: 'Refurbished',
      desc: 'Dual IPL + Nd:YAG platform. Full refurb to maker standard.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2024/04/Lumina-Side-Image.jpg'
    },
    {
      id: 'deka',
      title: 'Deka Motus AY',
      price: 53000,
      badge: 'Premium',
      desc: 'Alexandrite + Nd:YAG with Moveo technology. Premium refurbished system.',
      image: 'https://medisthetics.co.uk/wp-content/uploads/2024/04/Deka-motus-ay.png'
    }
  ];

  function cloudOn() {
    return window.MediSupa && window.MediSupa.configured();
  }

  const Store = {
    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) {
          localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
          return [...DEFAULT_PRODUCTS];
        }
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('bad data');
        return data;
      } catch {
        return [...DEFAULT_PRODUCTS];
      }
    },
    save(items) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch { /* storage full — ignore */ }
    },
    reset() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_PRODUCTS)); } catch { /* ignore */ }
      return [...DEFAULT_PRODUCTS];
    },
    gbp(n) {
      const v = Number(n);
      if (Number.isNaN(v)) return '£—';
      return '£' + v.toLocaleString('en-GB');
    },
    uid() {
      return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },
    cloudOn,
    /* Pull latest stock from the cloud into the local cache. Resolves to the
       items to display (cloud list, or local cache when offline/unconfigured). */
    async refresh() {
      if (!cloudOn()) return this.load();
      try {
        const items = await window.MediSupa.listProducts();
        this.save(items);
        return items;
      } catch {
        return this.load();
      }
    },
    /* Save one product to the cloud (position = its index in the list).
       Returns { ok, items } — items always reflects what to display. */
    async saveCloud(product, position) {
      const items = await window.MediSupa.saveProduct(product, position);
      const fresh = await window.MediSupa.listProducts();
      this.save(fresh);
      return { ok: true, items: fresh, saved: items };
    },
    async deleteCloud(id) {
      await window.MediSupa.deleteProduct(id);
      const fresh = await window.MediSupa.listProducts();
      this.save(fresh);
      return { ok: true, items: fresh };
    }
  };
  window.MediStore = Store;
})();
