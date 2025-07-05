/**
 * Creates and manages the OS Taskbar, Start Menu, and System Tray.
 */
export default class Taskbar {
  constructor(os) {
    this.os = os;
    this.element = document.createElement('div');
    this.element.className = 'taskbar absolute bottom-0 left-0 w-full h-14 bg-gray-900 bg-opacity-70 backdrop-blur-md flex items-center px-2 border-t border-gray-700 z-50';
    this.render();
    document.getElementById('app').appendChild(this.element);
    setInterval(() => this.updateClock(), 1000);
  }
  
  render() {
    this.element.innerHTML = `
      <div class="start-button p-2 flex items-center justify-center rounded hover:bg-gray-700 transition cursor-pointer">
        <img src="/assets/icons/start.png" class="w-6 h-6">
      </div>
      <div class="taskbar-items flex-1 flex items-center px-2 space-x-1 overflow-x-auto"></div>
      <div class="system-tray flex items-center space-x-4">
        <div class="network-status">
          <img src="/assets/icons/wifi.png" class="w-5 h-5">
        </div>
        <div class="clock text-white text-sm font-medium">${this.getCurrentTime()}</div>
      </div>
    `;
    
    this.element.querySelector('.start-button').addEventListener('click', (e) => {
        e.stopPropagation();
        this.showStartMenu();
    });
    this.loadPinnedApps();
  }
  
  showStartMenu() {
    // Implementation of start menu remains similar but would be improved
    // by dynamically generating the app list from VFS/user config.
    console.log("Start Menu opened");
  }

  loadPinnedApps() {
      const userConfig = JSON.parse(this.os.services.vfs.read(`/C:/Users/${this.os.currentUser}/config.json`).content);
      const pinnedApps = userConfig.pinnedApps || [];
      const taskbarItems = this.element.querySelector('.taskbar-items');
      pinnedApps.forEach(appName => {
          const appIcon = document.createElement('div');
          appIcon.className = 'taskbar-icon p-2 flex items-center justify-center rounded hover:bg-gray-700 transition cursor-pointer';
          appIcon.innerHTML = `<img src="/assets/icons/${appName}.png" class="w-7 h-7" title="${appName}">`;
          appIcon.addEventListener('click', () => this.os.launchApp(appName));
          taskbarItems.appendChild(appIcon);
      });
  }

  addTaskbarItem(windowObj) {
    const taskbarItems = this.element.querySelector('.taskbar-items');
    const item = document.createElement('div');
    item.className = 'taskbar-app p-2 flex items-center justify-center rounded bg-gray-700 transition cursor-pointer border-b-2 border-accent';
    item.dataset.windowId = windowObj.id;
    item.innerHTML = `<img src="${windowObj.icon}" class="w-6 h-6" title="${windowObj.title}">`;
    item.addEventListener('click', () => this.os.services.window.focusWindow(windowObj.id));
    taskbarItems.appendChild(item);
  }

  removeTaskbarItem(windowId) {
      const item = this.element.querySelector(`[data-window-id="${windowId}"]`);
      if (item) item.remove();
  }

  updateClock() {
    this.element.querySelector('.clock').textContent = this.getCurrentTime();
  }
  
  getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}