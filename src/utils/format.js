import dayjs from "dayjs";

/**
 * @description 格式化日期
 * @param {string} date - 日期字符串
 * @param {string} formatStr - 格式字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, formatStr = "YYYY-MM-DD HH:mm:ss") {
  if (!date) return "";
  return dayjs(date).format(formatStr);
}

export function formatDateTime(date) {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}
