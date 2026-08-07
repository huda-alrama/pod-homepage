// Purely informational display of the real bulk-discount tiers — tiles
// are disabled (not clickable), the highlighted tile just reflects
// whatever quantity is currently set in the native Quantity stepper
// above. Tiers are fetched live from the real discount-tiers API
// (confirmed backed by a matching Shopify automatic discount at
// checkout, not just a theme-side display) whenever that succeeds.
//
// TEMPORARY: that API currently has no Access-Control-Allow-Origin
// header for this storefront's origin, so the browser blocks the
// response before JS ever sees it (curl/server-to-server calls aren't
// subject to CORS, which is why this can look fine outside a browser
// but still fail here). FALLBACK_TIERS below is a stopgap so the grid
// still displays the intended mockup tiers while that's unresolved —
// it's only ever used when the live fetch fails or errors, so it's
// self-removing: once the CORS header + the remaining tiers are added
// on the backend, real data wins automatically and this constant
// becomes dead code (safe to delete then, no theme change needed).
const FALLBACK_TIERS = [
  { minQuantity: 5, discountPercent: 10 },
  { minQuantity: 15, discountPercent: 20 },
  { minQuantity: 30, discountPercent: 35 },
  { minQuantity: 100, discountPercent: 50 },
  { minQuantity: 500, discountPercent: 60 },
];

if (!customElements.get('product-bulk-pricing')) {
  customElements.define(
    'product-bulk-pricing',
    class ProductBulkPricing extends HTMLElement {
      connectedCallback() {
        this.input = document.getElementById(this.dataset.quantityInputId);
        this.grid = this.querySelector('.product__bulk-pricing-grid');
        this.selectedQtyEl = this.querySelector('.product__bulk-pricing-selected-qty');
        this.progressFill = this.querySelector('.product__bulk-pricing-progress-fill');
        this.tiles = Array.from(this.querySelectorAll('.product__bulk-pricing-tile'));
        this.tiles.forEach((tile) => this.disableTile(tile));
        this.syncFromInput();

        if (this.input) {
          this.input.addEventListener('change', () => this.syncFromInput());
          this.input.addEventListener('input', () => this.syncFromInput());
        }

        if (this.dataset.apiUrl) this.loadTiers();
      }

      async loadTiers() {
        let tiers;
        try {
          const response = await fetch(this.dataset.apiUrl, { headers: { Accept: 'application/json' } });
          if (!response.ok) {
            tiers = FALLBACK_TIERS;
          } else {
            tiers = await response.json();
          }
        } catch (error) {
          // Network error or CORS block — use the fallback tiers instead
          // of leaving just the base tile (see FALLBACK_TIERS comment).
          tiers = FALLBACK_TIERS;
        }

        if (!Array.isArray(tiers)) return;

        tiers
          .slice()
          .sort((a, b) => a.minQuantity - b.minQuantity)
          .forEach((tier) => this.addTile(tier));
      }

      addTile(tier) {
        if (!tier || !tier.minQuantity || !tier.discountPercent) return;

        const label = (this.dataset.tierLabelTemplate || '{qty}+').replace('{qty}', tier.minQuantity);
        const discountLabel = (this.dataset.tierDiscountTemplate || 'Spare {percent}%').replace(
          '{percent}',
          tier.discountPercent
        );

        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'product__bulk-pricing-tile';
        tile.dataset.quantity = tier.minQuantity;

        const qtySpan = document.createElement('span');
        qtySpan.className = 'product__bulk-pricing-qty';
        qtySpan.textContent = label;
        tile.appendChild(qtySpan);

        const discountSpan = document.createElement('span');
        discountSpan.className = 'product__bulk-pricing-discount';
        discountSpan.textContent = discountLabel;
        tile.appendChild(discountSpan);

        this.disableTile(tile);
        this.tiles.push(tile);
        this.grid.appendChild(tile);

        this.syncFromInput();
      }

      disableTile(tile) {
        tile.disabled = true;
        tile.tabIndex = -1;
      }

      // Highlights the tile matching the current real quantity (the
      // highest tier whose minQuantity is <= the quantity, falling back
      // to the base "1 Stück" tile) — display only, never writes back to
      // the input. Tiles are sorted ascending by data-quantity since
      // loadTiers() sorts before calling addTile().
      syncFromInput() {
        const qty = this.input ? parseInt(this.input.value, 10) || 1 : 1;
        let match = this.tiles[0];
        this.tiles.forEach((tile) => {
          if (Number(tile.dataset.quantity) <= qty) match = tile;
        });
        this.updateProgress(match);
      }

      updateProgress(tile) {
        if (!tile) return;
        this.tiles.forEach((t) => t.classList.toggle('is-selected', t === tile));
        if (this.selectedQtyEl) this.selectedQtyEl.textContent = this.input ? this.input.value : tile.dataset.quantity;
        if (!this.progressFill) return;
        const index = this.tiles.indexOf(tile);
        const ratio = (index + 1) / this.tiles.length;
        this.progressFill.style.width = `${ratio * 100}%`;
      }
    }
  );
}
