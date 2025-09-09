// js/tooltip.js
// Simpele, toegankelijke tooltip-initialisatie voor .word[data-info] nodes.
// Laad met <script src="js/tooltip.js" defer></script>

(function () {
  function init() {
    const tooltipId = 'tooltip';
    let tooltip = document.getElementById(tooltipId);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = tooltipId;
      tooltip.setAttribute('role', 'tooltip');
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltip);
    }

    let activeEl = null;
    const gap = 8;

    function showFor(el) {
      const info = el.dataset.info || '';
      if (!info) return;
      tooltip.textContent = info;
      tooltip.setAttribute('data-visible', 'true');
      tooltip.setAttribute('aria-hidden', 'false');
      el.setAttribute('aria-describedby', tooltip.id);
      activeEl = el;
      positionTooltip(el);
    }

    function hide() {
      if (!activeEl) return;
      activeEl.removeAttribute('aria-describedby');
      activeEl = null;
      tooltip.setAttribute('data-visible', 'false');
      tooltip.setAttribute('aria-hidden', 'true');
    }

    function positionTooltip(el) {
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();

        let left = rect.left + rect.width / 2 - ttRect.width / 2;
        let top = rect.top - ttRect.height - gap;

        // if no room above, place below
        if (top < 6) top = rect.bottom + gap;

        const margin = 6;
        left = Math.min(Math.max(margin, left), window.innerWidth - ttRect.width - margin);
        top = Math.min(Math.max(margin, top), window.innerHeight - ttRect.height - margin);

        tooltip.style.left = Math.round(left) + 'px';
        tooltip.style.top = Math.round(top) + 'px';
      });
    }

    function addListeners(root = document) {
      root.querySelectorAll('.word[data-info]').forEach((el) => {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

        el.addEventListener('mouseenter', () => showFor(el));
        el.addEventListener('mouseleave', () => {
          if (document.activeElement !== el) hide();
        });
        el.addEventListener('focus', () => showFor(el));
        el.addEventListener('blur', () => hide());

        // touch-friendly: click toggles
        el.addEventListener('click', (e) => {
          if (activeEl === el) hide();
          else showFor(el);
          e.preventDefault();
        });
      });
    }

    addListeners();

    // global handlers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.word') && !tooltip.contains(e.target)) hide();
    });

    window.addEventListener(
      'scroll',
      () => { if (activeEl) positionTooltip(activeEl); },
      true
    );
    window.addEventListener('resize', () => { if (activeEl) positionTooltip(activeEl); });

    // Expose utility for dynamic content
    window.addLatinTooltipRefresh = addListeners;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
