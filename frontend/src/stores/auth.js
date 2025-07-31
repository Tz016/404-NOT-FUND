// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('pm_user')) || null, // { name: 'xxx' } or null
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    username: (state) => state.user?.name || '',
  },
  actions: {
    login(name) {
      this.user = { name }
      localStorage.setItem('pm_user', JSON.stringify(this.user))
    },
    logout() {
      this.user = null
      localStorage.removeItem('pm_user')
    },
  },
})
