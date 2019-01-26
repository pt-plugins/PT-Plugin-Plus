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

export enum ESearchResultType {
  JSON = "json",
  XML = "xml",
  HTML = "html"
}
/**
 * 需要在上下文菜单显示配置
 */
export interface ContextMenuRules {
  torrentDetailPages?: string[];
  torrentListPages?: string[];
  torrentLinks?: string[];
}

export enum EDownloadClientType {
  transmission = "transmission",
  utorrent = "utorrent",
  deluge = "deluge",
  synologyDownloadStation = "synologyDownloadStation"
}

export interface DownloadClient {
  id?: string;
  name?: string;
  // oldName?: string;
  address?: string;
  loginName?: string;
  loginPwd?: string;
  paths?: any;
  autoStart?: boolean;
  type?: string;
}

export interface ButtonOption {
  title: string;
  label: string;
  key?: string;
  click?: Function;
  icon?: string;
}

export interface SystemOptions {
  sites?: any[];
  schemas?: any[];
  clients?: any[];
}

export type Dictionary<T> = { [key: string]: T };
export interface SearchOptions {
  rows?: number;
  key?: string;
  tags?: string[];
  timeout?: number;
}

/**
 * 参数
 */
export interface Options {
  autoUpdate?: boolean;
  allowDropToSend?: boolean;
  defaultClient?: any;
  defaultClientId?: string;
  needConfirmWhenExceedSize?: boolean;
  exceedSize?: number;
  exceedSizeUnit?: ESizeUnit;
  sites: any[];
  clients: any[];
  pluginIconShowPages?: string[];
  contextMenuRules?: ContextMenuRules;
  allowSelectionTextSearch?: boolean;
  schemas?: any[];
  system?: SystemOptions;
  search?: SearchOptions | void;
  saveDownloadHistory?: boolean;
  connectClientTimeout?: number;
  rowsPerPageItems?: any[];
  defaultSearchSolutionId?: string;
  searchSolutions?: SearchSolution[];
}

export interface Plugin {
  name?: string;
  pages?: string[] | any;
  scripts?: string[] | any;
  styles?: string[] | any;
  script?: string;
  style?: string;
}

export interface SiteSchema {
  name?: string;
  ver?: string;
  plugins?: Plugin[] | any;
  siteOnly?: boolean;
  securityKeyFields?: string[];
  searchEntry?: SearchEntry[];
  parser?: Dictionary<any>;
  patterns?: Dictionary<any>;
  checker?: Dictionary<any>;
  torrentTagSelectors?: any[];
}

/**
 * 站点资源类别（分类）
 */
export interface SiteCategory {
  id?: number | string;
  name?: string;
}

export interface SiteCategories {
  entry?: string;
  result?: string;
  category?: SiteCategory[];
}

/**
 * 站点配置
 */
export interface Site {
  id?: string;
  name: string;
  url?: string;
  cdn?: string[];
  icon?: string;
  schema?: any;
  tags?: string[];
  passkey?: string;
  value?: boolean;
  description?: string;
  host?: string;
  defaultClientId?: string;
  plugins?: any[];
  allowSearch?: boolean;
  securityKeys?: object;
  searchEntry?: SearchEntry[];
  parser?: Dictionary<any>;
  patterns?: Dictionary<any>;
  checker?: Dictionary<any>;
  torrentTagSelectors?: any[];
  categories?: SiteCategories[];
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
  clearFromGoogle = "clearFromGoogle"
}

export interface Request {
  action: EAction;
  data?: any;
}

export interface NoticeOptions {
  msg?: string;
  type?: string;
  timeout?: number;
  position?: string;
  text?: string;
}

export interface CacheType {
  content?: any;
}

export enum EStorageType {
  text = "TEXT",
  json = "JSON"
}

export enum EConfigKey {
  default = "PT-Plugin-Plus-Config",
  downloadHistory = "PT-Plugin-Plus-downloadHistory",
  systemLogs = "PT-Plugin-Plus-systemLogs",
  uiOptions = "PT-Plugin-Plus-uiOptions",
  cache = "PT-Plugin-Plus-Cache-Contents"
}

/**
 * 下载参数
 */
export interface DownloadOptions {
  url: string;
  title?: string;
  savePath?: string;
  autoStart?: boolean;
  clientId?: string;
}

export enum EDataResultType {
  success = "success",
  error = "error",
  info = "info",
  warning = "warning",
  unknown = "unknown"
}
/**
 * 调用数据返回的结果格式
 */
export interface DataResult {
  // 是否成功
  success: boolean;
  // 成功或失败消息
  msg?: string;
  // 类型
  type?: EDataResultType;
  // 附加数据
  data?: any;
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

export enum ELogEvent {
  init = "init",
  requestMessage = "requestMessage"
}

export interface LogItem {
  module?: string;
  event?: string;
  data?: any;
  id?: number | string;
  time?: number;
  msg?: string;
}

export interface SearchResultItemTag {
  color?: string;
  name?: string;
}

export interface SearchResultItemCategory {
  name?: string;
  link?: string;
}

/**
 * 搜索返回结果
 */
export interface SearchResultItem {
  site: Site;
  title: string;
  titleHTML?: string;
  subTitle?: string;
  time?: number | string;
  author?: string;
  url?: string;
  link?: string;
  size?: number | string;
  seeders?: number | string;
  leechers?: number | string;
  completed?: number | string;
  comments?: number | string;
  uid?: string;
  tags?: SearchResultItemTag[];
  entryName?: string;
  category?: SearchResultItemCategory;
}

export interface SearchEntry {
  name?: string;
  entry?: string;
  resultType?: ESearchResultType;
  parseScriptFile?: string;
  parseScript?: string;
  resultSelector?: string;
  enabled?: boolean;
  tagSelectors?: any[];
  isCustom?: boolean;
  id?: string;
  queryString?: string;
  categories?: string[];
}

export interface UIOptions {
  paginations?: Dictionary<any>;
}

export enum EPaginationKey {
  systemLogs = "systemLogs",
  searchTorrent = "searchTorrent"
}

// 搜索方案
export interface SearchSolution {
  id: string;
  name: string;
  range: SearchSolutionRange[];
}

export interface SearchSolutionRange {
  host?: string;
  siteName?: string;
  entry?: string[];
}
