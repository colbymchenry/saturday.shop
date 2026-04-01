class ReviewCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.testimonials__track');
    this.cards = Array.from(this.querySelectorAll('.testimonial-card'));
    this.dotsContainer = this.querySelector('.testimonials__dots');
    this.totalCards = parseInt(this.dotsContainer.dataset.totalCards) || this.cards.length;
    this.currentPage = 0;
    this.autoplayInterval = null;
    this.isMobile = window.matchMedia('(max-width: 900px)');

    this.buildDots();
    this.bindDots();

    // Pause on hover (desktop)
    this.addEventListener('mouseenter', () => this.stopAutoplay());
    this.addEventListener('mouseleave', () => this.startAutoplay());

    // Swipe support (mobile)
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.track.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    this.track.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Rebuild dots and reset on breakpoint change
    this.isMobile.addEventListener('change', () => {
      this.buildDots();
      this.bindDots();
      this.goToPage(0);
      this.restartAutoplay();
    });

    this.goToPage(0);
    this.startAutoplay();
  }

  disconnectedCallback() {
    this.stopAutoplay();
  }

  get perPage() {
    return this.isMobile.matches ? 1 : 3;
  }

  buildDots() {
    var perPage = this.perPage;
    this.totalPages = Math.ceil(this.totalCards / perPage);
    this.dotsContainer.innerHTML = '';
    for (var i = 0; i < this.totalPages; i++) {
      var btn = document.createElement('button');
      btn.className = 'testimonials__dot' + (i === 0 ? ' testimonials__dot--active' : '');
      btn.dataset.page = i;
      btn.setAttribute('aria-label', 'Page ' + (i + 1));
      this.dotsContainer.appendChild(btn);
    }
    this.dots = this.dotsContainer.querySelectorAll('.testimonials__dot');
  }

  bindDots() {
    var self = this;
    this.dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        self.goToPage(parseInt(dot.dataset.page));
        self.restartAutoplay();
      });
    });
  }

  goToPage(page) {
    if (this.totalPages === 0) return;
    this.currentPage = ((page % this.totalPages) + this.totalPages) % this.totalPages;

    var perPage = this.perPage;
    var gap = this.isMobile.matches ? 0 : 20;
    var card = this.cards[0];
    if (!card) return;

    var cardWidth = card.offsetWidth + gap;
    var offset = this.currentPage * perPage * cardWidth;
    this.track.style.transform = 'translateX(-' + offset + 'px)';

    this.setActiveDot(this.currentPage);
    this.updateCenterCard();
  }

  updateCenterCard() {
    this.cards.forEach(function(c) { c.classList.remove('testimonial-card--center'); });
    if (this.isMobile.matches) return;

    var startIndex = this.currentPage * 3;
    var centerIndex = startIndex + 1;
    if (centerIndex < this.cards.length) {
      this.cards[centerIndex].classList.add('testimonial-card--center');
    }
  }

  setActiveDot(index) {
    this.dots.forEach(function(d, i) {
      d.classList.toggle('testimonials__dot--active', i === index);
    });
  }

  handleSwipe() {
    var diff = this.touchStartX - this.touchEndX;
    var threshold = 50;
    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      this.goToPage(this.currentPage + 1);
    } else {
      this.goToPage(this.currentPage - 1);
    }
    this.restartAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();
    var self = this;
    this.autoplayInterval = setInterval(function() {
      self.goToPage(self.currentPage + 1);
    }, 9000);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }
}

if (!customElements.get('review-carousel')) {
  customElements.define('review-carousel', ReviewCarousel);
}
