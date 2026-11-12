(function () {
  const canvas = document.getElementById('pdfCanvas');
  if (!canvas) return;

  const script = document.createElement('script');
  script.src = 'vendor/pdf.min.js';
  script.onload = () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
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
})();
