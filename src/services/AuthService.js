/**
 * Manages user authentication and session persistence.
 */
export default class AuthService {
  constructor() {
    this.users = {};
  }

  async loadUsers() {
      if (Object.keys(this.users).length === 0) {
          const response = await fetch('/src/data/defaultUsers.json');
          this.users = await response.json();
      }
  }
  
  async login(username, password) {
    await this.loadUsers();
    if (this.users[username] && this.users[username].password === password) {
      const session = {
        token: this.generateToken(),
        username,
        expires: Date.now() + 3600000 // 1 hour
      };
      sessionStorage.setItem('aura_session', JSON.stringify(session));
      return true;
    }
    return false;
  }
  
  checkSession() {
    const sessionData = sessionStorage.getItem('aura_session');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    if (session && session.expires > Date.now()) {
      return session;
    }
    sessionStorage.removeItem('aura_session');
    return null;
  }
  
  logout() {
    sessionStorage.removeItem('aura_session');
  }
  
  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
}