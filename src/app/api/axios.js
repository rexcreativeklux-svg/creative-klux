import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
 
/* ---------- REQUEST INTERCEPTOR ---------- */
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------- RESPONSE INTERCEPTOR ---------- */
let router = null;

export const setAxiosRouter = (r) => {
  router = r;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip redirect for /register endpoint
    // if (
    //   error.response?.status === 401 &&
    //   error.config?.url?.includes("/register")
    // ) {
    //   return Promise.reject(error); // Let the component handle the error
    // }

    // if (error.response?.status === 401) {
    //   localStorage.removeItem("token");
    //   if (router) {
    //     router.replace("/login");
    //   } else {
    //     window.location.href = "/login";
    //   }
    // }
    return Promise.reject(error);
  }
);

export default api;