export * from "./enum";
import {
  ESearchResultType,
  ESizeUnit,
  EButtonType,
  ERequsetType,
  EAction,
  EDataResultType,
  EUserDataRequestStatus
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
  downloadMethod?: ERequsetType;
  user?: UserInfo;
  selectors?: Dictionary<any>;
  allowGetUserInfo?: boolean;
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
  appendToSearchKeyString?: string;
}

export interface UIOptions {
  paginations?: Dictionary<any>;
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
}
