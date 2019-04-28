/**
 * 体积单位
 */
export enum ESizeUnit {
  TiB = "TiB",
  PiB = "PiB",
  GiB = "GiB",
  MiB = "MiB",
  KiB = "KiB"
}

/**
 * 数据请求返回类型
 */
export enum ERequestResultType {
  JSON = "json",
  XML = "xml",
  HTML = "html",
  TEXT = "text"
}

/**
 * 下载服务器（客户端）类型
 */
export enum EDownloadClientType {
  transmission = "transmission",
  utorrent = "utorrent",
  deluge = "deluge",
  synologyDownloadStation = "synologyDownloadStation",
  rutorrent = "rutorrent",
  qbittorrent = "qbittorrent"
}

/**
 * 助手按钮类型
 */
export enum EButtonType {
  normal = "normal",
  label = "label",
  spliter = "spliter",
  popup = "popup"
}

/**
 * 请求类型
 */
export enum ERequestMethod {
  POST = "POST",
  GET = "GET"
}

/**
 * 动作列表
 */
export enum EAction {
  // 读取参数
  readConfig = "readConfig",
  // 保存参数
  saveConfig = "saveConfig",
  // 从网络中重新加载配置文件
  reloadConfig = "reloadConfig",
  // 发送种子到默认的下载服务器（客户端）
  sendTorrentToDefaultClient = "sendTorrentToDefaultClient",
  // 发送种子到指定的客户端
  sendTorrentToClient = "sendTorrentToClient",
  // 搜索种子
  searchTorrent = "searchTorrent",
  // 复制文本到剪切板
  copyTextToClipboard = "copyTextToClipboard",
  // 从指定的URL添加种子
  addTorrentFromURL = "addTorrentFromURL",
  // 获取可用空间
  getFreeSpace = "getFreeSpace",
  // 下载当前拖放DOM中的地址
  downloadFromDroper = "downloadFromDroper",
  // 打开配置页面
  openOptions = "openOptions",
  // 更新配置页面TabId
  updateOptionsTabId = "updateOptionsTabId",
  // 获取搜索结果
  getSearchResult = "getSearchResult",
  // 获取下载记录
  getDownloadHistory = "getDownloadHistory",
  // 删除指定的下载记录
  removeDownloadHistory = "removeDownloadHistory",
  // 清除下载记录
  clearDownloadHistory = "clearDownloadHistory",
  // 测试下载服务器是否可连接
  testClientConnectivity = "testClientConnectivity",
  // 获取系统日志
  getSystemLogs = "getSystemLogs",
  // 删除指定的系统日志
  removeSystemLogs = "removeSystemLogs",
  // 清除系统日志
  clearSystemLogs = "clearSystemLogs",
  // 读取UI参数
  readUIOptions = "readUIOptions",
  // 保存UI参数
  saveUIOptions = "saveUIOptions",
  // 在当前选项卡显示消息
  showMessage = "showMessage",
  // 写入日志
  writeLog = "writeLog",
  // 后台服务停止
  serviceStoped = "serviceStoped",
  // 增加内容页面
  addContentPage = "addContentPage",
  // 取消搜索
  abortSearch = "abortSearch",
  // 将参数备份至Google
  backupToGoogle = "backupToGoogle",
  // 从Google恢复已备份的参数
  restoreFromGoogle = "restoreFromGoogle",
  // 从Google中清除已备份的参数
  clearFromGoogle = "clearFromGoogle",
  // 获取种子数据
  getTorrentDataFromURL = "getTorrentDataFromURL",
  // 获取用户信息
  getUserInfo = "getUserInfo",
  // 取消获取用户信息请求
  abortGetUserInfo = "abortGetUserInfo",
  // 刷新用户数据
  refreshUserData = "refreshUserData",
  // 获取已清理过的配置
  getClearedOptions = "getClearedOptions",
  // 重置运行时配置
  resetRunTimeOptions = "resetRunTimeOptions",
  // 根据指定的图片地址获取Base64信息
  getBase64FromImageUrl = "getBase64FromImageUrl",
  // 获取用户历史数据
  getUserHistoryData = "getUserHistoryData",
  // 获取电影信息
  getMovieInfos = "getMovieInfos",
  // 获取电影评分信息
  getMovieRatings = "getMovieRatings",
  // 根据指定的 doubanId 获取 IMDbId
  getIMDbIdFromDouban = "getIMDbIdFromDouban"
}

/**
 * 数据保存类型
 */
export enum EStorageType {
  text = "TEXT",
  json = "JSON"
}

/**
 * 参数配置键值
 */
export enum EConfigKey {
  default = "PT-Plugin-Plus-Config",
  downloadHistory = "PT-Plugin-Plus-downloadHistory",
  systemLogs = "PT-Plugin-Plus-systemLogs",
  uiOptions = "PT-Plugin-Plus-uiOptions",
  cache = "PT-Plugin-Plus-Cache-Contents",
  userDatas = "PT-Plugin-Plus-User-Datas"
}

/**
 * 数据返回类型
 */
export enum EDataResultType {
  success = "success",
  error = "error",
  info = "info",
  warning = "warning",
  unknown = "unknown"
}

/**
 * 模块名称
 */
export enum EModule {
  background = "background",
  content = "content",
  options = "options",
  popup = "popup"
}

/**
 * 日志事件
 */
export enum ELogEvent {
  init = "init",
  requestMessage = "requestMessage"
}

export enum EPaginationKey {
  systemLogs = "systemLogs",
  searchTorrent = "searchTorrent"
}

export enum EViewKey {
  home = "home"
}

/**
 * 用户数据范围
 */
export enum EUserDataRange {
  latest = "latest",
  today = "today",
  all = "all"
}

/**
 * 用户数据请求返回状态
 */
export enum EUserDataRequestStatus {
  needLogin = "needLogin",
  notSupported = "notSupported",
  unknown = "unknown",
  success = "success"
}

/**
 * 公用的一些键值
 */
export enum ECommonKey {
  allSite = "__allSite__"
}

/**
 * 插件安装方式
 */
export enum EInstallType {
  development = "development",
  normal = "normal"
}
