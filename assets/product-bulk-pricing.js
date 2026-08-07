// Sets the real quantity input when a bulk-pricing tile is clicked, so
// "In den Warenkorb" actually adds that quantity. Tiers themselves are
// fetched live from the real discount-tiers API (confirmed backed by
// a matching Shopify automatic discount at checkout, not just a
// theme-side display) — this file never hardcodes tier numbers, so it
// can't drift out of sync with the real backend.
//
// Requires that API to send Access-Control-Allow-Origin for this
// storefront's domain. Without it the browser blocks the response
// before JS ever sees it (curl/server-to-server calls aren't subject
// to CORS, which is why this can look fine outside a browser but still
// fail here) — confirmed missing as of this writing. When that's
// missing, or the request otherwise fails, this fails silently and
// just leaves the base "1 Stück" tile that's already rendered
// server-side, rather than showing an error or stale numbers.
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
        this.tiles.forEach((tile) => this.wireTile(tile));
        this.updateProgress(this.tiles[0]);

        if (this.dataset.apiUrl) this.loadTiers();
      }

      async loadTiers() {
        let tiers;
        try {
          const response = await fetch(this.dataset.apiUrl, { headers: { Accept: 'application/json' } });
          if (!response.ok) return;
          tiers = await response.json();
        } catch (error) {
          // Network error or CORS block — leave the base tile as-is.
          return;
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

        this.wireTile(tile);
        this.tiles.push(tile);
        this.grid.appendChild(tile);

        const selected = this.tiles.find((t) => t.classList.contains('is-selected'));
        this.updateProgress(selected);
      }

      wireTile(tile) {
        tile.addEventListener('click', () => this.selectTile(tile));
      }

      selectTile(tile) {
        this.tiles.forEach((t) => t.classList.remove('is-selected'));
        tile.classList.add('is-selected');
        this.updateProgress(tile);
        if (!this.input) return;
        this.input.value = tile.dataset.quantity;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      updateProgress(tile) {
        if (!tile) return;
        if (this.selectedQtyEl) this.selectedQtyEl.textContent = tile.dataset.quantity;
        if (!this.progressFill) return;
        const index = this.tiles.indexOf(tile);
        const ratio = (index + 1) / this.tiles.length;
        this.progressFill.style.width = `${ratio * 100}%`;
      }
    }
  );
}
