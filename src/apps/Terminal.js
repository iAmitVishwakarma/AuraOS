export default class Terminal {
  constructor(os) {
    this.os = os;
    this.title = 'AuraShell';
    this.icon = '/assets/icons/terminal.png';
    this.window = null;
    this.currentPath = `/Users/${this.os.currentUser}`;
    this.history = [];
    this.historyIndex = 0;
    this.commands = {
      help: this.help.bind(this),
      ls: this.ls.bind(this),
      cd: this.cd.bind(this),
      clear: this.clear.bind(this),
      neofetch: this.neofetch.bind(this),
      theme: this.theme.bind(this),
      echo: this.echo.bind(this)
    };
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
    
    // Focus the input
    this.window.element.querySelector('.terminal-input').focus();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  render() {
    return `
      <div class="terminal h-full flex flex-col bg-gray-900 font-mono text-sm">
        <div class="terminal-header bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
          <div class="flex items-center space-x-2">
            <img src="${this.icon}" class="w-5 h-5">
            <span class="text-white">${this.title}</span>
          </div>
          <button class="terminal-close w-4 h-4 rounded-full bg-red-500 hover:bg-red-400"></button>
        </div>
        
        <div class="terminal-content flex-1 overflow-y-auto p-2 text-gray-300" style="white-space: pre-wrap;"></div>
        
        <div class="terminal-input-container bg-gray-800 border-t border-gray-700 p-2 flex">
          <span class="text-green-400 mr-2">${this.currentPath}$</span>
          <input type="text" class="terminal-input flex-1 bg-transparent text-white outline-none" autocomplete="off">
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const input = this.window.element.querySelector('.terminal-input');
    const content = this.window.element.querySelector('.terminal-content');
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
          this.history.push(command);
          this.historyIndex = this.history.length;
          
          // Add command to output
          content.innerHTML += `<div class="command-line"><span class="text-green-400">${this.currentPath}$</span> ${command}</div>`;
          
          // Process command
          this.processCommand(command);
          
          // Clear input
          input.value = '';
          
          // Scroll to bottom
          content.scrollTop = content.scrollHeight;
        }
      } else if (e.key === 'ArrowUp') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          input.value = this.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          input.value = this.history[this.historyIndex];
        } else if (this.historyIndex === this.history.length - 1) {
          this.historyIndex++;
          input.value = '';
        }
      }
    });
    
    // Close button
    this.window.element.querySelector('.terminal-close').addEventListener('click', () => {
      this.window.close();
    });
  }
  
  processCommand(command) {
    const content = this.window.element.querySelector('.terminal-content');
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();
    const params = args.slice(1);
    
    if (this.commands[cmd]) {
      this.commands[cmd](params);
    } else {
      content.innerHTML += `<div class="text-red-400">Command not found: ${cmd}</div>`;
      content.innerHTML += `<div>Type 'help' for a list of available commands</div>`;
    }
    
    // Scroll to bottom
    content.scrollTop = content.scrollHeight;
  }
  
  help() {
    const content = this.window.element.querySelector('.terminal-content');
    content.innerHTML += `
      <div class="help-section">
        <div class="text-yellow-400">Available commands:</div>
        <div class="ml-4">
          <div><span class="text-green-400">help</span> - Show this help message</div>
          <div><span class="text-green-400">ls</span> - List directory contents</div>
          <div><span class="text-green-400">cd [dir]</span> - Change directory</div>
          <div><span class="text-green-400">clear</span> - Clear the terminal</div>
          <div><span class="text-green-400">neofetch</span> - Show system information</div>
          <div><span class="text-green-400">theme [dark/light]</span> - Change theme</div>
          <div><span class="text-green-400">echo [text]</span> - Display text</div>
        </div>
      </div>
    `;
  }
  
  ls() {
    const content = this.window.element.querySelector('.terminal-content');
    const dir = this.os.services.vfs.read(this.currentPath);
    
    if (!dir || !dir.children) {
      content.innerHTML += `<div class="text-red-400">Directory not found</div>`;
      return;
    }
    
    let output = '';
    Object.entries(dir.children).forEach(([name, item]) => {
      const color = item.type === 'dir' ? 'text-blue-400' : 'text-white';
      output += `<div class="${color}">${name}</div>`;
    });
    
    content.innerHTML += output;
  }
  
  cd(params) {
    const content = this.window.element.querySelector('.terminal-content');
    if (params.length === 0) {
      // Go to home directory
      this.currentPath = `/Users/${this.os.currentUser}`;
      return;
    }
    
    const target = params[0];
    let newPath = this.currentPath;
    
    if (target === '..') {
      // Go up one directory
      const parts = this.currentPath.split('/').filter(p => p !== '');
      if (parts.length > 1) {
        parts.pop();
        newPath = `/${parts.join('/')}`;
      }
    } else if (target.startsWith('/')) {
      // Absolute path
      newPath = target;
    } else {
      // Relative path
      newPath = `${this.currentPath}/${target}`;
    }
    
    // Check if directory exists
    const dir = this.os.services.vfs.read(newPath);
    if (dir && dir.type === 'dir') {
      this.currentPath = newPath;
    } else {
      content.innerHTML += `<div class="text-red-400">Directory not found: ${newPath}</div>`;
    }
  }
  
  clear() {
    const content = this.window.element.querySelector('.terminal-content');
    content.innerHTML = '';
  }
  
  neofetch() {
    const content = this.window.element.querySelector('.terminal-content');
    content.innerHTML += `
      <div class="neofetch grid grid-cols-2 gap-4">
        <div class="text-blue-400">
          <div>OS: AuraOS v3.0</div>
          <div>Host: Web Browser</div>
          <div>Shell: AuraShell 1.0</div>
          <div>Theme: ${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'}</div>
        </div>
        <div class="flex items-center justify-center">
          <div class="text-6xl font-bold text-purple-400">Aura</div>
        </div>
      </div>
    `;
  }
  
  theme(params) {
    const content = this.window.element.querySelector('.terminal-content');
    if (params.length === 0) {
      content.innerHTML += `<div>Current theme: ${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}</div>`;
      content.innerHTML += `<div>Usage: theme [dark/light]</div>`;
      return;
    }
    
    const theme = params[0].toLowerCase();
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      content.innerHTML += `<div>Theme set to ${theme}</div>`;
      
      // Save to user config
      const configPath = `/System/Users/${this.os.currentUser}/config.json`;
      const config = JSON.parse(this.os.services.vfs.read(configPath).content);
      config.theme = theme;
      this.os.services.vfs.write(configPath, JSON.stringify(config));
    } else {
      content.innerHTML += `<div class="text-red-400">Invalid theme: ${theme}</div>`;
      content.innerHTML += `<div>Available themes: dark, light</div>`;
    }
  }
  
  echo(params) {
    const content = this.window.element.querySelector('.terminal-content');
    content.innerHTML += `<div>${params.join(' ')}</div>`;
  }
}