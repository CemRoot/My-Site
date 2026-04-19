document.addEventListener('DOMContentLoaded', () => {
  const tocLinks = document.querySelectorAll('.toc a');
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver(entries => {
    const intersecting = entries.filter(e => e.isIntersecting);
    if (intersecting.length === 0) return;

    // When several sections overlap the observer root, the topmost in the viewport
    // (smallest boundingClientRect.top) is the current reading position.
    intersecting.sort(
      (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
    );
    const top = intersecting[0];
    const id = top.target.id;
    const active = document.querySelector('.toc a[href="#' + id + '"]');
    if (!active) return;

    tocLinks.forEach(a => a.classList.remove('active'));
    active.classList.add('active');
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => observer.observe(s));
});
