document.addEventListener('DOMContentLoaded', () => {
  const toast = document.querySelector('#toast');
  let toastTimer;
  const showToast = () => {
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  document.querySelectorAll('.js-cta').forEach((button) => button.addEventListener('click', showToast));

  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth' }));
  });

  const header = document.querySelector('#site-header');
  const heroCta = document.querySelector('#cta-hero');
  const stickyBar = document.querySelector('#sticky-cta-bar');
  const closeSticky = document.querySelector('.sticky-close');
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  const headerObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  });
  headerObserver.observe(document.querySelector('#header-sentinel'));

  const stickyObserver = new IntersectionObserver(([entry]) => {
    if (!mobileQuery.matches || sessionStorage.getItem('sticky-cta-closed')) return;
    stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
  }, { threshold: 0.1 });
  stickyObserver.observe(heroCta);
  closeSticky.addEventListener('click', () => {
    sessionStorage.setItem('sticky-cta-closed', 'true');
    stickyBar.classList.remove('is-visible');
  });
  mobileQuery.addEventListener('change', () => stickyBar.classList.remove('is-visible'));

  document.querySelectorAll('.structure-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.structure-card').forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      });
      card.classList.add('is-active');
      card.setAttribute('aria-selected', 'true');
      const image = document.querySelector('#structure-image');
      const caption = document.querySelector('#structure-caption');
      image.style.opacity = '0';
      window.setTimeout(() => {
        image.src = card.dataset.image;
        image.alt = card.dataset.alt;
        if (caption && card.dataset.captionTitle) {
          caption.innerHTML = `<strong>${card.dataset.captionTitle}</strong><span>${card.dataset.captionDesc || ''}</span>`;
        }
        image.onload = () => { image.style.opacity = '1'; };
        // Fallback in case image is already cached
        if (image.complete) { image.style.opacity = '1'; }
      }, 160);
    });
  });

  document.querySelectorAll('[data-image-box] img').forEach((image) => {
    image.addEventListener('error', () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';
      placeholder.textContent = '이미지 준비 중';
      image.replaceWith(placeholder);
    }, { once: true });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
});
