/**
 * Spotlight provides a system-wide universal search functionality.
 * It can be triggered by a keyboard shortcut (Ctrl+Space) to find and launch
 * applications and files quickly.
 */
export default class Spotlight {
  constructor(os) {
    this.os = os;
    this.element = null;
    this.input = null;
    this.resultsContainer = null;
    this.isVisible = false;
    this.selectedIndex = -1;
    this.results = [];

    this.create();
  }

  /**
   * Creates the Spotlight DOM elements and appends them to the body.
   * Initially hidden.
   */
  create() {
    this.element = document.createElement('div');
    this.element.className = 'spotlight-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex justify-center items-start pt-32 transition-opacity duration-300 opacity-0 pointer-events-none';
    this.element.innerHTML = `
      <div class="spotlight-container w-full max-w-xl bg-gray-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-700/50 overflow-hidden">
        <div class="search-bar flex items-center p-3 border-b border-gray-700/50">
          <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" class="spotlight-input w-full bg-transparent text-white text-xl placeholder-gray-500 focus:outline-none" placeholder="Search AuraOS...">
        </div>
        <div class="spotlight-results max-h-80 overflow-y-auto"></div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.input = this.element.querySelector('.spotlight-input');
    this.resultsContainer = this.element.querySelector('.spotlight-results');

    this.addEventListeners();
  }

  /**
   * Adds event listeners for input, keyboard navigation, and closing the UI.
   */
  addEventListeners() {
    this.input.addEventListener('input', () => this.performSearch());
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.hide();
      }
    });
  }

  /**
   * Toggles the visibility of the Spotlight search UI.
   */
  toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  /**
   * Shows the Spotlight UI with a fade-in animation and focuses the input.
   */
  show() {
    this.isVisible = true;
    this.element.classList.remove('pointer-events-none');
    anime({
      targets: this.element,
      opacity: 1,
      duration: 200,
      easing: 'easeOutQuad'
    });
    this.input.focus();
  }

  /**
   * Hides the Spotlight UI, clears the input and results.
   */
  hide() {
    this.isVisible = false;
    this.element.classList.add('pointer-events-none');
    anime({
      targets: this.element,
      opacity: 0,
      duration: 200,
      easing: 'easeInQuad',
      complete: () => {
        this.input.value = '';
        this.resultsContainer.innerHTML = '';
        this.selectedIndex = -1;
      }
    });
  }

  /**
   * Performs a search based on the current input value, looking through
   * apps and the virtual file system.
   */
  performSearch() {
    const query = this.input.value.toLowerCase().trim();
    if (!query) {
      this.resultsContainer.innerHTML = '';
      return;
    }

    this.results = [];

    // 1. Search Applications
    for (const appName in this.os.apps) {
      if (appName.toLowerCase().includes(query)) {
        this.results.push({
          type: 'App',
          name: appName.charAt(0).toUpperCase() + appName.slice(1),
          path: appName,
          icon: `/assets/icons/${appName}.png`
        });
      }
    }

    // 2. Search Filesystem (recursively)
    const userPath = `/C:/Users/${this.os.currentUser}`;
    this.searchDirectory(userPath, query);

    this.renderResults();
  }

  /**
   * Recursively searches a directory in the VFS for matching files/folders.
   * @param {string} path - The directory path to search in.
   * @param {string} query - The search query.
   */
  searchDirectory(path, query) {
    const dir = this.os.services.vfs.read(path);
    if (!dir || dir.type !== 'dir' || !dir.children) return;

    for (const itemName in dir.children) {
      const itemPath = `${path}/${itemName}`;
      if (itemName.toLowerCase().includes(query)) {
        const item = dir.children[itemName];
        this.results.push({
          type: item.type === 'dir' ? 'Folder' : 'File',
          name: itemName,
          path: itemPath,
          icon: item.type === 'dir' ? '/assets/icons/folder.png' : '/assets/icons/file.png'
        });
      }

      // Recurse into subdirectories
      if (dir.children[itemName].type === 'dir') {
        this.searchDirectory(itemPath, query);
      }
    }
  }

  /**
   * Renders the search results to the DOM.
   */
  renderResults() {
    this.resultsContainer.innerHTML = '';
    this.selectedIndex = -1;

    if (this.results.length === 0) {
      this.resultsContainer.innerHTML = `<div class="p-4 text-center text-gray-400">No results found.</div>`;
      return;
    }

    this.results.forEach((result, index) => {
      const resultEl = document.createElement('div');
      resultEl.className = 'spotlight-result flex items-center p-3 mx-2 my-1 rounded-md cursor-pointer hover:bg-accent';
      resultEl.dataset.index = index;
      resultEl.innerHTML = `
        <img src="${result.icon}" class="w-8 h-8 mr-4">
        <div class="flex-1">
          <div class="text-white font-medium">${result.name}</div>
          <div class="text-gray-400 text-xs">${result.type} &middot; ${result.path}</div>
        </div>
      `;

      resultEl.addEventListener('click', () => this.actionResult(index));
      this.resultsContainer.appendChild(resultEl);
    });
  }

  /**
   * Handles keyboard events for navigation (up/down arrows) and selection (Enter).
   * @param {KeyboardEvent} e - The keyboard event.
   */
  handleKeyDown(e) {
    const items = this.resultsContainer.querySelectorAll('.spotlight-result');
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % items.length;
        this.updateSelection(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
        this.updateSelection(items);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex !== -1) {
          this.actionResult(this.selectedIndex);
        } else {
          // If nothing is selected, action the first result
          this.actionResult(0);
        }
        break;
      case 'Escape':
        this.hide();
        break;
    }
  }

  /**
   * Updates the visual selection in the results list based on the selectedIndex.
   * @param {NodeListOf<Element>} items - The list of result elements.
   */
  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('bg-accent', index === this.selectedIndex);
    });
    items[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Executes the action associated with a selected result.
   * @param {number} index - The index of the result to action.
   */
  actionResult(index) {
    const result = this.results[index];
    if (!result) return;

    switch (result.type) {
      case 'App':
        this.os.launchApp(result.path);
        break;
      case 'Folder':
        this.os.launchApp('explorer', { path: result.path });
        break;
      case 'File':
        // Basic logic: open text files in Notepad. Could be expanded.
        if (result.name.endsWith('.txt')) {
            this.os.launchApp('notepad', { file: result.path });
        } else {
            alert(`No default application for "${result.name}"`);
        }
        break;
    }
    this.hide();
  }
}