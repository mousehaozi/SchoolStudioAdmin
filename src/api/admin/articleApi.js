import request from "@/utils/request";

export function getAdminIeArticlesPage(params) {
  return request({
    url: "/admin/ie-article",
    method: "get",
    params,
  });
}

export function createAdminIeArticle(data) {
  return request({
    url: "/admin/ie-article",
    method: "post",
    data,
  });
}

export function updateAdminIeArticle(id, data) {
  return request({
    url: `/admin/ie-article/${id}`,
    method: "put",
    data,
  });
}

export function deleteAdminIeArticle(id) {
  return request({
    url: `/admin/ie-article/${id}`,
    method: "delete",
  });
}

export function setAdminIeArticlePublishStatus(id, publishStatus) {
  return request({
    url: `/admin/ie-article/${id}/publish`,
    method: "post",
    params: { publishStatus },
  });
}
