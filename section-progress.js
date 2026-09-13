const progressBar = document.querySelector('.section-progress i');

function updateProgress() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  progressBar.style.height = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
}

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
window.addEventListener('section:loaded', updateProgress);
updateProgress();
