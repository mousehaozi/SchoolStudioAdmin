import request from "@/utils/request";

export function adminLogin(data) {
  return request({
    url: "/auth/login",
    method: "post",
    data,
  });
}
