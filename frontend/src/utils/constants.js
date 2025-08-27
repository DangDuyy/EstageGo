let apiRoot = ''
if (import.meta.env.VITE_BUILD_MODE === 'dev')
  apiRoot = 'http://localhost:8017'
else {
  //xu ly sau khi deploy len production
  apiRoot = ''
}

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 9

export const API_ROOT = apiRoot
