// Sets the real quantity input when a bulk-pricing tile is clicked, so
// "In den Warenkorb" actually adds that quantity. The discount % shown
// on each tile is an informational label only (see the block's schema
// paragraph) — it doesn't itself change the line-item price; that
// needs a real Shopify volume-pricing/quantity-break rule on the
// product if one is meant to apply.
if (!customElements.get('product-bulk-pricing')) {
  customElements.define(
    'product-bulk-pricing',
    class ProductBulkPricing extends HTMLElement {
      connectedCallback() {
        this.input = document.getElementById(this.dataset.quantityInputId);
        this.tiles = Array.from(this.querySelectorAll('.product__bulk-pricing-tile'));
        this.tiles.forEach((tile) => {
          tile.addEventListener('click', () => this.selectTile(tile));
        });
      }

      selectTile(tile) {
        this.tiles.forEach((t) => t.classList.remove('is-selected'));
        tile.classList.add('is-selected');
        if (!this.input) return;
        this.input.value = tile.dataset.quantity;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  );
}
