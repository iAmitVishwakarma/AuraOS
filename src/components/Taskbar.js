export default class Taskbar {
  constructor(os) {
    this.os = os;
    this.element = document.createElement('div');
    this.element.className = 'taskbar absolute bottom-0 left-0 w-full h-14 bg-gray-900 bg-opacity-70 backdrop-blur-md flex items-center px-2 border-t border-gray-700 z-50';
    
    this.render();
    document.getElementById('app').appendChild(this.element);
    
    // Update clock every second
    setInterval(() => this.updateClock(), 1000);
  }
  
  render() {
    this.element.innerHTML = `
      <div class="start-button h-10 w-10 flex items-center justify-center rounded hover:bg-gray-700 transition cursor-pointer">
        <img src="/assets/icons/start.png" class="w-6 h-6">
      </div>
      
      <div class="taskbar-items flex-1 flex items-center px-2 space-x-1 overflow-x-auto">
        <!-- Pinned apps and open windows will appear here -->
      </div>
      
      <div class="system-tray flex items-center space-x-2">
        <div class="volume-control flex items-center">
          <img src="/assets/icons/volume.png" class="w-5 h-5">
        </div>
        <div class="network-status">
          <img src="/assets/icons/wifi.png" class="w-5 h-5">
        </div>
        <div class="clock text-white text-sm font-medium">
          ${this.getCurrentTime()}
        </div>
      </div>
    `;
    
    // Add start button click handler
    this.element.querySelector('.start-button').addEventListener('click', () => this.showStartMenu());
    
    // Load pinned apps
    this.loadPinnedApps();
  }
  
  showStartMenu() {
    const startMenu = document.createElement('div');
    startMenu.className = 'start-menu absolute bottom-14 left-2 w-80 h-96 bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden';
    
    startMenu.innerHTML = `
      <div class="search-box p-2 border-b border-gray-700">
        <input type="text" placeholder="Search apps and files..." class="w-full px-3 py-2 bg-gray-700 rounded text-white focus:outline-none">
      </div>
      <div class="apps-grid grid grid-cols-4 gap-4 p-4">
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/explorer.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Explorer</span>
        </div>
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/notepad.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Notepad</span>
        </div>
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/calculator.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Calculator</span>
        </div>
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/music.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Music</span>
        </div>
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/terminal.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Terminal</span>
        </div>
        <div class="app-icon flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
          <img src="/assets/icons/settings.png" class="w-10 h-10">
          <span class="text-white text-xs mt-1">Settings</span>
        </div>
      </div>
    `;
    
    document.getElementById('app').appendChild(startMenu);
    
    // Add click handlers for app icons
    startMenu.querySelectorAll('.app-icon').forEach(icon => {
      const appName = icon.querySelector('span').textContent.toLowerCase();
      icon.addEventListener('click', () => {
        this.os.launchApp(appName);
        startMenu.remove();
      });
    });
    
    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && !this.element.querySelector('.start-button').contains(e.target)) {
        startMenu.remove();
      }
    }, { once: true });
  }
  
  loadPinnedApps() {
    const taskbarItems = this.element.querySelector('.taskbar-items');
    const pinnedApps = ['explorer', 'notepad', 'calculator', 'music'];
    
    pinnedApps.forEach(app => {
      const appIcon = document.createElement('div');
      appIcon.className = 'taskbar-icon h-10 w-10 flex items-center justify-center rounded hover:bg-gray-700 transition cursor-pointer';
      appIcon.innerHTML = `<img src="/assets/icons/${app}.png" class="w-6 h-6">`;
      
      appIcon.addEventListener('click', () => this.os.launchApp(app));
      taskbarItems.appendChild(appIcon);
    });
  }
  
  updateClock() {
    const clockElement = this.element.querySelector('.clock');
    if (clockElement) {
      clockElement.textContent = this.getCurrentTime();
    }
  }
  
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  addTaskbarItem(window) {
    const taskbarItems = this.element.querySelector('.taskbar-items');
    const existingItem = taskbarItems.querySelector(`[data-window-id="${window.id}"]`);
    
    if (existingItem) {
      return existingItem;
    }
    
    const item = document.createElement('div');
    item.className = 'taskbar-icon h-10 w-10 flex items-center justify-center rounded hover:bg-gray-700 transition cursor-pointer';
    item.dataset.windowId = window.id;
    item.innerHTML = `<img src="${window.icon || '/assets/icons/default.png'}" class="w-6 h-6">`;
    
    item.addEventListener('click', () => {
      if (window.minimized) {
        this.os.services.window.restoreWindow(window.id);
      } else {
        this.os.services.window.focusWindow(window.id);
      }
    });
    
    taskbarItems.appendChild(item);
    return item;
  }
}