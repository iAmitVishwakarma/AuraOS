/**
 * Manages the virtual file system, persisting it to localStorage.
 */
export default class VFSService {
  constructor() {
    this.fs = null;
  }
  
  async initialize() {
    const savedFS = localStorage.getItem('aura_vfs');
    if (savedFS) {
      this.fs = JSON.parse(savedFS);
    } else {
      // Load default FS from a file to keep this service clean
      const response = await fetch('/src/data/defaultFileSystem.json');
      this.fs = await response.json();
      await this.saveToStorage();
    }
  }
  
  async saveToStorage() {
    localStorage.setItem('aura_vfs', JSON.stringify(this.fs));
  }
  
  _resolvePath(path) {
      const parts = path.split('/').filter(p => p !== '' && p !== 'C:');
      let current = this.fs['C:'];
      for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (current && current.type === 'dir' && current.children && current.children[part]) {
              current = current.children[part];
          } else {
              return null; // Not found
          }
      }
      return current;
  }

  read(path) {
    return this._resolvePath(path);
  }
  
  write(path, content) {
    const parts = path.split('/').filter(p => p !== '' && p !== 'C:');
    const filename = parts.pop();
    let current = this.fs['C:'];
    
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { type: 'dir', children: {} };
      }
      current = current.children[part];
    }
    
    // Check if writing to a directory
    if (current.type !== 'dir') return false;

    current.children[filename] = {
      type: 'file',
      content: content
    };
    
    this.saveToStorage();
    return true;
  }

  rename(path, newName) {
      const parts = path.split('/').filter(p => p !== '' && p !== 'C:');
      const oldName = parts.pop();
      const parentPath = `/C:/${parts.join('/')}`;
      const parentNode = this._resolvePath(parentPath);

      if (parentNode && parentNode.children && parentNode.children[oldName]) {
          const item = parentNode.children[oldName];
          delete parentNode.children[oldName];
          parentNode.children[newName] = item;
          this.saveToStorage();
          return true;
      }
      return false;
  }

  delete(path) {
      const parts = path.split('/').filter(p => p !== '' && p !== 'C:');
      const name = parts.pop();
      const parentPath = `/C:/${parts.join('/')}`;
      const parentNode = this._resolvePath(parentPath);

      if (parentNode && parentNode.children && parentNode.children[name]) {
          delete parentNode.children[name];
          this.saveToStorage();
          return true;
      }
      return false;
  }
}