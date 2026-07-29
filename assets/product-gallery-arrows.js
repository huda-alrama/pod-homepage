// Dawn's "thumbnail" gallery_layout hides every non-active media item
// via CSS and only switches the active image through MediaGallery's
// setActiveMedia(), which is wired to thumbnail button clicks — not to
// the slider's own prev/next arrows (those just scroll a container
// that, in this layout, has nothing visible left to scroll to). Rather
// than leave the arrows we re-enabled to look like spreadshirt.de's
// own PDP as dead buttons, this simulates a click on the next/previous
// thumbnail button, reusing that already-working code path exactly.
document.addEventListener('click', (event) => {
  const button = event.target.closest('.slider-button--prev, .slider-button--next');
  if (!button) return;

  const gallery = button.closest('media-gallery');
  if (!gallery || !gallery.dataset.desktopLayout || !gallery.dataset.desktopLayout.includes('thumbnail')) return;

  const thumbnailButtons = Array.from(gallery.querySelectorAll('[id^="GalleryThumbnails"] [data-target] button'));
  if (thumbnailButtons.length < 2) return;

  const activeIndex = thumbnailButtons.findIndex((el) => el.getAttribute('aria-current') === 'true');
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;
  const step = button.classList.contains('slider-button--next') ? 1 : -1;
  const nextIndex = (currentIndex + step + thumbnailButtons.length) % thumbnailButtons.length;

  thumbnailButtons[nextIndex].click();
});
