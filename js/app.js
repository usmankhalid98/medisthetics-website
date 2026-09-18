/* Landing page: nav + enquiry form (shop lives on shop.html) */
(function () {
  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const subject = encodeURIComponent(`Website enquiry: ${fd.get('subject') || fd.get('name') || 'Service visit'}`);
      const body = encodeURIComponent(`Name: ${fd.get('name') || ''}\nPhone: ${fd.get('phone') || ''}\nEmail: ${fd.get('email') || ''}\nModel + fault: ${fd.get('subject') || ''}\n\n${fd.get('message') || ''}`);
      const note = document.getElementById('form-note');
      if (note) note.innerHTML = 'OPENING YOUR EMAIL APP… OR CALL <a href="tel:+447458390786">07458 390786</a>';
      window.location.href = `mailto:service@medisthetics.co.uk?subject=${subject}&body=${body}`;
    });
  }

  // mobile nav
  const nav = document.getElementById('nav');
  const burger = document.getElementById('hamburger');
  if (nav && burger) {
    const setNav = (open) => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      burger.textContent = open ? '✕' : '☰';
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      setNav(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); burger.focus(); }
    });
  }
})();
