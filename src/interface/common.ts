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
  EWorkingStatus,
  EEncryptMode,
  ETorrentStatus,
  ERequestType
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
  tagIMDb?: boolean;
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
  digest?: boolean;
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
  // 加密备份的数据
  encryptBackupData?: boolean;
  // 加密密钥，本项内容备份时清除
  encryptSecretKey?: string;
  // 加密方式
  encryptMode?: EEncryptMode;
  // 允许保存搜索结果快照
  allowSaveSnapshot?: boolean;
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
  // 时区偏移量，用于解决时差问题，如：+08:00, -08:00, +0800, UTC+0800, UTC+08:00
  // @see https://zh.wikipedia.org/wiki/各國時區列表
  // @see https://zh.wikipedia.org/wiki/时区
  timezoneOffset?: string;
  // 是否合并 Schema 的标签选择器
  mergeSchemaTagSelectors?: boolean;
  // 消息提醒开关
  disableMessageCount?: boolean;
  // 等级要求
  levelRequirements?: LevelRequirement[];
  upLoadLimit?: number;
}

export interface LevelRequirement {
  level?: number;
  name?: string;
  // 间隔要求
  interval?: number;
  // 日期要求
  requiredDate?: string;
  // 上传数要求
  uploads?: number;
  // 下载数要求
  downloads?: number;
  // 上传量要求
  uploaded?: string | number;
  // 下载量要求
  downloaded?: string | number;
  // 真实下载量
  trueDownloaded?: string | number;
  // 积分要求
  bonus?: number;
  // 做种积分要求
  seedingPoints?: number;
  // 做种时间要求
  seedingTime?: number;
  // 保种体积要求
  seedingSize?: number;
  // 分享率要求
  ratio?: number;
  // 等级积分要求
  classPoints?: number;
  // 独特分组要求
  uniqueGroups?: number;
  // “完美”FLAC要求
  perfectFLAC?: number;
  // 权限
  privilege?: string;
  // 可选要求
  alternative?: LevelRequirement;
}

export interface Request {
  action: EAction;
  data?: any;
}

export interface IRequest extends Request {}

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
  tagIMDb?: boolean;
  clientId?: string;
  // 来源链接地址
  link?: string;
  imdbId?: string;
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
  id?: string;
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
  status?: ETorrentStatus;
  host?: string;
  imdbId?: string;
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
  // 替换默认页面
  page?: string;
}

export interface ISearchFieldIndex {
  // 发布时间
  time?: number;
  // 大小
  size?: number;
  // 上传数量
  seeders?: number;
  // 下载数量
  leechers?: number;
  // 完成数量
  completed?: number;
  // 评论数量
  comments?: number;
  // 发布人
  author?: number;
  // 分类
  category?: number;
  link?: number;
  url?: number;
  subTitle?: number;
  title?: number;
}

/**
 * 通用页面解析
 */
export interface IPageSelector {
  // 需要请求的页面
  page: string;
  // 返回的数据类型，可用值：html，json ；默认为 html
  dataType?: ERequestResultType;
  // 用于解析数据的脚本文件路径；当指定该内容时，则执行该解析器，由解析器处理指定页面返回的内容，可用于请求多个页面等操作；
  parser?: string;
  // 请求方法，默认为 GET
  requestMethod?: ERequestMethod;
  // 数据请求头信息
  headers?: Dictionary<any>;
  // 需要提交的数据
  requestData?: Dictionary<any>;
  // 选择器列表
  fields?: Dictionary<any>;
  // 执行该规则的前提条件（条件表达式），合法的 js 语句；
  prerequisites?: string;
  // 是否合并 schema 已定义的内容，默认为 false
  merge?: boolean;
  // 指定用于获取内容的顶级 DOM 对象，默认为 body
  topElement?: string;
  // 缓存时间，单位：秒，0 及空表示不缓存
  dataCacheTime?: number;
}

