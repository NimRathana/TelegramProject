import $ from 'jquery'

export const helper = {
  getImageUrl(name) {
    return new URL(`../../assets/${name}`, import.meta.url).href
  },
  getInitials(name) {
    if (!name) return '??'
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  },
}
