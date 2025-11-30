import api from './api';

export const authService = {
  async login(correo, contrasena) {
    const response = await api.post('/auth/login', { correo, password: contrasena });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      // Guardar timestamp de login para validar expiración (8 horas)
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const timestamp = localStorage.getItem('tokenTimestamp');
    
    if (!token || !timestamp) {
      return false;
    }

    // Verificar si han pasado más de 8 horas (28800000 ms)
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const now = Date.now();
    const tokenAge = now - parseInt(timestamp);

    if (tokenAge >= eightHoursInMs) {
      // Token expirado, limpiar localStorage
      this.logout();
      return false;
    }

    return true;
  },

  // Función para verificar cuánto tiempo queda del token
  getTimeRemaining() {
    const timestamp = localStorage.getItem('tokenTimestamp');
    if (!timestamp) return 0;

    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const elapsed = Date.now() - parseInt(timestamp);
    const remaining = eightHoursInMs - elapsed;

    return remaining > 0 ? remaining : 0;
  }
};
