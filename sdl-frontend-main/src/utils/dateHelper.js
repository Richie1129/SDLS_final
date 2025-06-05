/**
 * 格式化日期為可讀的字符串
 * @param {Date} date - 要格式化的日期
 * @param {string} locale - 語言代碼 (默認: 'zh-TW')
 * @returns {string} 格式化的日期字符串
 */
export function formatDate(date, locale = 'zh-TW') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '無效日期'
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
}

/**
 * 計算兩個日期之間的天數差
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {number} 天數差 (正數表示 endDate 在 startDate 之後)
 */
export function daysBetween(startDate, endDate) {
  if (!startDate || !endDate || 
      !(startDate instanceof Date) || !(endDate instanceof Date) ||
      isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0
  }
  
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * 檢查日期是否為今天
 * @param {Date} date - 要檢查的日期
 * @returns {boolean} 是否為今天
 */
export function isToday(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }
  
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

/**
 * 獲取相對時間描述
 * @param {Date} date - 要比較的日期
 * @returns {string} 相對時間描述
 */
export function getRelativeTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '無效日期'
  }
  
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 1) {
    return '剛剛'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`
  } else if (diffInHours < 24) {
    return `${diffInHours} 小時前`
  } else if (diffInDays < 7) {
    return `${diffInDays} 天前`
  } else {
    return formatDate(date)
  }
} 