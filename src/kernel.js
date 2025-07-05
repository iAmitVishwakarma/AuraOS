import AuthService from './services/AuthService.js';
import VFSService from './services/VFSService.js';
import WindowManager from './services/WindowManager.js';
import Taskbar from './components/Taskbar.js';
import DesktopIcon from './components/DesktopIcon.js';
import Spotlight from './components/Spotlight.js';

// App Imports
import Explorer from './apps/Explorer.js';
import Notepad from './apps/Notepad.js';
import Terminal from './apps/Terminal.js';
import Calculator from './apps/Calculator.js';
import MusicPlayer from './apps/MusicPlayer.js';

/**
 * AuraKernel is the central orchestrator for the OS.
 * It manages services, components, and the main boot process.
 */
export default class AuraKernel {
  constructor() {
    this.services = {
      auth: new AuthService(),
      vfs: new VFSService(),
      window: new WindowManager(this)
    };
    
    this.components = {
      taskbar: null,
      spotlight: null
    };
    
    this.currentUser = null;
    this.apps = {
        explorer: Explorer,
        notepad: Notepad,
        terminal: Terminal,
        calculator: Calculator,
        music: MusicPlayer,
    };
  }

  async boot() {
    await this.services.vfs.initialize();
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
    appElement.innerHTML = ''; // Clear previous UI
    appElement.innerHTML = `
      <div class="login-screen absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-md z-50">
        <div class="login-box bg-gray-800 p-8 rounded-lg shadow-xl w-96">
          <h1 class="text-3xl font-bold text-center mb-6 text-white">AuraOS</h1>
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-gray-300 mb-2">Username</label>
              <input type="text" name="username" class="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-accent text-white" value="admin">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Password</label>
              <input type="password" name="password" class="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-accent text-white" value="admin123">
            </div>
            <button type="submit" class="w-full bg-accent hover:opacity-90 text-white py-2 rounded transition duration-200">
              Sign In
            </button>
             <p id="login-error" class="text-red-400 text-sm text-center h-4"></p>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorP = document.getElementById('login-error');
      const formData = new FormData(e.target);
      const credentials = Object.fromEntries(formData.entries());
      
      const success = await this.services.auth.login(credentials.username, credentials.password);
      if (success) {
        this.currentUser = credentials.username;
        this.loadUserEnvironment();
        this.showDesktop();
      } else {
        errorP.textContent = 'Invalid credentials. Please try again.';
      }
    });
  }

  loadUserEnvironment() {
    // Define the path to the user's config file
    const configPath = `/C:/Users/${this.currentUser}/config.json`;
    
    // Read the file from the Virtual File System
    const configFile = this.services.vfs.read(configPath);
    
    // --- THIS IS THE FIX ---
    // First, check if the file object exists and has content
    if (configFile && configFile.content) {
      try {
        const userConfig = JSON.parse(configFile.content);
        
        // Apply user preferences
        document.documentElement.classList.toggle('dark', userConfig.theme === 'dark');
        document.documentElement.style.setProperty('--color-accent', userConfig.accentColor || '#3b82f6');
        
        // Set wallpaper
        const wallpaper = userConfig.wallpaper || '/assets/wallpapers/default.jpg';
        document.body.style.backgroundImage = `url('${wallpaper}')`;
      } catch (e) {
        console.error("Failed to parse user config.json", e);
        alert("There was an error loading your user profile.");
      }
    } else {
      // Handle case where config file is not found
      console.error(`User config file not found at ${configPath}`);
      alert("Could not find your user profile. Loading with default settings.");
    }
  }

  showDesktop() {
    const appElement = document.getElementById('app');
    appElement.innerHTML = ''; // Clear login screen
    appElement.innerHTML = `
      <div class="desktop absolute inset-0">
        <div id="desktopIcons" class="absolute top-0 left-0 w-full h-[calc(100%-56px)] p-4"></div>
      </div>
    `;
    
    this.components.taskbar = new Taskbar(this);
    this.loadDesktopIcons();
  }

  loadDesktopIcons() {
    const desktopPath = `/C:/Users/${this.currentUser}/Desktop`;
    const desktopItems = this.services.vfs.read(desktopPath);
    const desktopIconsElement = document.getElementById('desktopIcons');
    desktopIconsElement.innerHTML = '';
    
    if (desktopItems && desktopItems.children) {
      Object.entries(desktopItems.children).forEach(([name, item]) => {
        const icon = new DesktopIcon(this, name, item, `${desktopPath}/${name}`);
        desktopIconsElement.appendChild(icon.element);
      });
    }
  }

  openSpotlight() {
    if (!this.components.spotlight) {
      this.components.spotlight = new Spotlight(this);
    }
    this.components.spotlight.toggle();
  }

  launchApp(appName, options = {}) {
    if (this.apps[appName]) {
      const AppClass = this.apps[appName];
      const appInstance = new AppClass(this, options);
      appInstance.launch();
    } else {
      console.error(`App not found: ${appName}`);
      alert(`Error: The application "${appName}" could not be found.`);
    }
  }
}