class ProductCard extends HTMLElement {
  connectedCallback() {
    this.variants = JSON.parse(this.querySelector('[data-variants]')?.textContent || '[]');
    this.variantInput = this.querySelector('[data-variant-id]');

    this.querySelectorAll('.product-card__dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector('.product-card__dropdown-trigger');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(dropdown);
      });

      dropdown.querySelectorAll('.product-card__dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectItem(dropdown, item);
        });
      });
    });

    this._onDocClick = (e) => {
      if (!this.contains(e.target)) this.closeAllDropdowns();
    };
    document.addEventListener('click', this._onDocClick);

    this.slides = this.querySelectorAll('.product-card__image-slide');
    this.currentSlide = 0;
    this.querySelectorAll('.product-card__img-arrow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeImage(btn.dataset.imgDir);
      });
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocClick);
  }

  toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('product-card__dropdown--open');
    this.closeAllDropdowns();
    if (!isOpen) dropdown.classList.add('product-card__dropdown--open');
  }

  closeAllDropdowns() {
    this.querySelectorAll('.product-card__dropdown--open').forEach(d => {
      d.classList.remove('product-card__dropdown--open');
    });
  }

  selectItem(dropdown, item) {
    dropdown.querySelectorAll('.product-card__dropdown-item--selected').forEach(el => {
      el.classList.remove('product-card__dropdown-item--selected');
    });
    item.classList.add('product-card__dropdown-item--selected');
    dropdown.querySelector('.product-card__dropdown-trigger span').textContent = item.dataset.value;
    dropdown.classList.remove('product-card__dropdown--open');
    this.updateVariant();
  }

  updateVariant() {
    const dropdowns = this.querySelectorAll('.product-card__dropdown');
    const selected = Array.from(dropdowns).map(d => {
      const item = d.querySelector('.product-card__dropdown-item--selected');
      return item ? item.dataset.value : '';
    });
    const match = this.variants.find(v =>
      v.options.every((opt, i) => opt === selected[i])
    );
    if (match && this.variantInput) {
      this.variantInput.value = match.id;
      const btn = this.querySelector('.product-card__add-to-cart');
      if (btn) {
        btn.disabled = !match.available;
        btn.textContent = match.available ? 'Add to cart' : 'Sold out';
      }
    }
  }

  changeImage(dir) {
    if (!this.slides.length) return;
    this.slides[this.currentSlide].classList.remove('product-card__image-slide--active');
    if (dir === 'next') {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    } else {
      this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    }
    this.slides[this.currentSlide].classList.add('product-card__image-slide--active');
  }
}

if (!customElements.get('product-card')) {
  customElements.define('product-card', ProductCard);
}
