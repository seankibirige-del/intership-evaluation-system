import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
})

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = callback => {
  refreshSubscribers.push(callback)
}

const onRefreshed = token => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh')
  if (!refresh) throw new Error('No refresh token available')
  const response = await axios.post(`${API.defaults.baseURL}auth/token/refresh/`, { refresh })
  localStorage.setItem('access', response.data.access)
  API.defaults.headers.common.Authorization = `Bearer ${response.data.access}`
  return response.data.access
}

API.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(API(originalRequest))
          })
        })
      }

      isRefreshing = true
      try {
        const access = await refreshToken()
        onRefreshed(access)
        return API(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default API
