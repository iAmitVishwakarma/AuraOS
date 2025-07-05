export default class MusicPlayer {
  constructor(os, options = {}) {
    this.os = os;
    this.title = 'AuraAMP';
    this.icon = '/assets/icons/music.png';
    this.window = null;
    this.currentTrack = options.file || null;
    this.playlist = [];
    this.isPlaying = false;
    this.audio = new Audio();
    this.currentTime = 0;
    this.duration = 0;
    
    // Load music library
    this.loadMusicLibrary();
  }
  
  launch() {
    this.window = this.os.services.window.createWindow({
      title: this.title,
      icon: this.icon,
      width: 400,
      height: 500,
      content: this.render()
    });
    
    // Add to taskbar
    this.os.components.taskbar.addTaskbarItem(this.window);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up audio event listeners
    this.setupAudioListeners();
  }
  
  render() {
    const currentTrackName = this.currentTrack ? this.getFileName(this.currentTrack) : 'No track selected';
    
    return `
      <div class="music-player h-full flex flex-col bg-gray-800">
        <div class="now-playing bg-gray-900 p-4 flex items-center space-x-4">
          <div class="album-art w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
            <img src="/assets/icons/music-note.png" class="w-8 h-8">
          </div>
          <div class="track-info flex-1 overflow-hidden">
            <h3 class="text-white font-medium truncate">${currentTrackName}</h3>
            <p class="text-gray-400 text-sm">${this.getArtist()}</p>
          </div>
        </div>
        
        <div class="progress-bar p-4">
          <div class="time-display flex justify-between text-xs text-gray-400 mb-1">
            <span class="current-time">${this.formatTime(this.currentTime)}</span>
            <span class="duration">${this.formatTime(this.duration)}</span>
          </div>
          <input type="range" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                 min="0" max="100" value="0">
        </div>
        
        <div class="controls flex justify-center items-center space-x-4 p-4">
          <button class="prev p-3 rounded-full bg-gray-700 hover:bg-gray-600">
            <img src="/assets/icons/prev.png" class="w-5 h-5">
          </button>
          <button class="play-pause p-4 rounded-full bg-blue-600 hover:bg-blue-500">
            <img src="/assets/icons/${this.isPlaying ? 'pause' : 'play'}.png" class="w-6 h-6">
          </button>
          <button class="next p-3 rounded-full bg-gray-700 hover:bg-gray-600">
            <img src="/assets/icons/next.png" class="w-5 h-5">
          </button>
        </div>
        
        <div class="playlist flex-1 overflow-y-auto border-t border-gray-700">
          <div class="playlist-header p-2 border-b border-gray-700 bg-gray-900 text-gray-400 text-sm">
            Playlist (${this.playlist.length})
          </div>
          <div class="playlist-items">
            ${this.renderPlaylist()}
          </div>
        </div>
        
        <div class="volume-control p-2 bg-gray-900 flex items-center">
          <img src="/assets/icons/volume.png" class="w-5 h-5 mr-2">
          <input type="range" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                 min="0" max="100" value="100">
        </div>
      </div>
    `;
  }
  
  renderPlaylist() {
    if (this.playlist.length === 0) {
      return '<div class="p-4 text-center text-gray-400">No tracks in playlist</div>';
    }
    
    return this.playlist.map(track => `
      <div class="playlist-item p-3 border-b border-gray-700 flex items-center hover:bg-gray-700 cursor-pointer
                  ${this.currentTrack === track.path ? 'bg-gray-700' : ''}"
           data-path="${track.path}">
        <img src="/assets/icons/music-note.png" class="w-5 h-5 mr-3">
        <div class="flex-1 overflow-hidden">
          <div class="text-white text-sm truncate">${track.name}</div>
          <div class="text-gray-400 text-xs">${track.artist || 'Unknown Artist'}</div>
        </div>
        <div class="text-gray-400 text-xs">${this.formatTime(track.duration || 0)}</div>
      </div>
    `).join('');
  }
  
  loadMusicLibrary() {
    const musicDir = this.os.services.vfs.read(`/Users/${this.os.currentUser}/Music`);
    if (musicDir && musicDir.children) {
      this.playlist = Object.entries(musicDir.children)
        .filter(([_, file]) => file.type === 'file' && 
                (file.content.endsWith('.mp3') || file.content.endsWith('.wav')))
        .map(([name, file]) => ({
          name,
          path: `/Users/${this.os.currentUser}/Music/${name}`,
          artist: file.metadata?.artist || 'Unknown Artist',
          duration: file.metadata?.duration || 0
        }));
      
      if (this.playlist.length > 0 && !this.currentTrack) {
        this.currentTrack = this.playlist[0].path;
      }
    }
  }
  
  setupEventListeners() {
    // Play/pause button
    this.window.element.querySelector('.play-pause').addEventListener('click', () => {
      this.togglePlay();
    });
    
    // Previous track
    this.window.element.querySelector('.prev').addEventListener('click', () => {
      this.prevTrack();
    });
    
    // Next track
    this.window.element.querySelector('.next').addEventListener('click', () => {
      this.nextTrack();
    });
    
    // Progress bar
    const progressBar = this.window.element.querySelector('.progress-bar input');
    progressBar.addEventListener('input', (e) => {
      const percent = e.target.value;
      this.audio.currentTime = (percent / 100) * this.duration;
    });
    
    // Volume control
    const volumeControl = this.window.element.querySelector('.volume-control input');
    volumeControl.addEventListener('input', (e) => {
      this.audio.volume = e.target.value / 100;
    });
    
    // Playlist items
    this.window.element.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', () => {
        this.playTrack(item.dataset.path);
      });
    });
  }
  
  setupAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
      
      const progressPercent = (this.currentTime / this.duration) * 100 || 0;
      this.window.element.querySelector('.progress-bar input').value = progressPercent;
      
      this.window.element.querySelector('.current-time').textContent = this.formatTime(this.currentTime);
      this.window.element.querySelector('.duration').textContent = this.formatTime(this.duration);
    });
    
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });
  }
  
  playTrack(path) {
    const file = this.os.services.vfs.read(path);
    if (file && file.content) {
      this.currentTrack = path;
      this.audio.src = file.content;
      this.audio.play();
      
      // Update UI
      this.window.element.querySelector('.track-info h3').textContent = this.getFileName(path);
      this.window.element.querySelector('.track-info p').textContent = this.getArtist();
      
      // Update playlist highlights
      this.window.element.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.toggle('bg-gray-700', item.dataset.path === path);
      });
    }
  }
  
  togglePlay() {
    if (this.audio.paused) {
      if (this.audio.src) {
        this.audio.play();
      } else if (this.playlist.length > 0) {
        this.playTrack(this.playlist[0].path);
      }
    } else {
      this.audio.pause();
    }
  }
  
  prevTrack() {
    if (this.playlist.length === 0) return;
    
    const currentIndex = this.playlist.findIndex(track => track.path === this.currentTrack);
    const prevIndex = currentIndex <= 0 ? this.playlist.length - 1 : currentIndex - 1;
    this.playTrack(this.playlist[prevIndex].path);
  }
  
  nextTrack() {
    if (this.playlist.length === 0) return;
    
    const currentIndex = this.playlist.findIndex(track => track.path === this.currentTrack);
    const nextIndex = currentIndex >= this.playlist.length - 1 ? 0 : currentIndex + 1;
    this.playTrack(this.playlist[nextIndex].path);
  }
  
  updatePlayButton() {
    const button = this.window.element.querySelector('.play-pause');
    if (button) {
      button.innerHTML = `<img src="/assets/icons/${this.isPlaying ? 'pause' : 'play'}.png" class="w-6 h-6">`;
    }
  }
  
  getFileName(path) {
    return path.split('/').pop();
  }
  
  getArtist() {
    if (!this.currentTrack) return 'Unknown Artist';
    const file = this.os.services.vfs.read(this.currentTrack);
    return file?.metadata?.artist || 'Unknown Artist';
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}