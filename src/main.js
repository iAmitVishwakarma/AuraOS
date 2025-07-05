import AuraKernel from './kernel.js';
import './services/AuthService.js';
import './services/VFSService.js';
import './services/WindowManager.js';

// Initialize the OS
document.addEventListener('DOMContentLoaded', () => {
  const auraOS = new AuraKernel();
  auraOS.boot();
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === ' ') {
      auraOS.openSpotlight();
    }
  });
});