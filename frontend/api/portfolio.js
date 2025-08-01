import axios from 'axios'

const api = axios.create({
  baseURL: 'https://981c4eefa734.ngrok-free.app/api', // 后端地址
})

export function getPortfolio() {
  return api.get('/portfolio')
}

export function addAsset(data) {
  return api.post('/portfolio', data)
}

export function deleteAsset(id) {
  return api.delete(`/portfolio/${id}`)
}

export function getROI() {
  return api.get('/portfolio/roi')
}

export function getPieData() {
  return api.get('/portfolio/chart')
}
