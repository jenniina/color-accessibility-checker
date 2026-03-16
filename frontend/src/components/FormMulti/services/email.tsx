import { FormData } from '../types'
import { IResponse } from '../../../types'
import api from '../../../services/api'

export const sendEmail = async (data: FormData): Promise<IResponse> => {
  const response = await api.post(`/send-email-form`, data)
  return response.data as IResponse
}
