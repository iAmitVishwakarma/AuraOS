export default class DesktopIcon {
  constructor(os, name, item) {
    this.os = os;
    this.name = name;
    this.item = item;
    this.element = document.createElement('div');
    this.element.className = 'desktop-icon absolute w-20 flex flex-col items-center p-2 rounded hover:bg-gray-700 hover:bg-opacity-30 cursor-pointer select-none';
    this.element.style.left = `${Math.random() * 500}px`;
    this.element.style.top = `${Math.random() * 300}px`;
    
    this.render();
    this.addEventListeners();
  }
  
  render() {
    const icon = this.getItemIcon();
    this.element.innerHTML = `
      <img src="${icon}" class="w-10 h-10">
      <span class="text-white text-xs text-center mt-1 truncate w-full">${this.name}</span>
    `;
  }
  
  getItemIcon() {
    switch (this.item.type) {
      case 'dir':
        return '/assets/icons/folder.png';
      case 'file':
        return '/assets/icons/file.png';
      case 'shortcut':
        return '/assets/icons/shortcut.png';
      default:
        return '/assets/icons/default.png';
    }
  }
  
  addEventListeners() {
    // Single click (open)
    this.element.addEventListener('click', (e) => {
      if (e.detail === 1) {
        this.openItem();
      }
    });
    
    // Double click (open with more emphasis)
    this.element.addEventListener('dblclick', () => {
      this.openItem();
    });
    
    // Right click (context menu)
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
    
    // Make draggable
    this.makeDraggable();
  }
  
  openItem() {
    if (this.item.type === 'dir' || this.item.type === 'shortcut') {
      const targetPath = this.item.type === 'shortcut' ? this.item.target : `/Users/${this.os.currentUser}/Desktop/${this.name}`;
      this.os.launchApp('explorer', { path: targetPath });
    } else {
      // Open with default app based on file type
      const extension = this.name.split('.').pop().toLowerCase();
      switch (extension) {
        case 'txt':
          this.os.launchApp('notepad', { file: `/Users/${this.os.currentUser}/Desktop/${this.name}` });
          break;
        case 'mp3':
        case 'wav':
          this.os.launchApp('music', { file: `/Users/${this.os.currentUser}/Desktop/${this.name}` });
          break;
        default:
          this.os.launchApp('notepad', { file: `/Users/${this.os.currentUser}/Desktop/${this.name}` });
      }
    }
  }
  
  showContextMenu(x, y) {
    const contextMenu = new ContextMenu(this.os, [
      { label: 'Open', action: () => this.openItem() },
      { label: 'Rename', action: () => this.rename() },
      { label: 'Delete', action: () => this.delete() },
      { type: 'separator' },
      { label: 'Properties', action: () => this.showProperties() }
    ]);
    
    contextMenu.show(x, y);
  }
  
  makeDraggable() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    this.element.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };
    
    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      this.element.style.top = `${this.element.offsetTop - pos2}px`;
      this.element.style.left = `${this.element.offsetLeft - pos1}px`;
    };
    
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      this.savePosition();
    };
  }
  
  savePosition() {
    // Save position to localStorage
    const positions = JSON.parse(localStorage.getItem('desktopIconPositions')) || {};
    positions[this.name] = {
      x: this.element.offsetLeft,
      y: this.element.offsetTop
    };
    localStorage.setItem('desktopIconPositions', JSON.stringify(positions));
  }
  
  rename() {
    const oldName = this.name;
    const span = this.element.querySelector('span');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldName;
    input.className = 'w-full bg-transparent text-white text-center border-none outline-none';
    
    span.replaceWith(input);
    input.focus();
    input.select();
    
    const handleRename = () => {
      const newName = input.value.trim();
      if (newName && newName !== oldName) {
        // Rename in VFS
        if (this.os.services.vfs.rename(`/Users/${this.os.currentUser}/Desktop/${oldName}`, newName)) {
          this.name = newName;
          span.textContent = newName;
        }
      }
      input.replaceWith(span);
    };
    
    input.addEventListener('blur', handleRename);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleRename();
      } else if (e.key === 'Escape') {
        input.replaceWith(span);
      }
    });
  }
  
  delete() {
    if (confirm(`Are you sure you want to delete "${this.name}"?`)) {
      if (this.os.services.vfs.delete(`/Users/${this.os.currentUser}/Desktop/${this.name}`)) {
        this.element.remove();
      }
    }
  }
  
  showProperties() {
    this.os.services.window.createWindow({
      title: `${this.name} Properties`,
      width: 400,
      height: 300,
      content: `
        <div class="p-4">
          <div class="flex items-center space-x-4 mb-4">
            <img src="${this.getItemIcon()}" class="w-16 h-16">
            <div>
              <h2 class="text-lg font-bold text-white">${this.name}</h2>
              <p class="text-gray-400 text-sm">Type: ${this.item.type}</p>
            </div>
          </div>
          <div class="border-t border-gray-700 pt-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-gray-400">Location:</div>
              <div class="text-white">Desktop</div>
              <div class="text-gray-400">Size:</div>
              <div class="text-white">${this.item.size || 'N/A'}</div>
              <div class="text-gray-400">Created:</div>
              <div class="text-white">${new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      `
    });
  }
}