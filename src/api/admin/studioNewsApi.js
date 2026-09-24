import request from "@/utils/request";

export function getAdminStudioNewsPage(params) {
  return request({
    url: "/admin/studio-news",
    method: "get",
    params,
  });
}

export function createAdminStudioNews(data, studioId) {
  return request({
    url: "/admin/studio-news",
    method: "post",
    params: { studioId },
    data,
  });
}

export function importAdminWechatArticle(url) {
  return request({
    url: "/admin/studio-news/import/wechat",
    method: "post",
    data: { url },
    timeout: 60000,
  });
}

export function updateAdminStudioNews(id, data) {
  return request({
    url: `/admin/studio-news/${id}`,
    method: "put",
    data,
  });
}

export function deleteAdminStudioNews(id) {
  return request({
    url: `/admin/studio-news/${id}`,
    method: "delete",
  });
}

export function setAdminStudioNewsPublishStatus(id, publishStatus) {
  return request({
    url: `/admin/studio-news/${id}/publish`,
    method: "post",
    params: { publishStatus },
  });
}

export function setAdminStudioNewsEnableStatus(id, enableStatus) {
  return request({
    url: `/admin/studio-news/${id}/enable`,
    method: "post",
    params: { enableStatus },
  });
}
