export interface FormData {
  firstName: string
  lastName: string
  encouragement: string
  color: HEX
  dark: string
  light: string
  email: string
  message: string
  gdpr: string
  select: string
  selectmulti: string
  clarification: string
}

export const INITIAL_DATA: FormData = {
  firstName: '',
  lastName: '',
  encouragement: '',
  color: '#FFFFFF',
  dark: '',
  light: '',
  email: '',
  message: '',
  gdpr: '',
  select: '',
  selectmulti: '',
  clarification: '',
}

export type RGB = `rgb(${number}, ${number}, ${number})`
export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
export type HEX = `#${string}`
export type Color = RGB | RGBA | HEX
