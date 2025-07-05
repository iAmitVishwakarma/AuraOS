export default class WindowManager {
  constructor() {
    this.windows = [];
    this.zIndex = 100;
    this.activeWindow = null;
  }
  
  createWindow(options) {
    const windowId = `window-${Date.now()}`;
    const windowElement = document.createElement('div');
    windowElement.id = windowId;
    windowElement.className = `absolute bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-gray-700 flex flex-col`;
    windowElement.style.width = options.width ? `${options.width}px` : '800px';
    windowElement.style.height = options.height ? `${options.height}px` : '600px';
    windowElement.style.zIndex = this.zIndex++;
    
    windowElement.innerHTML = `
      <div class="window-header bg-gray-900 bg-opacity-50 px-4 py-2 flex items-center justify-between border-b border-gray-700 cursor-move">
        <div class="flex items-center space-x-2">
          <img src="${options.icon || '/assets/icons/default.png'}" class="w-5 h-5" />
          <span class="text-white font-medium">${options.title}</span>
        </div>
        <div class="window-controls flex space-x-2">
          <button class="window-minimize w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-400"></button>
          <button class="window-maximize w-4 h-4 rounded-full bg-green-500 hover:bg-green-400"></button>
          <button class="window-close w-4 h-4 rounded-full bg-red-500 hover:bg-red-400"></button>
        </div>
      </div>
      <div class="window-content flex-1 overflow-auto">${options.content || ''}</div>
    `;
    
    document.getElementById('app').appendChild(windowElement);
    
    // Make window draggable
    this.makeDraggable(windowElement);
    
    // Add window controls
    const closeBtn = windowElement.querySelector('.window-close');
    closeBtn.addEventListener('click', () => this.closeWindow(windowId));
    
    const minimizeBtn = windowElement.querySelector('.window-minimize');
    minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));
    
    const maximizeBtn = windowElement.querySelector('.window-maximize');
    maximizeBtn.addEventListener('click', () => this.toggleMaximize(windowId));
    
    // Focus window when clicked
    windowElement.addEventListener('mousedown', () => this.focusWindow(windowId));
    
    const windowObj = {
      id: windowId,
      element: windowElement,
      title: options.title,
      minimized: false,
      maximized: false,
      originalSize: {
        width: options.width || 800,
        height: options.height || 600
      },
      originalPosition: {
        x: options.x || 100,
        y: options.y || 100
      }
    };
    
    this.windows.push(windowObj);
    this.focusWindow(windowId);
    
    return windowObj;
  }
  
  makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.window-header');
    
    header.onmousedown = (e) => {
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
      
      element.style.top = `${element.offsetTop - pos2}px`;
      element.style.left = `${element.offsetLeft - pos1}px`;
    };
    
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };
  }
  
  focusWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      this.windows.forEach(w => {
        w.element.style.zIndex = 100;
      });
      
      window.element.style.zIndex = this.zIndex++;
      this.activeWindow = window;
    }
  }
  
  closeWindow(windowId) {
    const windowIndex = this.windows.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
      this.windows[windowIndex].element.remove();
      this.windows.splice(windowIndex, 1);
    }
  }
  
  minimizeWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.minimized = true;
      window.element.style.display = 'none';
    }
  }
  
  restoreWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.minimized = false;
      window.element.style.display = 'block';
      this.focusWindow(windowId);
    }
  }
  
  toggleMaximize(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      if (window.maximized) {
        // Restore
        window.element.style.width = `${window.originalSize.width}px`;
        window.element.style.height = `${window.originalSize.height}px`;
        window.element.style.top = `${window.originalPosition.y}px`;
        window.element.style.left = `${window.originalPosition.x}px`;
        window.maximized = false;
      } else {
        // Maximize
        window.originalSize = {
          width: window.element.offsetWidth,
          height: window.element.offsetHeight
        };
        window.originalPosition = {
          x: window.element.offsetLeft,
          y: window.element.offsetTop
        };
        
        window.element.style.width = 'calc(100% - 20px)';
        window.element.style.height = 'calc(100% - 76px)';
        window.element.style.top = '10px';
        window.element.style.left = '10px';
        window.maximized = true;
      }
    }
  }
}