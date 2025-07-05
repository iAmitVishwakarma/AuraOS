import AuthService from './services/AuthService.js';
import VFSService from './services/VFSService.js';
import WindowManager from './services/WindowManager.js';
import Taskbar from './components/Taskbar.js';

export default class AuraKernel {
  constructor() {
    this.services = {
      auth: new AuthService(),
      vfs: new VFSService(),
      window: new WindowManager()
    };
    
    this.components = {
      taskbar: null
    };
    
    this.currentUser = null;
  }
  
  async boot() {
    // Load default file system
    await this.services.vfs.initialize();
    
    // Check for active session
    const session = this.services.auth.checkSession();
    
    if (session) {
      this.currentUser = session.username;
      this.loadUserEnvironment();
      this.showDesktop();
    } else {
      this.showLoginScreen();
    }
  }
  
  showLoginScreen() {
    const appElement = document.getElementById('app');
    appElement.innerHTML = `
      <div class="login-screen absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-md z-50">
        <div class="login-box bg-gray-800 p-8 rounded-lg shadow-xl w-96">
          <h1 class="text-3xl font-bold text-center mb-6 text-white">AuraOS Login</h1>
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-gray-300 mb-2">Username</label>
              <input type="text" name="username" class="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Password</label>
              <input type="password" name="password" class="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition duration-200">
              Sign In
            </button>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
      };
      
      if (this.services.auth.login(credentials.username, credentials.password)) {
        this.currentUser = credentials.username;
        this.loadUserEnvironment();
        this.showDesktop();
      } else {
        alert('Invalid credentials');
      }
    });
  }
  
  loadUserEnvironment() {
    const userConfig = this.services.vfs.read(`/System/Users/${this.currentUser}/config.json`);
    if (userConfig) {
      // Apply user preferences
      document.documentElement.classList.toggle('dark', userConfig.theme === 'dark');
      document.documentElement.style.setProperty('--color-accent', userConfig.accentColor || '#3b82f6');
      
      // Set wallpaper
      const wallpaper = userConfig.wallpaper || '/assets/wallpapers/default.jpg';
      document.body.style.backgroundImage = `url('${wallpaper}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
  }
  
  showDesktop() {
    const appElement = document.getElementById('app');
    appElement.innerHTML = `
      <div class="desktop absolute inset-0">
        <div id="desktopIcons" class="absolute top-0 left-0 w-full h-[calc(100%-56px)] p-4"></div>
      </div>
    `;
    
    // Initialize taskbar
    this.components.taskbar = new Taskbar(this);
    
    // Load desktop icons
    this.loadDesktopIcons();
  }
  
  loadDesktopIcons() {
    const desktopItems = this.services.vfs.read(`/Users/${this.currentUser}/Desktop`);
    const desktopIconsElement = document.getElementById('desktopIcons');
    
    if (desktopItems && desktopItems.children) {
      Object.entries(desktopItems.children).forEach(([name, item]) => {
        const icon = new DesktopIcon(this, name, item);
        desktopIconsElement.appendChild(icon.element);
      });
    }
  }
  
  openSpotlight() {
    // Implement spotlight search
    const spotlight = new Spotlight(this);
    spotlight.show();
  }
}