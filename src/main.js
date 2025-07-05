import AuraKernel from './kernel.js';

/**
 * Main entry point for AuraOS.
 * Initializes the kernel and sets up global event listeners when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  const auraOS = new AuraKernel();
  auraOS.boot();
  
  // Register global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Open Spotlight Search with Ctrl + Space
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      auraOS.openSpotlight();
    }
  });
});