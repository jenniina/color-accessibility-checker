import api from './api'
import { ELanguages, IResponse } from '../types'
import {
  ColorBlock,
  TColorMode,
} from '../components/AccessibleColors/AccessibleColors'

export type SavedColorPalette = {
  _id?: string
  user: string
  versionName: string
  colors: ColorBlock[]
  currentColor?: string
  mode?: TColorMode | string
  createdAt?: string
  updatedAt?: string
}

const baseUrl = `/colors`

export const getAllColorPalettesByUser = async (
  userId: string,
  language: ELanguages
): Promise<SavedColorPalette[]> => {
  const response = await api.get(`${baseUrl}/${userId}/palettes`, {
    params: { language },
  })
  return response.data as SavedColorPalette[]
}

export const getColorPaletteByUser = async (
  userId: string,
  versionName: string,
  language: ELanguages
): Promise<SavedColorPalette> => {
  const safeName = encodeURIComponent(versionName)
  const response = await api.get(`${baseUrl}/${userId}/palettes/${safeName}`, {
    params: { language },
  })
  return response.data as SavedColorPalette
}

export const saveColorPaletteByUser = async (
  userId: string,
  versionName: string,
  payload: {
    colors: ColorBlock[]
    currentColor?: string
    mode?: TColorMode | string
  },
  language: ELanguages
): Promise<IResponse> => {
  const safeName = encodeURIComponent(versionName)
  const response = await api.post(`${baseUrl}/${userId}/palettes/${safeName}`, {
    ...payload,
    language,
  })
  return response.data as IResponse
}

export const deleteColorPaletteByUser = async (
  userId: string,
  versionName: string,
  language: ELanguages
): Promise<IResponse> => {
  const safeName = encodeURIComponent(versionName)
  const response = await api.delete(
    `${baseUrl}/${userId}/palettes/${safeName}`,
    {
      params: { language },
    }
  )
  return response.data as IResponse
}
