// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    session: localStorage.getItem('tg_session') || null,
    user: localStorage.getItem('tg_user') || null
  }),
  actions: {
    setSession(session){
      this.session = session
      localStorage.setItem('tg_session', session)
    },
    setUser(userData) {
      this.user = userData
      localStorage.setItem('tg_user', JSON.stringify(userData))
    },
    clear() {
      this.session = null
      this.user = null
      localStorage.removeItem('tg_session')
      localStorage.removeItem('tg_user')
    }
  },
})
