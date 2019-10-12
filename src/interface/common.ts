export * from "./enum";
import {
  ERequestResultType,
  ESizeUnit,
  EButtonType,
  ERequestMethod,
  EAction,
  EDataResultType,
  EUserDataRequestStatus,
  EBeforeSearchingItemSearchMode,
  EBackupServerType,
  EPluginPosition,
  EWorkingStatus
} from "./enum";

/**
 * 需要在上下文菜单显示配置
 */
export interface ContextMenuRules {
  torrentDetailPages?: string[];
  torrentListPages?: string[];
  torrentLinks?: string[];
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

/**
 * 助手按钮
 */
export interface ButtonOption {
  title: string;
  label: string;
  key?: string;
  click?: Function;
  icon?: string;
  type?: EButtonType;
  onDrop?: Function;
}

export interface SystemOptions {
  sites?: any[];
  schemas?: any[];
  clients?: any[];
  publicSites?: any[];
}

export type Dictionary<T> = { [key: string]: T };
export interface SearchOptions {
  rows?: number;
  key?: string;
  tags?: string[];
  timeout?: number;
  saveKey?: boolean;
}

export interface IApiKey {
  omdb?: string[];
  douban?: string[];
}

/**
 * 备份服务器
 */
export interface IBackupServer {
  id: string;
  type: EBackupServerType;
  address: string;
  name: string;
  lastBackupTime?: number;
  loginName?: string;
  loginPwd?: string;
  authCode?: string;
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
  autoRefreshUserData?: boolean;
  autoRefreshUserDataHours?: number | string;
  autoRefreshUserDataMinutes?: number | string;
  autoRefreshUserDataNextTime?: number;
  autoRefreshUserDataLastTime?: number;
  // 自动获取用户数据失败重试次数
  autoRefreshUserDataFailedRetryCount?: number;
  // 自动获取用户数据失败重试间隔时间（分钟）
  autoRefreshUserDataFailedRetryInterval?: number;
  // 最近搜索的关键字
  lastSearchKey?: string;
  // 显示的用名名称
  displayUserName?: string;
  // 分享寄语
  shareMessage?: string;
  // 搜索结果点击站点时，按站点优先级别排序
  searchResultOrderBySitePriority?: boolean;
  // 导航栏是否已打开
  navBarIsOpen?: boolean;
  // 在搜索时显示电影信息（搜索IMDb时有效）
  showMoiveInfoCardOnSearch?: boolean;
  // 在搜索之前一些选项配置
  beforeSearchingOptions?: BeforeSearching;
  // 在页面中显示工具栏
  showToolbarOnContentPage?: boolean;
  // 当前语言
  locale?: string;
  // 下载失败重试后是否重试
  downloadFailedRetry?: boolean;
  // 下载失败重试次数
  downloadFailedFailedRetryCount?: number;
  // 下载失败间隔时间（秒）
  downloadFailedFailedRetryInterval?: number;
  // 用户自定义 API Key 列表
  apiKey?: IApiKey;
  // 备份服务器列表
  backupServers?: IBackupServer[];
  // 批量下载时间间隔（秒）
  batchDownloadInterval?: number;
  // 启用后台批量下载
  enableBackgroundDownload?: boolean;
  // 插件默认显示位置
  position?: EPluginPosition;
  // 默认的收藏分组ID
  defaultCollectionGroupId?: string;
  // 允许备份站点 cookies
  allowBackupCookies?: boolean;
}

// 在搜索之前一些选项配置
export interface BeforeSearching {
  // 在输入搜索关键字时加载相关信息
  getMovieInformation?: boolean;
  // 最多返回条目
  maxMovieInformationCount?: number;
  // 当点击条目时，搜索模式
  searchModeForItem?: EBeforeSearchingItemSearchMode;
}

export interface Plugin {
  id?: string;
  name?: string;
  pages?: string[] | any;
  scripts?: string[] | any;
  styles?: string[] | any;
  script?: string;
  style?: string;
  isCustom?: boolean;
}

export interface SiteSchema {
  name?: string;
  ver?: string;
  plugins?: Plugin[] | any;
  siteOnly?: boolean;
  securityKeyFields?: string[];
  searchEntryConfig?: SearchEntryConfig;
  searchEntry?: SearchEntry[];
  parser?: Dictionary<any>;
  patterns?: Dictionary<any>;
  checker?: Dictionary<any>;
  torrentTagSelectors?: any[];
  selectors?: Dictionary<any>;
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
  appendToSearchKey?: boolean;
  category?: SiteCategory[];
}

/**
 * 站点配置
 */
export interface Site {
  id?: string;
  name: string;
  url?: string;
  // 运行时配置，当定义了cdn时，获取第一个地址，没有时使用url
  activeURL?: string;
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
  searchEntryConfig?: SearchEntryConfig;
  searchEntry?: SearchEntry[];
  parser?: Dictionary<any>;
  patterns?: Dictionary<any>;
  checker?: Dictionary<any>;
  torrentTagSelectors?: any[];
  categories?: SiteCategories[];
  downloadMethod?: ERequestMethod;
  user?: UserInfo;
  selectors?: Dictionary<any>;
  allowGetUserInfo?: boolean;
  // 站点优先级
  priority?: number;
  path?: string;
  // 曾用域名列表，用于数据升级
  formerHosts?: string[];
  // 离线，设置为true时，不再进行搜索和个人信息获取，保存原数据统计
  // todo: 后续可根据站点返回的状态码自动设置为离线
  offline?: boolean;
  // 是否为自定义
  isCustom?: boolean;
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
  indeterminate?: boolean;
}

export interface CacheType {
  content?: any;
}

/**
 * 下载参数
 */
export interface DownloadOptions {
  // 下载地址
  url: string;
  title?: string;
  savePath?: string;
  autoStart?: boolean;
  clientId?: string;
  // 来源链接地址
  link?: string;
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
  // 进度（100表示完成）
  progress?: number;
  // 状态
  status?: number;
}

/**
 * 搜索区域
 */
export interface SearchEntryConfigArea {
  name: string;
  queryString?: string;
  appendQueryString?: string;
  keyAutoMatch?: string;
  replaceKey?: string[];
  parseScript?: string;
}

// 搜索入口默认配置
export interface SearchEntryConfig {
  page: string;
  entry?: string;
  resultType?: ERequestResultType;
  queryString?: string;
  parseScriptFile?: string;
  parseScript?: string;
  resultSelector?: string;
  area?: SearchEntryConfigArea[];
  headers?: Dictionary<any>;
  fieldSelector?: Dictionary<any>;
  // 跳过IMDb搜索
  skipIMDbId?: boolean;
}

export interface SearchEntry {
  name?: string;
  entry?: string;
  resultType?: ERequestResultType;
  parseScriptFile?: string;
  parseScript?: string;
  resultSelector?: string;
  enabled?: boolean;
  tagSelectors?: any[];
  isCustom?: boolean;
  id?: string;
  queryString?: string;
  categories?: string[];
  appendToSearchKeyString?: string;
  headers?: Dictionary<any>;
  appendQueryString?: string;
}

export interface UIOptions {
  paginations?: Dictionary<any>;
  views?: Dictionary<any>;
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

/**
 * 用户信息
 */
export interface UserInfo {
  // 用户ID
  id: number | string;
  // 用户名
  name: string;
  // 上传量
  uploaded?: number;
  // 下载量
  downloaded?: number;
  // 分享率
  ratio?: number;
  // 当前做种数量
  seeding?: number;
  // 做种体积
  seedingSize?: number;
  // 当前下载数量
  leeching?: number;
  // 等级名称
  levelName?: string;
  // 魔力值/积分
  bonus?: number;
  // 入站时间
  joinTime?: number;
  // 最后更新时间
  lastUpdateTime?: number;
  // 最后更新状态
  lastUpdateStatus?: EUserDataRequestStatus;
  // 邀请数量
  invites?: number;
  // 头像
  avatar?: string;
  // 是否已登录
  isLogged?: boolean;
  // 正在加载
  isLoading?: boolean;
  // 最后错误信息
  lastErrorMsg?: string;
  // 消息数量
  messageCount?: number;
  [key: string]: any;
}

export type i18nResource = {
  name: string;
  code: string;
  authors?: Array<string>;
  words: Dictionary<any>;
};

// 搜索时附加数据
export interface ISearchPayload {
  imdbId?: string;
  doubanId?: string;
  cn?: string;
  en?: string;
}

export interface IHashData {
  hash: string;
  keyMap: number[];
  length: number;
}

export interface IManifest {
  checkInfo: IHashData;
  version: string;
  time: number;
  hash?: string;
}

/**
 * 已收藏的种子
 */
export interface ICollection {
  host: string;
  title: string;
  // 下载地址
  url: string;
  // 种子页面链接
  link: string;
  site: any;
  size: number;
  time?: number;
  subTitle?: string;
  movieInfo?: {
    title: string;
    alt_title: string;
    imdbId?: string;
    doubanId?: string;
    image?: string;
    link?: string;
    year?: number;
  };
  // 分组ID列表
  groups?: string[];
}

/**
 * 收藏分组
 */
export interface ICollectionGroup {
  id?: string;
  name: string;
  count?: number;
  description?: string;
  image?: string;
  color?: string;
  update?: number;
}

export const BASE_COLORS = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "blue-grey",
  "grey",
  "black"
];

export interface ICookies {
  host: string;
  url: string;
  cookies: chrome.cookies.Cookie[];
}

export interface IURL {
  href: string;
  protocol: string;
  host: string;
  port?: number;
  query?: string;
  params?: string[];
  hash?: string;
  path: string;
  segments: string;
  origin: string;
}

export interface IWorkingStatusItem {
  key: string;
  status?: EWorkingStatus;
  title: string;
}
