import request from "@/utils/request";

/**
 * 系统配置列表
 */
export function getAdminSystemConfigs() {
  return request({
    url: "/admin/system-configs",
    method: "get",
  });
}

/**
 * 新增或更新系统配置
 */
export function upsertAdminSystemConfig(data) {
  return request({
    url: "/admin/system-configs",
    method: "post",
    data,
  });
}
