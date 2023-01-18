/**
 * 体积单位
 */
export enum ESizeUnit {
  ZiB = "ZiB",
  EiB = "EiB",
  PiB = "PiB",
  TiB = "TiB",
  GiB = "GiB",
  MiB = "MiB",
  KiB = "KiB"
}

/**
 * 数据请求类型
 */
export enum ERequestType {
  JSON = "json",
  TEXT = "urlencode"
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
  getIMDbIdFromDouban = "getIMDbIdFromDouban",
  // 从豆瓣查询影片信息
  queryMovieInfoFromDouban = "queryMovieInfoFromDouban",
  // 添加浏览器原生下载
  addBrowserDownloads = "addBrowserDownloads",
  // 验证权限
  checkPermissions = "checkPermissions",
  // 请求用户授权
  requestPermissions = "requestPermissions",
  // 更改语言
  changeLanguage = "changeLanguage",
  // 获取当前语言资源
  getCurrentLanguageResource = "getCurrentLanguageResource",
  // 增加新的语言
  addLanguage = "addLanguage",
  // 替换现有语言
  replaceLanguage = "replaceLanguage",
  // 隐藏指定的消息（用于前端页面）
  hideMessage = "hideMessage",
  // 重置用户数据，可用于恢复用户数据
  resetUserDatas = "resetUserDatas",
  // 备份配置到服务器
  backupToServer = "backupToServer",
  // 从服务器恢复配置
  restoreFromServer = "restoreFromServer",
  // 从服务器获取已备份的列表
  getBackupListFromServer = "getBackupListFromServer",
  // 从服务器删除指定的文件
  deleteFileFromBackupServer = "deleteFileFromBackupServer",
  // 在后台批量下载指定的链接
  sendTorrentsInBackground = "sendTorrentsInBackground",
  // 创建备份文件
  createBackupFile = "createBackupFile",
  // 验证备份数据
  checkBackupData = "checkBackupData",
  // 将种子添加到收藏
  addTorrentToCollection = "addTorrentToCollection",
  // 获取种子收藏
  getTorrentCollections = "getTorrentCollections",
  // 删除种子收藏
  deleteTorrentFromCollention = "deleteTorrentFromCollention",
  // 清除种子收藏
  clearTorrentCollention = "clearTorrentCollention",
  // 获取收藏
  getTorrentCollention = "getTorrentCollention",
  // 获取当前站点指定的选择器配置
  getSiteSelectorConfig = "getSiteSelectorConfig",
  // 重置收藏，可用于恢复收藏
  resetTorrentCollections = "resetTorrentCollections",
  // 获取收藏分组
  getTorrentCollectionGroups = "getTorrentCollectionGroups",
  // 添加收藏分组
  addTorrentCollectionGroup = "addTorrentCollectionGroup",
  // 将当前收藏添加到分组
  addTorrentCollectionToGroup = "addTorrentCollectionToGroup",
  // 更新收藏分组信息
  updateTorrentCollectionGroup = "updateTorrentCollectionGroup",
  // 将收藏从分组中删除
  removeTorrentCollectionFromGroup = "removeTorrentCollectionFromGroup",
  // 删除收藏分组
  removeTorrentCollectionGroup = "removeTorrentCollectionGroup",
  // 更新收藏信息
  updateTorrentCollention = "updateTorrentCollention",
  // 获取所有收藏的链接地址
  getAllTorrentCollectionLinks = "getAllTorrentCollectionLinks",
  // 恢复Cookies
  restoreCookies = "restoreCookies",
  // 重置所有站点图标缓存
  resetFavicons = "resetFavicons",
  // 重置单个站点图标缓存
  resetFavicon = "resetFavicon",
  // 获取备份文件原始数据
  getBackupRawData = "getBackupRawData",
  // 测试备份服务器是否可连接
  testBackupServerConnectivity = "testBackupServerConnectivity",
  // 创建搜索结果快照
  createSearchResultSnapshot = "createSearchResultSnapshot",
  // 加载搜索结果快照
  loadSearchResultSnapshot = "loadSearchResultSnapshot",
  // 获取搜索结果快照内容
  getSearchResultSnapshot = "getSearchResultSnapshot",
  // 删除搜索结果快照
  removeSearchResultSnapshot = "removeSearchResultSnapshot",
  // 清除搜索结果快照
  clearSearchResultSnapshot = "clearSearchResultSnapshot",
  // 重置搜索结果快照
  resetSearchResultSnapshot = "resetSearchResultSnapshot",

