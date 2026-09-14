const sectionPage = document.querySelector('.section-page');
const sectionId = sectionPage.dataset.section;
const sectionMain = sectionPage.querySelector('main');

fetch('index.html', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`Could not load index.html: ${response.status}`);
    return response.text();
  })
  .then(markup => {
    const documentFragment = new DOMParser().parseFromString(markup, 'text/html');
    const sourceSection = documentFragment.getElementById(sectionId);
    if (!sourceSection) throw new Error(`Section not found: ${sectionId}`);

    if (sectionId === 'music') {
      const roomSection = documentFragment.getElementById('room');
      const gaugePost = sourceSection.querySelector('#gauge-post');
      const ampPost = roomSection?.querySelector('#amp-post');
      const stratPost = roomSection?.querySelector('#strat-post');
      if (ampPost && gaugePost) gaugePost.insertAdjacentElement('afterend', ampPost);
      if (stratPost && gaugePost) sourceSection.querySelector('.container').insertBefore(stratPost, gaugePost);
    } else if (sectionId === 'room') {
      sourceSection.querySelector('#strat-post')?.remove();
      sourceSection.querySelector('#amp-post')?.remove();
    }

    sectionMain.innerHTML = sourceSection.outerHTML;
    sectionPage.classList.add('section-loaded');
    initializePdfViewer();
    window.dispatchEvent(new Event('section:loaded'));
  })
  .catch(error => {
    sectionMain.innerHTML = '<div class="container"><p class="media-text">This section could not be loaded.</p></div>';
    sectionPage.classList.add('section-loaded');
    console.error(error);
  });

function initializePdfViewer() {
  const canvas = document.getElementById('pdfCanvas');
  if (!canvas) return;

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.onload = () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const context = canvas.getContext('2d');
    const previousButton = document.getElementById('pdfPrev');
    const nextButton = document.getElementById('pdfNext');
    const currentPage = document.getElementById('currentPage');
    const totalPages = document.getElementById('totalPages');
    let documentProxy;
    let pageNumber = 1;

    function renderPage(number) {
      documentProxy.getPage(number).then(page => {
        const viewport = page.getViewport({ scale: Math.min(window.innerWidth - 40, 760) / page.getViewport({ scale: 1 }).width });
        const outputScale = Math.min((window.devicePixelRatio || 1) * 1.5, 3);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        page.render({
          canvasContext: context,
          viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0]
        });
        currentPage.textContent = number;
        previousButton.disabled = number <= 1;
        nextButton.disabled = number >= documentProxy.numPages;
      });
    }

    previousButton.addEventListener('click', () => {
      if (pageNumber > 1) renderPage(--pageNumber);
    });
    nextButton.addEventListener('click', () => {
      if (pageNumber < documentProxy.numPages) renderPage(++pageNumber);
    });
    pdfjsLib.getDocument('cv_Q2-26.pdf').promise.then(documentValue => {
      documentProxy = documentValue;
      totalPages.textContent = documentProxy.numPages;
      renderPage(pageNumber);
    });
  };
  document.head.appendChild(script);
}
