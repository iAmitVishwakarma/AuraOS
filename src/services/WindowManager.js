/**
 * Manages all application windows, including creation, dragging, and state.
 */
export default class WindowManager {
  constructor(os) {
    this.os = os;
    this.windows = [];
    this.zIndexCounter = 100;
    this.activeWindow = null;
  }
  
  createWindow(options) {
    const windowId = `window-${Date.now()}`;
    const windowElement = document.createElement('div');
    windowElement.id = windowId;
    windowElement.className = `absolute bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-gray-700 flex flex-col`;
    windowElement.style.width = `${options.width || 800}px`;
    windowElement.style.height = `${options.height || 600}px`;
    windowElement.style.top = `${options.y || 100}px`;
    windowElement.style.left = `${options.x || 100}px`;
    windowElement.style.minWidth = '300px';
    windowElement.style.minHeight = '200px';
    
    windowElement.innerHTML = `
      <div class="window-header bg-gray-900 bg-opacity-50 px-4 py-2 flex items-center justify-between border-b border-gray-700 cursor-move">
        <div class="flex items-center space-x-2">
          <img src="${options.icon || '/assets/icons/default.png'}" class="w-5 h-5" />
          <span class="text-white font-medium">${options.title}</span>
        </div>
        <div class="window-controls flex items-center space-x-2">
          <button class="window-minimize w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400"></button>
          <button class="window-maximize w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400"></button>
          <button class="window-close w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400"></button>
        </div>
      </div>
      <div class="window-content flex-1 overflow-auto">${options.content || ''}</div>
    `;
    
    document.getElementById('app').appendChild(windowElement);
    
    const windowObj = { id: windowId, element: windowElement, title: options.title, icon: options.icon };
    this.windows.push(windowObj);

    // Use GSAP Draggable for smooth, constrained dragging
    Draggable.create(windowElement, {
      trigger: ".window-header",
      bounds: "body",
      onPress: () => this.focusWindow(windowId),
    });
    
    windowElement.querySelector('.window-close').addEventListener('click', () => this.closeWindow(windowId));
    windowElement.addEventListener('mousedown', () => this.focusWindow(windowId), true);

    this.focusWindow(windowId);
    this.os.components.taskbar.addTaskbarItem(windowObj);
    return windowObj;
  }
  
  focusWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window && this.activeWindow?.id !== windowId) {
      window.element.style.zIndex = this.zIndexCounter++;
      this.activeWindow = window;
    }
  }
  
  closeWindow(windowId) {
    const windowIndex = this.windows.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
      this.windows[windowIndex].element.remove();
      this.windows.splice(windowIndex, 1);
      this.os.components.taskbar.removeTaskbarItem(windowId);
      if (this.activeWindow?.id === windowId) {
          this.activeWindow = null;
      }
    }
  }
}