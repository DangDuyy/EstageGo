export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}
export const interceptorLoadingElements = (calling) => {
  const elements = document.querySelectorAll('.interceptor-loading')
  for (let i = 0; i < elements.length; i++) {
    if (calling) {
      elements[i].style.setProperty('opacity', '0.5', 'important')
      elements[i].style.setProperty('pointer-events', 'none', 'important')
      elements[i].classList.add('interceptor-loading-active')
    } else {
      elements[i].style.setProperty('opacity', 'initial', 'important')
      elements[i].style.setProperty('pointer-events', 'initial', 'important')
      elements[i].classList.remove('interceptor-loading-active')
    }
  }
}