  // 创建辅种任务
  createKeepUploadTask = "createKeepUploadTask",
  // 加载辅种任务
  loadKeepUploadTask = "loadKeepUploadTask",
  // 获取辅种任务内容
  getKeepUploadTask = "getKeepUploadTask",
  // 删除辅种任务
  removeKeepUploadTask = "removeKeepUploadTask",
  // 清除辅种任务
  clearKeepUploadTask = "clearKeepUploadTask",
  // 重置辅种任务
  resetKeepUploadTask = "resetKeepUploadTask",
  // 更新辅种任务
  updateKeepUploadTask = "updateKeepUploadTask",

  // 重置下载历史
  resetDownloadHistory = "resetDownloadHistory",

  // 添加调试信息
  pushDebugMsg = "pushDebugMsg",
  updateDebuggerTabId = "updateDebuggerTabId",
  // 获取热门搜索
  getTopSearches = "getTopSearches"
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
  userDatas = "PT-Plugin-Plus-User-Datas",
  collection = "PT-Plugin-Plus-Collection",
  searchResultSnapshot = "PT-Plugin-Plus-SearchResultSnapshot",
  keepUploadTask = "PT-Plugin-Plus-KeepUploadTask"
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
  popup = "popup",
  debugger = "debugger"
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
  home = "home",
  downloadPaths = "downloadPaths",
  searchTorrent = "searchTorrent"
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
  allSite = "__allSite__",
  all = "__all__",
  noGroup = "__noGroup__"
}

/**
 * 插件安装方式
 */
export enum EInstallType {
  // 相当于 zip 解压方式安装
  development = "development",
  normal = "normal",
  // crx 自定义类型，官方api中无此状态
  crx = "crx"
}

// 当点击预选条目时，搜索模式
export enum EBeforeSearchingItemSearchMode {
  id = "id",
  name = "name"
}

// 种子当前状态
export enum ETorrentStatus {
  // 正在下载
  downloading = 1,
  // 正在做种
  sending = 2,
  // 已完成，未做种
  completed = 255,
  // 未活动（曾经下载过，但未完成）
  inactive = 3
}

/**
 * 备份服务器类型
 */
export enum EBackupServerType {
  OWSS = "OWSS",
  WebDAV = "WebDAV"
}

/**
 * 插件显示位置
 */
export enum EPluginPosition {
  left = "left",
  right = "right"
}

/**
 * 相关Wiki链接
 */
export enum EWikiLink {
  faq = "https://github.com/pt-plugins/PT-Plugin-Plus/wiki/frequently-asked-questions"
}

/**
 * 需要恢复的内容
 */
export enum ERestoreContent {
  all = "all",
  options = "options",
  userDatas = "userDatas",
  collection = "collection",
  cookies = "cookies",
  searchResultSnapshot = "searchResultSnapshot",
  keepUploadTask = "keepUploadTask",
  downloadHistory = "downloadHistory"
}

export enum EBrowserType {
  Chrome = "Chrome",
  Firefox = "Firefox"
}

export enum EWorkingStatus {
  success = "success",
  error = "error",
  loading = "loading"
}

export enum EResourceOrderBy {
  time = "time",
  name = "name",
  size = "size"
}

export enum EResourceOrderMode {
  desc = "desc",
  asc = "asc"
}

// 加密方式
export enum EEncryptMode {
  AES = "AES"
}

export enum ERestoreError {
  needSecretKey = "needSecretKey",
  errorSecretKey = "errorSecretKey"
}
