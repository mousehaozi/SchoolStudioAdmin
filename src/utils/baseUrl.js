const resourceBaseUrl = (import.meta.env.VITE_RESOURCE_BASE_URL || "").replace(
  /\/+$/,
  ""
);

const absoluteUrlPattern = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;
const ignoredUrlPattern = /^(?:data|blob):/i;

export function getResourceUrl(url) {
  if (!url || absoluteUrlPattern.test(url) || ignoredUrlPattern.test(url)) {
    return url;
  }

  const resourcePath = `/${url.replace(/^\/+/, "")}`;

  if (
    resourceBaseUrl.startsWith("/") &&
    (resourcePath === resourceBaseUrl ||
      resourcePath.startsWith(`${resourceBaseUrl}/`))
  ) {
    return resourcePath;
  }

  return `${resourceBaseUrl}${resourcePath}`;
}

export function getResourceHtml(html) {
  if (!html) return html;

  return html.replace(/<(img|video|source|iframe)\b[^>]*>/gi, (tag) =>
    tag.replace(
      /\b(src|poster)=(["'])([^"']*)\2/gi,
      (_, attr, quote, url) => `${attr}=${quote}${getResourceUrl(url)}${quote}`
    )
  );
}
