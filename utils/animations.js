// utils/animations.js – Smooth transitions & skeleton helpers

export function fadeIn(el, duration = 200) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(8px)';
  el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });
}

export function animateCards(container) {
  const cards = container.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    card.style.transition = `opacity .25s ease ${i * 60}ms, transform .25s ease ${i * 60}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  });
}
