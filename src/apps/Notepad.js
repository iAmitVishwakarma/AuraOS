export default class Notepad {
  constructor(os, options = {}) {
    this.os = os;
    this.filePath = options.file || null;
    this.content = '';
    this.title = this.filePath ? `${this.getFileName(this.filePath)} - Notepad` : 'Untitled - Notepad';
    this.icon = '/assets/icons/notepad.png';
    this.window = null;
    
    if (this.filePath) {
      const file = this.os.services.vfs.read(this.filePath);
      if (file && file.content) {
        this.content = file.content;
      }
    }
  }
  
  launch() {
    this.window = this.os.services.window.createWindow({
      title: this.title,
      icon: this.icon,
      width: 600,
      height: 400,
      content: this.render()
    });
    
    // Add to taskbar
    this.os.components.taskbar.addTaskbarItem(this.window);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  render() {
    return `
      <div class="notepad h-full flex flex-col">
        <div class="toolbar bg-gray-900 p-1 flex items-center border-b border-gray-700">
          <button class="file-button px-3 py-1 rounded hover:bg-gray-700 text-white text-sm">File</button>
          <button class="edit-button px-3 py-1 rounded hover:bg-gray-700 text-white text-sm">Edit</button>
          <button class="view-button px-3 py-1 rounded hover:bg-gray-700 text-white text-sm">View</button>
          <button class="help-button px-3 py-1 rounded hover:bg-gray-700 text-white text-sm">Help</button>
        </div>
        
        <textarea class="flex-1 bg-gray-800 text-white p-2 outline-none resize-none font-mono text-sm"
                  spellcheck="false">${this.content}</textarea>
        
        <div class="status-bar bg-gray-900 p-1 text-xs text-gray-400 border-t border-gray-700">
          ${this.getStatusText()}
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const textarea = this.window.element.querySelector('textarea');
    
    textarea.addEventListener('input', () => {
      this.content = textarea.value;
      this.updateStatusBar();
    });
    
    // File menu
    this.window.element.querySelector('.file-button').addEventListener('click', (e) => {
      const menu = new ContextMenu(this.os, [
        { label: 'New', action: () => this.newFile() },
        { label: 'Open...', action: () => this.openFile() },
        { label: 'Save', action: () => this.saveFile() },
        { label: 'Save As...', action: () => this.saveAs() },
        { type: 'separator' },
        { label: 'Exit', action: () => this.window.close() }
      ]);
      
      menu.show(e.clientX, e.clientY);
    });
  }
  
  newFile() {
    this.filePath = null;
    this.content = '';
    this.title = 'Untitled - Notepad';
    this.window.element.querySelector('textarea').value = '';
    this.updateStatusBar();
  }
  
  openFile() {
    // In a real implementation, this would open a file dialog
    // For now, we'll just simulate opening a file
    const filePath = prompt('Enter file path:');
    if (filePath) {
      const file = this.os.services.vfs.read(filePath);
      if (file && file.content) {
        this.filePath = filePath;
        this.content = file.content;
        this.title = `${this.getFileName(filePath)} - Notepad`;
        this.window.element.querySelector('textarea').value = this.content;
        this.updateStatusBar();
      } else {
        alert('File not found or not readable');
      }
    }
  }
  
  saveFile() {
    if (!this.filePath) {
      return this.saveAs();
    }
    
    this.os.services.vfs.write(this.filePath, this.content);
    this.updateStatusBar();
  }
  
  saveAs() {
    const filePath = prompt('Enter file path to save:', this.filePath || `/Users/${this.os.currentUser}/Documents/untitled.txt`);
    if (filePath) {
      this.filePath = filePath;
      this.title = `${this.getFileName(filePath)} - Notepad`;
      this.os.services.vfs.write(filePath, this.content);
      this.updateStatusBar();
    }
  }
  
  getFileName(path) {
    return path.split('/').pop();
  }
  
  getStatusText() {
    if (this.filePath) {
      return `Ln 1, Col 1 | ${this.content.length} chars | ${this.filePath}`;
    }
    return `Ln 1, Col 1 | ${this.content.length} chars | Not saved`;
  }
  
  updateStatusBar() {
    if (this.window && this.window.element) {
      this.window.element.querySelector('.status-bar').textContent = this.getStatusText();
    }
  }
}