import ContextMenu from './ContextMenu.js';

/**
 * Represents a single icon on the desktop.
 */
export default class DesktopIcon {
  constructor(os, name, item, path) {
    this.os = os;
    this.name = name;
    this.item = item;
    this.path = path;
    this.element = document.createElement('div');
    this.element.className = 'desktop-icon absolute w-24 flex flex-col items-center p-2 rounded hover:bg-black/20 cursor-pointer select-none';
    
    this.render();
    this.addEventListeners();
    this.makeDraggable();
  }
  
  render() {
    this.element.innerHTML = `
      <img src="${this.getItemIcon()}" class="w-12 h-12">
      <span class="text-white text-xs text-center mt-2 truncate w-full shadow-lg">${this.name}</span>
    `;
  }
  
  getItemIcon() {
    // ... icon logic remains the same
    if (this.item.type === 'dir') return '/assets/icons/folder.png';
    return '/assets/icons/file.png';
  }

  addEventListeners() {
    this.element.addEventListener('dblclick', () => this.openItem());
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
  }

  makeDraggable() {
      Draggable.create(this.element, {
          bounds: "#desktopIcons",
          onDragEnd: () => this.savePosition(),
      });
  }

  savePosition() {
      // Save logic remains similar
  }
  
  openItem() {
    if (this.item.type === 'dir' || this.item.type === 'shortcut') {
      const targetPath = this.item.type === 'shortcut' ? this.item.target : this.path;
      this.os.launchApp('explorer', { path: targetPath });
    } else {
      // Open with default app based on file type
      this.os.launchApp('notepad', { file: this.path });
    }
  }

  showContextMenu(x, y) {
    const contextMenu = new ContextMenu(this.os, [
      { label: 'Open', action: () => this.openItem() },
      { label: 'Rename', action: () => this.rename() },
      { type: 'separator' },
      { label: 'Delete', action: () => this.delete() },
    ]);
    contextMenu.show(x, y);
  }

  rename() {
      const newName = prompt('Enter new name:', this.name);
      if (newName && newName !== this.name) {
          if (this.os.services.vfs.rename(this.path, newName)) {
              // Refresh desktop to reflect change
              this.os.loadDesktopIcons();
          } else {
              alert('Error renaming file.');
          }
      }
  }

  delete() {
      if (confirm(`Are you sure you want to delete "${this.name}"?`)) {
          if (this.os.services.vfs.delete(this.path)) {
              this.element.remove();
          } else {
              alert('Error deleting file.');
          }
      }
  }
}