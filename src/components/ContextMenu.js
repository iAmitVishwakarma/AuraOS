export default class ContextMenu {
  constructor(os, items) {
    this.os = os;
    this.items = items;
    this.element = document.createElement('div');
    this.element.className = 'context-menu absolute bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1 min-w-40';
    this.render();
  }
  
  render() {
    this.element.innerHTML = '';
    
    this.items.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.className = 'border-t border-gray-700 my-1';
        this.element.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'px-4 py-2 text-white hover:bg-gray-700 cursor-pointer flex items-center';
        menuItem.innerHTML = item.label;
        
        menuItem.addEventListener('click', () => {
          item.action();
          this.hide();
        });
        
        this.element.appendChild(menuItem);
      }
    });
  }
  
  show(x, y) {
    // Hide any existing context menus
    document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
    
    document.getElementById('app').appendChild(this.element);
    
    // Position the menu
    const rect = this.element.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (x + rect.width > windowWidth) {
      adjustedX = windowWidth - rect.width - 5;
    }
    
    if (y + rect.height > windowHeight) {
      adjustedY = windowHeight - rect.height - 5;
    }
    
    this.element.style.left = `${adjustedX}px`;
    this.element.style.top = `${adjustedY}px`;
    
    // Hide when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
  }
  
  hide() {
    this.element.remove();
  }
  
  handleOutsideClick(e) {
    if (!this.element.contains(e.target)) {
      this.hide();
    }
  }
}