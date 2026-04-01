import request from "@/utils/request";

export function getAdminIeTopics() {
  return request({
    url: "/admin/ie-topic",
    method: "get",
  });
}

export function createAdminIeTopic(data) {
  return request({
    url: "/admin/ie-topic",
    method: "post",
    data,
  });
}

export function updateAdminIeTopic(id, data) {
  return request({
    url: `/admin/ie-topic/${id}`,
    method: "put",
    data,
  });
}

export function deleteAdminIeTopic(id) {
  return request({
    url: `/admin/ie-topic/${id}`,
    method: "delete",
  });
}

export function setAdminIeTopicEnableStatus(id, enableStatus) {
  return request({
    url: `/admin/ie-topic/${id}/enable`,
    method: "post",
    params: { enableStatus },
  });
}

export function reorderAdminIeTopic(id, sortNo) {
  return request({
    url: `/admin/ie-topic/${id}/reorder`,
    method: "post",
    params: { sortNo },
  });
}
