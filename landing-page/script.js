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

  /* ==========================================================================
     GA4 Custom Event Tracking (section_view & cta_click)
     ========================================================================== */
  if (!window.__gaTrackingInitialized) {
    window.__gaTrackingInitialized = true;

    // Safe GA4 event dispatch helper
    const sendGAEvent = (eventName, params) => {
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', eventName, params);
        } catch (err) {
          console.warn(`[GA4] Event dispatch failed (${eventName}):`, err);
        }
      }
    };

    // 1. Section View Tracking (IntersectionObserver with 50% visibility)
    const initSectionViewTracking = () => {
      const sectionTargets = [
        { selector: '#hero-title', name: 'hero' },
        { selector: '#detail-space-title', name: 'detail' },
        { selector: '#purchase-title', name: 'cta' }
      ];

      const sentSections = new Set();
      const siteHeader = document.querySelector('#site-header');
      const headerHeight = siteHeader ? Math.ceil(siteHeader.getBoundingClientRect().height) : 60;
      const rootMargin = `-${headerHeight}px 0px 0px 0px`;

      // Helper to check 50% visibility when document is visible
      const isElementInView = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const effectiveTop = headerHeight;
        const effectiveBottom = window.innerHeight || document.documentElement.clientHeight;
        const visibleTop = Math.max(rect.top, effectiveTop);
        const visibleBottom = Math.min(rect.bottom, effectiveBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        return rect.height > 0 && (visibleHeight / rect.height) >= 0.5;
      };

      const handleIntersect = (entries, observer) => {
        if (document.visibilityState !== 'visible') return;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const sectionName = entry.target.dataset.gaSectionName;
            if (sectionName && !sentSections.has(sectionName)) {
              sentSections.add(sectionName);
              sendGAEvent('section_view', { section_name: sectionName });
              observer.unobserve(entry.target);
            }
          }
        });
      };

      const sectionObserver = new IntersectionObserver(handleIntersect, {
        threshold: 0.5,
        rootMargin: rootMargin
      });

      const observedElements = [];

      sectionTargets.forEach(({ selector, name }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.dataset.gaSectionName = name;
          sectionObserver.observe(el);
          observedElements.push({ el, name });
        }
      });

      // Handle returning from another tab / background
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          observedElements.forEach(({ el, name }) => {
            if (!sentSections.has(name) && isElementInView(el)) {
              sentSections.add(name);
              sendGAEvent('section_view', { section_name: name });
              sectionObserver.unobserve(el);
            }
          });
        }
      });
    };

    // 2. CTA Click Tracking
    const initCtaClickTracking = () => {
      const ctaConfigs = [
        { selector: '#cta-hero, [data-cta-location="hero"]', location: 'hero' },
        { selector: '#cta-final, [data-cta-location="final"]', location: 'final' }
      ];

      const processedButtons = new Set();

      ctaConfigs.forEach(({ selector, location }) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((btn) => {
          if (!processedButtons.has(btn)) {
            processedButtons.add(btn);
            btn.addEventListener('click', () => {
              sendGAEvent('cta_click', { button_location: location });
            });
          }
        });
      });
    };

    initSectionViewTracking();
    initCtaClickTracking();
  }
});

