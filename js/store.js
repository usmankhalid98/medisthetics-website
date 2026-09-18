/* Shared product store — localStorage backed so Admin + Shop stay in sync */
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
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  },
  reset() {
    localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return [...DEFAULT_PRODUCTS];
  },
  gbp(n) {
    const v = Number(n);
    if (Number.isNaN(v)) return '£—';
    return '£' + v.toLocaleString('en-GB');
  },
  uid() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
};
window.MediStore = Store;
