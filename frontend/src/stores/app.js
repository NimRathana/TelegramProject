import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light',
    color: localStorage.getItem('color') || '#409eff',
    skin: localStorage.getItem('skin') || 'default',
    layout: localStorage.getItem('layout') || 'Vertical',
    content: localStorage.getItem('content') || 'Compact',
    direction: localStorage.getItem('direction') || 'Left',
  }),

  actions: {
    setTheme(newTheme) {
      this.theme = newTheme
      localStorage.setItem('theme', newTheme)
    },
    setColor(newColor) {
      this.color = newColor
      localStorage.setItem('color', newColor)
    },
    setSkin(newVal){
      this.skin = newVal
      localStorage.setItem('skin', newVal)
    },
    setLayout(newLayout) {
      this.layout = newLayout
      localStorage.setItem('layout', newLayout)
    },
    setContent(newContent){
      this.content = newContent
      localStorage.setItem('content', newContent)
    },
    setDirection(newDirection){
      this.direction = newDirection
      localStorage.setItem('direction', newDirection)
    }
  },
})
