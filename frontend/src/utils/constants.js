let apiRoot = ''
if (import.meta.env.VITE_BUILD_MODE === 'dev')
  apiRoot = 'http://localhost:8017'
else
  apiRoot = ''

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 9

export const API_ROOT = apiRoot

export const PROVINCE_API_ROOT =  'https://provinces.open-api.vn'