import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3100/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      original?.url &&
      !String(original.url).includes('/auth/refresh') &&
      !String(original.url).includes('/auth/login')
    ) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
