import axios from 'axios'

const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin

export const api = axios.create({
  baseURL: envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : defaultBaseUrl,
  timeout: 20000,
})