// 搜索入口默认配置
export interface SearchEntryConfig {
  page: string;
  entry?: string;
  resultType?: ERequestResultType;
  // don't encode the key, for some json post API. e.g. TNode
  keepOriginKey?: boolean
  requestDataType?: ERequestType;
  queryString?: string;
  parseScriptFile?: string;
  parseScript?: string;
  // 是否异步解析脚本
  asyncParse?: boolean;
  // 数据表选择器
  resultSelector?: string;
  area?: SearchEntryConfigArea[];
  // 数据请求头信息
  headers?: Dictionary<any>;
  // 跳过IMDb搜索
  skipIMDbId?: boolean;
  // 搜索解析字段索引
  fieldIndex?: ISearchFieldIndex;
  // 数据字段选择器
  fieldSelector?: Dictionary<any>;
  // 第一行数据行
  firstDataRowIndex?: number;
  // 数据行选择器，默认：> tbody > tr
  dataRowSelector?: string;
  // 验证已登录正则表达式
  loggedRegex?: string;
  // 在搜索前需要处理的脚本
  beforeSearch?: IPageSelector;
  // 请求方法，默认为 GET
  requestMethod?: ERequestMethod;
  // 需要提交的数据
  requestData?: Dictionary<any>;
}

/**
 * 具体搜索入口配置
 */
export interface SearchEntry extends SearchEntryConfig {
  // 搜索入口名称
  name?: string;
  // 是否启用
  enabled?: boolean;
  // 标签选择器配置
  tagSelectors?: any[];
  // 是否为自定义
  isCustom?: boolean;
  // id，自动生成
  id?: string;
  // 分类目录
  categories?: string[];
  // 追加到搜索关键字的内容
  appendToSearchKeyString?: string;
  // 追加到查询字符串的内容
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
  // 发布数
  uploads?: number;
  // 下载量
  downloaded?: number;
  // 真实下载量
  trueDownloaded?: string | number;
  // 下载数
  downloads?: number;
  // 分享率
  ratio?: number;
  // 当前做种数量
  seeding?: number;
  // 做种体积
  seedingSize?: number;
  // 做种列表
  seedingList?: string[];
  // 当前下载数量
  leeching?: number;
  // 等级名称
  levelName?: string;
  // 魔力值/积分
  bonus?: number;
  // 保种积分         //add by koal 220920
  seedingPoints?: number;
  // 做种时间要求
  seedingTime?: number;
  // 时魔
  bonusPerHour?: number;
  // 积分页面
  bonusPage?: string;
  // H&R未达标页面
  unsatisfiedsPage?: string;
  // 入站时间
  joinTime?: number;
  // 等级积分
  classPoints?: number;
  // H&R未达标
  unsatisfieds?: string | number;
  // H&R预警
  prewarn?: number;
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
  // 独特分组
  uniqueGroups?: number;
  // “完美”FLAC
  perfectFLAC?: number;
  // 下一等级
  nextLevels?: LevelRequirement[];
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
  key?: string;
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
  encryptMode?: EEncryptMode;
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
  imdbId?: string;
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

/**
 * 通用标签颜色
 */
export const BASE_TAG_COLORS: Dictionary<any> = {
  // 免费下载
  Free: "blue",
  // 免费下载 + 2x 上传
  "2xFree": "green",
  // 2x 上传
  "2xUp": "lime",
  // 2x 上传 + 50% 下载
  "2x50%": "light-green",
  // 25% 下载
  "25%": "purple",
  // 30% 下载
  "30%": "indigo",
  // 35% 下载
  "35%": "indigo darken-3",
  // 50% 下载
  "50%": "orange",
  // 70% 下载
  "70%": "blue-grey",
  // 75% 下载
  "75%": "lime darken-3",
  // 仅 VIP 可下载
  VIP: "orange darken-2",
  // 禁止转载
  "⛔️": "deep-orange darken-1"
};

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

export interface ISearchResultSnapshot {
  id: string;
  key: string;
  time: number;
  searchPayload?: ISearchPayload;
  result: SearchResultItem[];
}

export interface IBackupRawData {
  options: any;
  userData: any;
  collection: any;
  cookies?: any;
  searchResultSnapshot?: any;
  keepUploadTask?: any;
  downloadHistory?: any;
}

export interface IKeepUploadTask {
  id: string;
  time: number;
  title: string;
  downloadOptions: DownloadOptions;
  items: any[];
}

export interface ISiteIcon {
  origin: string;
  host: string;
  data: string;
}
