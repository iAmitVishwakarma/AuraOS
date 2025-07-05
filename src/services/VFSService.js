export default class VFSService {
  constructor() {
    this.fs = {
      "System": {
        type: "dir",
        children: {
          "Users": {
            type: "dir",
            children: {
              "admin": {
                type: "dir",
                children: {
                  "Documents": { type: "dir", children: {} },
                  "Music": { type: "dir", children: {} },
                  "config.json": {
                    type: "file",
                    content: JSON.stringify({
                      theme: "dark",
                      accentColor: "#3b82f6",
                      wallpaper: "/assets/wallpapers/default.jpg",
                      pinnedApps: ["explorer", "notepad", "calculator"]
                    })
                  }
                }
              }
            }
          }
        }
      },
      "Users": {
        type: "dir",
        children: {
          "admin": {
            type: "dir",
            children: {
              "Desktop": {
                type: "dir",
                children: {
                  "Documents": { type: "shortcut" ,
                     target: "/Users/admin/Documents" 
                    },
                  "Music": { type: "shortcut", 
                    target: "/Users/admin/Music"
                     }
                    }
                },
                
        
              "Documents": { type: "dir", children: {} },
              "Music": { 
                type: "dir", 
                children: {
                  "sample.mp3": { 
                    type: "file", 
                    content: "/assets/music/sample.mp3",
                    metadata: {
                      title: "Sample Song",
                      artist: "AuraOS",
                      duration: 180
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
  
  async initialize() {
    // Load from localStorage if available
    const savedFS = localStorage.getItem('aura_vfs');
    if (savedFS) {
      this.fs = JSON.parse(savedFS);
    } else {
      await this.saveToStorage();
    }
  }
  
  async saveToStorage() {
    localStorage.setItem('aura_vfs', JSON.stringify(this.fs));
  }
  
  read(path) {
    const parts = path.split('/').filter(p => p !== '');
    let current = this.fs;
    
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    
    return current;
  }
  
  write(path, content) {
    const parts = path.split('/').filter(p => p !== '');
    const filename = parts.pop();
    let current = this.fs;
    
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { type: 'dir', children: {} };
      }
      current = current.children[part];
    }
    
    current.children[filename] = {
      type: 'file',
      content: content
    };
    
    this.saveToStorage();
  }
  
  createDirectory(path) {
    const parts = path.split('/').filter(p => p !== '');
    let current = this.fs;
    
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { type: 'dir', children: {} };
      }
      current = current.children[part];
    }
    
    this.saveToStorage();
    return current;
  }
  
  delete(path) {
    const parts = path.split('/').filter(p => p !== '');
    const filename = parts.pop();
    let current = this.fs;
    
    for (const part of parts) {
      if (!current.children[part]) {
        return false;
      }
      current = current.children[part];
    }
    
    if (current.children[filename]) {
      delete current.children[filename];
      this.saveToStorage();
      return true;
    }
    
    return false;
  }
}