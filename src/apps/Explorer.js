export default class Explorer {
  constructor(os, options = {}) {
    this.os = os;
    this.currentPath = options.path || `/Users/${this.os.currentUser}`;
    this.window = null;
    this.icon = '/assets/icons/explorer.png';
    this.title = 'File Explorer';
  }
  
  launch() {
    this.window = this.os.services.window.createWindow({
      title: this.title,
      icon: this.icon,
      width: 800,
      height: 600,
      content: this.render()
    });
    
    // Add to taskbar
    this.os.components.taskbar.addTaskbarItem(this.window);
  }
  
  render() {
    const currentDir = this.os.services.vfs.read(this.currentPath);
    const parentPath = this.getParentPath(this.currentPath);
    
    return `
      <div class="explorer h-full flex flex-col">
        <div class="toolbar bg-gray-900 p-2 flex items-center border-b border-gray-700">
          <button class="back-button p-2 rounded hover:bg-gray-700 mr-1" ${!parentPath ? 'disabled' : ''}>
            <img src="/assets/icons/back.png" class="w-5 h-5">
          </button>
          <button class="forward-button p-2 rounded hover:bg-gray-700 mr-1" disabled>
            <img src="/assets/icons/forward.png" class="w-5 h-5">
          </button>
          <button class="up-button p-2 rounded hover:bg-gray-700 mr-4" ${!parentPath ? 'disabled' : ''}>
            <img src="/assets/icons/up.png" class="w-5 h-5">
          </button>
          
          <div class="address-bar flex-1 bg-gray-800 rounded px-3 py-1 text-white text-sm flex items-center">
            ${this.currentPath}
          </div>
          
          <button class="refresh-button p-2 rounded hover:bg-gray-700 ml-2">
            <img src="/assets/icons/refresh.png" class="w-5 h-5">
          </button>
        </div>
        
        <div class="content-area flex-1 flex overflow-hidden">
          <div class="sidebar w-48 bg-gray-900 border-r border-gray-700 p-2 overflow-y-auto">
            <div class="quick-access">
              <div class="sidebar-item flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
                <img src="/assets/icons/desktop.png" class="w-5 h-5 mr-2">
                <span class="text-white text-sm">Desktop</span>
              </div>
              <div class="sidebar-item flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
                <img src="/assets/icons/documents.png" class="w-5 h-5 mr-2">
                <span class="text-white text-sm">Documents</span>
              </div>
              <div class="sidebar-item flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
                <img src="/assets/icons/music.png" class="w-5 h-5 mr-2">
                <span class="text-white text-sm">Music</span>
              </div>
            </div>
          </div>
          
          <div class="file-list flex-1 overflow-y-auto p-4">
            ${this.renderFileList(currentDir)}
          </div>
        </div>
        
        <div class="status-bar bg-gray-900 p-1 text-xs text-gray-400 border-t border-gray-700">
          ${currentDir.children ? Object.keys(currentDir.children).length : 0} items
        </div>
      </div>
    `;
  }
  
  renderFileList(directory) {
    if (!directory || !directory.children) {
      return '<div class="text-gray-400 p-4">No items found</div>';
    }
    
    return `
      <div class="grid grid-cols-5 gap-4">
        ${Object.entries(directory.children).map(([name, item]) => `
          <div class="file-item flex flex-col items-center p-2 rounded hover:bg-gray-700 cursor-pointer"
               data-path="${this.currentPath}/${name}">
            <img src="${this.getIconForItem(item)}" class="w-12 h-12">
            <span class="text-white text-xs text-center mt-1 truncate w-full">${name}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  getIconForItem(item) {
    switch (item.type) {
      case 'dir':
        return '/assets/icons/folder.png';
      case 'file':
        return this.getFileIcon(item);
      case 'shortcut':
        return '/assets/icons/shortcut.png';
      default:
        return '/assets/icons/default.png';
    }
  }
  
  getFileIcon(item) {
    if (item.content) {
      const extension = item.content.split('.').pop().toLowerCase();
      switch (extension) {
        case 'txt':
          return '/assets/icons/text.png';
        case 'mp3':
        case 'wav':
          return '/assets/icons/music.png';
        case 'json':
          return '/assets/icons/settings.png';
        default:
          return '/assets/icons/file.png';
      }
    }
    return '/assets/icons/file.png';
  }
  
  getParentPath(path) {
    const parts = path.split('/').filter(p => p !== '');
    if (parts.length <= 1) return null;
    parts.pop();
    return `/${parts.join('/')}`;
  }
  
  navigateTo(path) {
    this.currentPath = path;
    this.window.element.querySelector('.content-area').innerHTML = this.renderFileList(
      this.os.services.vfs.read(this.currentPath)
    );
    this.window.element.querySelector('.address-bar').textContent = this.currentPath;
  }
}