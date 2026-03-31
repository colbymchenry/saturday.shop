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

    const form = this.querySelector('form[action*="/cart/add"]');
    const addBtn = form?.querySelector('.product-card__add-to-cart');
    if (form && addBtn) {
      // Change to type="button" so Slidecart doesn't intercept the form submit
      addBtn.type = 'button';
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.ajaxAddToCart(form, addBtn);
      });
    }
  }

  ajaxAddToCart(form, btn) {
    if (btn.disabled) return;

    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    fetch('/cart/add.js', {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(r => r.json())
      .then(data => {
        btn.textContent = 'Added!';

        // Update header cart badge
        fetch('/cart.js').then(r => r.json()).then(cart => {
          let badge = document.querySelector('.header__cart-count');
          if (!badge) {
            const cartLink = document.querySelector('a.header__icon[aria-label="Cart"]');
            if (cartLink) {
              badge = document.createElement('span');
              badge.className = 'header__cart-count';
              cartLink.prepend(badge);
            }
          }
          if (badge) badge.textContent = cart.item_count;
        });

        // Notify Slidecart — update first, then open after it refreshes
        if (typeof window.SLIDECART_UPDATE === 'function') window.SLIDECART_UPDATE();
        setTimeout(() => {
          if (typeof window.SLIDECART_OPEN === 'function') window.SLIDECART_OPEN();
        }, 300);

        setTimeout(() => {
          btn.textContent = origText;
          btn.disabled = false;
        }, 1500);
      })
      .catch(() => {
        btn.textContent = origText;
        btn.disabled = false;
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
      if (match.price != null) {
        const priceEl = this.querySelector('.product-card__current-price');
        if (priceEl) priceEl.textContent = this.formatMoney(match.price);
        const compareEl = this.querySelector('.product-card__compare-price');
        if (compareEl) {
          compareEl.style.display = match.compare_at_price > match.price ? '' : 'none';
          if (match.compare_at_price > match.price) {
            compareEl.textContent = this.formatMoney(match.compare_at_price);
          }
        }
      }
      if (match.image_id) {
        this.showImageById(match.image_id);
      }
      this.dispatchEvent(new CustomEvent('variant:change', {
        detail: { variantId: match.id, price: match.price },
        bubbles: true
      }));
    }
  }

  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  showImageById(imageId) {
    const target = Array.from(this.slides).findIndex(
      s => s.dataset.imageId === String(imageId)
    );
    if (target === -1 || target === this.currentSlide) return;
    this.slides[this.currentSlide].classList.remove('product-card__image-slide--active');
    this.currentSlide = target;
    this.slides[this.currentSlide].classList.add('product-card__image-slide--active');
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
