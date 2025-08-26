export const OBJECT_ID_RULE = /^[0-9a-fA-F]{24}$/
export const OBJECT_ID_RULE_MESSAGE = 'Your string fails to match the Object Id pattern!'
export const EMAIL_RULE = /^\S+@\S+\.\S+$/
export const EMAIL_RULE_MESSAGE = 'Email is invalid. (example@gmail.com)'
export const PASSWORD_RULE = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d\W]{8,256}$/
export const PASSWORD_RULE_MESSAGE = 'Password must include at least 1 letter, a number, and at least 8 characters.'
export const PHONE_RULE = /^(?:\+84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/
export const PHONE_RULE_MESSAGE = 'Phone number is invalid. (example: 0912345678 or +84912345678)'
