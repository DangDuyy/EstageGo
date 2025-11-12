import { pick } from 'lodash'

export const pickUser = (user) => {
  if (!user) return {}
  return pick(user, [
    '_id', 'email', 'username', 'fullName', 'avatar', 'phone', 'gender', 'address', 'dob', 'role', 'isActive', 'createdAt', 'updatedAt',
    // Agent fields
    'companyName', 'agentTitle', 'bio', 'specializations', 'areasServed', 'experience', 'licenseNumber', 'website', 'socialLinks', 'agentRequestStatus'
  ])
}

export const slugify = (val) => {
  if (!val) return ''
  return String(val)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // remove consecutive hyphens
}

export const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")


export const toArr = (v) => Array.isArray(v) ? v : (v != null ? [v] : [])
export const toNum = (v) => (v !== undefined ? Number(v) : undefined)
export const toStr = (v) => (v !== undefined ? String(v).trim() : undefined)