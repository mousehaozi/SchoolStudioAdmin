import axios from "axios";
import { useUserStore } from "@/stores/user";
import router from "@/router";
import { ElMessage } from "element-plus";

const request = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore();
      userStore.logout();
      router.push("/login");
      ElMessage.error(
        error.response.data?.message || "token无效或已过期，请重新登录"
      );
    }
    return Promise.reject(error);
  }
);

export default request;
