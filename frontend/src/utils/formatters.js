export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

export const formatPostDate = (date, showTime = false) => {
  if (!date) return 'N/A'
  
  const postDate = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now - postDate)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Within 1 week: show relative time
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  }
  
  // After 1 week: show absolute date
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  if (showTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return postDate.toLocaleDateString('en-US', options)
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