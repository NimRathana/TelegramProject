
export const helper = {
  getImageUrl(name) {
    return new URL(`../../assets/${name}`, import.meta.url).href
  }
}
