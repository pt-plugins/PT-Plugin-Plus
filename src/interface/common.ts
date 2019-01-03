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
  XML = "xml"
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
  system?: any;
  search?: SearchOptions | void;
  saveDownloadHistory?: boolean;
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
  searchPage?: string;
  searchResultType?: ESearchResultType;
  getSearchResultScript?: string;
}

/**
 * 站点配置
 */
export interface Site {
  id?: string;
  name: string;
  url?: string;
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
}

/**
 * 动作列表
 */
export enum EAction {
  // 读取参数
  readConfig = "readConfig",
  // 保存参数
  saveConfig = "saveConfig",
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
  // 删除下载记录
  removeDownloadHistory = "removeDownloadHistory",
  // 清除下载记录
  clearDownloadHistory = "clearDownloadHistory"
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
  downloadHistory = "PT-Plugin-Plus-downloadHistory"
}

/**
 * 下载参数
 */
export interface DownloadOptions {
  url: string;
  title?: string;
  savePath?: string;
  autoStart?: boolean;
}

/**
 * 下载返回的结果
 */
export interface DownloadResult {
  success: boolean;
  msg?: string;
  type?: string;
  data?: any;
}
