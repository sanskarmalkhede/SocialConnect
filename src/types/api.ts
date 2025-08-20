export interface APIErrorResponse {
  message: string
  code: string
  status: number
  details?: {
    field: string
    message: string
  }[]
}

export interface APIError extends Error {
  statusCode?: number
  code?: string
  details?: {
    field: string
    message: string
  }[]
}
