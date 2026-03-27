// ===== نيزك — MAIN JS =====

// Navigation and header logic moved to header.js

document.addEventListener('DOMContentLoaded', () => {

  // Arrow navigation for gallery / characters
  initArrowNav('.gallery-cards', '.card', '.arrow-prev', '.arrow-next', 6);
  initArrowNav('.characters-grid', '.char-card', '.char-prev', '.char-next', 3);
});

/**
 * Simple arrow pagination for card sections.
 * Shows `perPage` cards at a time.
 */
function initArrowNav(containerSel, cardSel, prevSel, nextSel, perPage) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  const prevBtn = document.querySelector(prevSel);
  const nextBtn = document.querySelector(nextSel);
  if (!prevBtn || !nextBtn) return;

  let page = 0;

  function render() {
    const cards = container.querySelectorAll(cardSel);
    const total = cards.length;
    const maxPage = Math.ceil(total / perPage) - 1;

    cards.forEach((card, i) => {
      card.style.display = (i >= page * perPage && i < (page + 1) * perPage)
        ? '' : 'none';
    });

    prevBtn.disabled = page <= 0;
    nextBtn.disabled = page >= maxPage;
    prevBtn.style.opacity = page <= 0 ? '0.4' : '1';
    nextBtn.style.opacity = page >= maxPage ? '0.4' : '1';
  }

  prevBtn.addEventListener('click', () => { if (page > 0) { page--; render(); } });
  nextBtn.addEventListener('click', () => {
    const total = container.querySelectorAll(cardSel).length;
    if ((page + 1) * perPage < total) { page++; render(); }
  });

  render();
}

// Subscribe form handler
const subscribeForm = document.getElementById('subscribe-form');
if (subscribeForm) {
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = subscribeForm.querySelector('.btn-cta');
    btn.querySelector('span').textContent = '✓ تم الاشتراك!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    setTimeout(() => {
      btn.querySelector('span').textContent = 'إشترك';
      btn.style.background = '';
    }, 3000);
  });
}
