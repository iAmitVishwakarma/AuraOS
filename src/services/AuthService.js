export default class AuthService {
  constructor() {
    this.users = {
      admin: { password: 'admin123', role: 'admin' },
      guest: { password: 'guest123', role: 'guest' }
    };
  }
  
  login(username, password) {
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
    const session = JSON.parse(sessionStorage.getItem('aura_session'));
    if (session && session.expires > Date.now()) {
      return session;
    }
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