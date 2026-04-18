window.addEventListener('DOMContentLoaded', () => {
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const navLinks = document.querySelectorAll('.main-nav .nav-menu a[href], .top-nav .nav-links a[href]');

  const getFilename = (href) => {
    const file = (href || '').split('?')[0].split('#')[0].split('/').pop();
    return (file || 'index.html').toLowerCase();
  };

  navLinks.forEach((link) => {
    const baseHref = link.dataset.baseHref || link.getAttribute('href') || '';
    if (!baseHref) return;

    link.dataset.baseHref = baseHref;

    const targetPage = getFilename(baseHref);
    const isActive = targetPage === currentPage || (currentPage === 'index.html' && targetPage === '');
    link.classList.toggle('active', isActive);
  });

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
      mobileMenuToggle.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.main-nav')) {
        navMenu.classList.remove('mobile-open');
        mobileMenuToggle.classList.remove('active');
      }
    });
  }
});
