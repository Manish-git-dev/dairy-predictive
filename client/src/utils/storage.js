const TOKEN_KEY = 'dairy_predictive_token';
const USER_KEY = 'dairy_predictive_user';

export const storage = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export default storage;
