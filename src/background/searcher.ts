import {
  Site,
  SiteSchema,
  Dictionary,
  Options,
  DataResult,
  EDataResultType,
  SearchEntry,
  EModule,
  ERequestResultType,
  SearchEntryConfigArea,
  SearchEntryConfig,
  ISearchPayload,
  SiteCategories,
  SiteCategory,
  ERequestMethod,
  BASE_TAG_COLORS,
  ERequestType
} from "@/interface/common";
import { APP } from "@/service/api";
import { SiteService } from "./site";
import PTPlugin from "./service";
import extend from "extend";
import { InfoParser } from "./infoParser";
import { PPF } from "@/service/public";
import { PageParser } from "./pageParser";

export type SearchConfig = {
  site?: Site;
  entry?: SearchEntry[];
  rootPath?: string;
  torrentTagSelectors?: any[];
};

/**
 * 搜索结果解析状态
 */
export enum ESearchResultParseStatus {
  success = "success",
  needLogin = "needLogin",
  noTorrents = "noTorrents",
  torrentTableIsEmpty = "torrentTableIsEmpty",
  parseError = "parseError"
}

Object.assign(window, {
  ESearchResultParseStatus
});

/**
 * 搜索类
 */
export class Searcher {
  // 搜索入口定义缓存
  private searchConfigs: any = {};
  // 解析文件内容缓存
  private parseScriptCache: any = {};
  public options: Options = {
    sites: [],
    clients: []
  };

  private searchRequestQueue: Dictionary<JQueryXHR> = {};

  constructor(public service: PTPlugin) { }

  /**
   * 搜索种子
   * @param site 需要搜索的站点
   * @param key 需要搜索的关键字
   * @param payload 附加数据
   */
  public searchTorrent(
    site: Site,
    key: string = "",
    payload?: ISearchPayload
  ): Promise<any> {
    this.service.debug("searchTorrent: start", key, payload);
    return new Promise<any>((resolve?: any, reject?: any) => {
      let result: DataResult = {
        success: false
      };

      let siteService: SiteService = new SiteService(
        PPF.clone(site),
        PPF.clone(this.options)
      );
      let searchConfig: SearchConfig = {};
      let schema = this.getSiteSchema(site);
      let host = site.host as string;
      // 当前站点默认搜索页
      let siteSearchPage = "";
      // 当前站点默认搜索配置信息
      let searchEntryConfig: SearchEntryConfig | undefined = extend(
        true,
        {
          torrentTagSelectors: []
        },
        schema && schema.searchEntryConfig ? schema.searchEntryConfig : {},
        siteService.options.searchEntryConfig
      );
      let searchEntryConfigQueryString = "";

      if (siteService.options.searchEntry) {
        searchConfig.rootPath = `sites/${host}/`;
        searchConfig.entry = siteService.options.searchEntry;
      } else if (schema && schema.searchEntry) {
        searchConfig.rootPath = `schemas/${schema.name}/`;
        searchConfig.entry = schema.searchEntry;
      }

      if (schema && schema.torrentTagSelectors) {
        searchConfig.torrentTagSelectors = schema.torrentTagSelectors;
      }

      if (siteService.options.torrentTagSelectors) {
        // 是否合并 Schema 的标签选择器
        if (siteService.options.mergeSchemaTagSelectors) {
          searchConfig.torrentTagSelectors = siteService.options.torrentTagSelectors.concat(
            searchConfig.torrentTagSelectors
          );
        } else {
          searchConfig.torrentTagSelectors =
            siteService.options.torrentTagSelectors;
        }
      }

      if (!searchConfig.entry) {
        result.msg = this.service.i18n.t(
          "service.searcher.siteSearchConfigEntryIsEmpty",
          {
            site
          }
        ); //`该站点[${site.name}]未配置搜索页面，请先配置`;
        result.type = EDataResultType.error;
        reject(result);
        this.service.debug("searchTorrent: tip");
        return;
      }

      // 提取 IMDb 编号，如果带整个网址，则只取编号部分
      let imdb = key.match(/(tt\d+)/);
      let autoMatched = false;
      if (imdb && imdb.length >= 2) {
        key = imdb[1];
      }

      // 将所有 . 替换为空格
      key = key.replace(/\./g, " ");

      // 是否有搜索入口配置项
      if (searchEntryConfig && searchEntryConfig.page) {
        siteSearchPage = searchEntryConfig.page;
        searchEntryConfigQueryString = searchEntryConfig.queryString + "";

        // 搜索区域
        if (searchEntryConfig.area) {
          searchEntryConfig.area.some((area: SearchEntryConfigArea) => {
            // 是否有自动匹配关键字的正则
            if (
              area.keyAutoMatch &&
              new RegExp(area.keyAutoMatch, "").test(key)
            ) {
              // 是否替换默认页面
              if (area.page) {
                siteSearchPage = area.page;
              }
              autoMatched = true;
              // 如果有定义查询字符串，则替换默认的查询字符串
              if (area.queryString) {
                searchEntryConfigQueryString = area.queryString;
              }

              // 追加查询字符串
              if (area.appendQueryString) {
                searchEntryConfigQueryString += area.appendQueryString;
              }

              // 替换关键字
              if (area.replaceKey) {
                key = key.replace(
                  new RegExp(area.replaceKey[0], "g"),
                  area.replaceKey[1]
                );
              }

              // 解析脚本，最终返回搜索关键字，可调用 payload 里的数据进行关键字替换
              if (area.parseScript) {
                try {
                  key = eval(area.parseScript);
                } catch (error) { }
              }

              return true;
            }
            return false;
          });
        }
      }

      this.searchConfigs[host] = searchConfig;

      let results: any[] = [];
      let entryCount = 0;
      let doneCount = 0;

      const KEY = "$key$";
      // for some json post API
      if (!searchEntryConfig.keepOriginKey) {
        // 转换 uri
        key = encodeURIComponent(key);
      }
      // 遍历需要搜索的入口
      searchConfig.entry.forEach((entry: SearchEntry) => {
        let searchPage = entry.entry || siteSearchPage;

        // 当已自动匹配规则时，去除入口页面中已指定的关键字字段
        if (
          autoMatched &&
          searchPage.indexOf(KEY) !== -1 &&
          searchEntryConfigQueryString.indexOf(KEY) !== -1
        ) {
          searchPage = PPF.removeQueryStringFromValue(searchPage, KEY);
        }

        let queryString = entry.queryString;

        if (searchEntryConfigQueryString) {
          // 当前入口没有查询字符串时，尝试使用默认配置
          if (!queryString) {
            queryString = searchEntryConfigQueryString;

            // 当前入口有查询字符串，并且不包含搜索关键字时，使用追加方式
          } else if (queryString && queryString.indexOf(KEY) === -1) {
            queryString = searchEntryConfigQueryString + "&" + queryString;
          }
        }

        if (entry.appendQueryString) {
          queryString += entry.appendQueryString;
        }
        if (searchEntryConfig) {
          entry.parseScriptFile =
            searchEntryConfig.parseScriptFile || entry.parseScriptFile;
          entry.resultType = searchEntryConfig.resultType || entry.resultType;
          entry.requestDataType = searchEntryConfig.requestDataType || entry.requestDataType;
          entry.resultSelector =
            searchEntryConfig.resultSelector || entry.resultSelector;
          entry.headers = searchEntryConfig.headers || entry.headers;
          entry.asyncParse = searchEntryConfig.asyncParse || entry.asyncParse;
          entry.requestData = searchEntryConfig.requestData;
        }

        // 判断是否指定了搜索页和用于获取搜索结果的脚本
        if (searchPage && entry.parseScriptFile && entry.enabled !== false) {
          let rows: number =
            this.options.search && this.options.search.rows
              ? this.options.search.rows
              : 10;

          // 如果有自定义地址，则使用自定义地址
          if (site.cdn && site.cdn.length > 0) {
            site.url = site.cdn[0];
          }

          // 组织搜索入口
          if ((site.url + "").substr(-1) != "/") {
            site.url += "/";
          }
          if ((searchPage + "").substr(0, 1) == "/") {
            searchPage = (searchPage + "").substr(1);
          }
          let url: string = site.url + searchPage;

          if (queryString) {
            if (searchPage.indexOf("?") !== -1) {
              url += "&" + queryString;
            } else {
              url += "?" + queryString;
            }
          }

          // 支除重复的参数
          url = PPF.removeDuplicateQueryString(url);

          let searchKey =
            key +
            (entry.appendToSearchKeyString
              ? ` ${entry.appendToSearchKeyString}`
              : "");
          url = this.replaceKeys(url, {
            key: searchKey,
            rows: rows,
            passkey: site.passkey ? site.passkey : ""
          });

          // 替换要提交数据中包含的关键字内容
          if (entry.requestData) {
            try {
              for (const key in entry.requestData) {
                if (entry.requestData.hasOwnProperty(key)) {
                  const value = entry.requestData[key];
                  if (typeof value !== 'string') continue
                  entry.requestData[key] = PPF.replaceKeys(value, {
                    key: searchKey,
                    passkey: site.passkey ? site.passkey : ""
                  });

                  if (site.user) {
                    entry.requestData[key] = PPF.replaceKeys(
                      entry.requestData[key],
                      site.user,
                      "user"
                    );
                  }
                }
              }
            } catch (error) {
              this.service.writeErrorLog(error);
              this.service.debug(error);
            }
          }
          // 替换要提交请求头中的内容
          if (entry.headers) {
            for (const key in entry.headers) {
              if (entry.headers.hasOwnProperty(key)) {
                const value = entry.headers[key];
                entry.headers[key] = PPF.replaceKeys(value, {
                  key: searchKey,
                  passkey: site.passkey ? site.passkey : ""
                });

                if (site.user) {
                  entry.headers[key] = PPF.replaceKeys(
                    entry.headers[key],
                    site.user,
                    "user"
                  );
                }
              }
            }
          }
          // 替换用户相关信息
          if (site.user) {
            url = this.replaceKeys(url, site.user, "user");
          }

          entryCount++;

          let scriptPath = entry.parseScriptFile;
          // 判断是否为相对路径
          if (scriptPath.substr(0, 1) !== "/") {
            scriptPath = `${searchConfig.rootPath}${scriptPath}`;
          }

          entry.parseScript = this.parseScriptCache[scriptPath];

          if (!entry.parseScript) {
            this.service.debug("searchTorrent: getScriptContent", scriptPath);
            APP.getScriptContent(scriptPath)
              .done((script: string) => {
                this.service.debug(
                  "searchTorrent: getScriptContent done",
                  scriptPath
                );
                this.parseScriptCache[scriptPath] = script;
                entry.parseScript = script;
                this.getSearchResult(
                  url,
                  site,
                  Object.assign(PPF.clone(searchEntryConfig), PPF.clone(entry)),
                  searchConfig.torrentTagSelectors
                )
                  .then((result: any) => {
                    this.service.debug(
                      "searchTorrent: getSearchResult done",
                      url
                    );
                    if (result && result.length) {
                      results.push(...result);
                    }
                    doneCount++;

                    if (doneCount === entryCount || results.length >= rows) {
                      resolve(results.slice(0, rows));
                    }
                  })
                  .catch((result: any) => {
                    this.service.debug(
                      "searchTorrent: getSearchResult catch",
                      url,
                      result
                    );
                    doneCount++;

                    if (doneCount === entryCount) {
                      if (results.length > 0) {
                        resolve(results.slice(0, rows));
                      } else {
                        reject(result);
                      }
                    }
                  });
              })
              .fail(error => {
                this.service.debug(
                  "searchTorrent: getScriptContent fail",
                  error
                );
              });
          } else {
            this.getSearchResult(
              url,
              site,
              Object.assign(PPF.clone(searchEntryConfig), PPF.clone(entry)),
              searchConfig.torrentTagSelectors
            )
              .then((result: any) => {
                if (result && result.length) {
                  results.push(...result);
                }
                doneCount++;

                if (doneCount === entryCount || results.length >= rows) {
                  resolve(results.slice(0, rows));
                }
              })
              .catch((result: any) => {
                doneCount++;

                if (doneCount === entryCount) {
                  if (results.length > 0) {
                    resolve(results.slice(0, rows));
                  } else {
                    reject(result);
                  }
                }
              });
          }
        }
      });

      // 没有指定搜索入口
      if (entryCount == 0) {
        result.msg = this.service.i18n.t(
          "service.searcher.siteSearchEntryIsEmpty",
          {
            site
          }
        ); //`该站点[${site.name}]未指定搜索页面，请先指定一个搜索入口`;
        result.type = EDataResultType.error;
        reject(result);
      }

      this.service.debug("searchTorrent: quene done");
    });
  }

  /**
   * 获取搜索结果
   * @param url
   * @param site
   * @param entry
   * @param torrentTagSelectors
   */
  public getSearchResult(
    url: string,
    site: Site,
    entry: SearchEntry,
    torrentTagSelectors?: any[]
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      // 是否有需要搜索前处理的数据
      if (entry.beforeSearch) {
        let pageParser = new PageParser(
          entry.beforeSearch,
          site,
          this.service.options.connectClientTimeout,
        );
        pageParser
          .getInfos()
          .then(beforeSearchData => {
            this.addSearchRequestQueue(
              url,
              site,
              entry,
              torrentTagSelectors,
              beforeSearchData
            )
              .then(result => {
                resolve(result);
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            this.service.writeErrorLog(error);
            this.addSearchRequestQueue(url, site, entry, torrentTagSelectors)
              .then(result => {
                resolve(result);
              })
              .catch(error => {
                reject(error);
              });
          });
      } else {
        this.addSearchRequestQueue(url, site, entry, torrentTagSelectors)
          .then(result => {
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }

  /**
   * 获取搜索结果
   * @param url
   * @param site
   * @param entry
   * @param torrentTagSelectors
   */
  public addSearchRequestQueue(
    url: string,
    site: Site,
    entry: SearchEntry,
    torrentTagSelectors?: any[],
    beforeSearchData?: any
  ): Promise<any> {
    let _entry = PPF.clone(entry);
    if (_entry.parseScript) {
      delete _entry.parseScript;
    }

    // 是否包含搜索前处理的数据
    if (beforeSearchData) {
      this.service.debug("beforeSearchData", beforeSearchData);
      url = this.replaceKeys(url, beforeSearchData, "beforeSearchData");

      // 替换要提交数据中包含的关键字内容
      if (entry.requestData) {
        try {
          for (const key in entry.requestData) {
            if (entry.requestData.hasOwnProperty(key)) {
              const value = entry.requestData[key];
              entry.requestData[key] = PPF.replaceKeys(
                value,
                beforeSearchData,
                "beforeSearchData"
              );
            }
          }
        } catch (error) {
          this.service.writeErrorLog(error);
          this.service.debug(error);
        }
      }
    }

    this.service.debug("getSearchResult.start", {
      url,
      site: site.host,
      entry: _entry
    });
    let logId = "";
    let contentType = 'text/plain';
    let data: Dictionary<any> | string | undefined = entry.requestData
    switch (entry.requestDataType) {
      case ERequestType.JSON:
        contentType = 'application/json';
        if (data)
          data = JSON.stringify(data);
      case ERequestType.TEXT:
      default:
    }
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.searchRequestQueue[url] = $.ajax({
        url: url,
        cache: true,
        dataType: "text",
        contentType,
        timeout: this.options.connectClientTimeout || 30000,
        headers: entry.headers,
        method: entry.requestMethod || ERequestMethod.GET,
        data
      })
        .done((result: any) => {
          this.service.debug("getSearchResult.done", url);
          delete this.searchRequestQueue[url];
          if (
            (result && typeof result == "string" && result.length > 100) ||
            typeof result == "object"
          ) {
            let page: any;
            let doc: any;
            try {
              switch (entry.resultType) {
                case ERequestResultType.JSON:
                  page = JSON.parse(result);
                  break;

                default:
                  doc = new DOMParser().parseFromString(result, "text/html");
                  // 构造 jQuery 对象
                  page = $(doc).find("body");
                  break;
              }
            } catch (error) {
              logId = this.service.logger.add({
                module: EModule.background,
                event:
                  "service.searcher.getSearchResult.siteSearchResultParseFailed",
                msg: error
              });

              // 数据解析失败
              reject({
                success: false,
                msg: this.service.i18n.t(
                  "service.searcher.siteSearchResultParseFailed",
                  {
                    site
                  }
                ),
                data: {
                  logId
                },
                type: EDataResultType.error
              });
              return;
            }

            let options: any = {
              results: [],
              responseText: result,
              site,
              resultSelector: entry.resultSelector,
              page,
              entry,
              torrentTagSelectors: torrentTagSelectors,
              errorMsg: "",
              isLogged: false,
              status: ESearchResultParseStatus.success,
              searcher: this,
              url
            };

            // 执行获取结果的脚本
            try {
              if (entry.parseScript) {
                // 异步脚本，由脚本负责调用 reject 和 resolve
                if (entry.asyncParse) {
                  options = Object.assign(
                    {
                      reject,
                      resolve
                    },
                    options
                  );
                  eval(entry.parseScript);
                  return;
                } else {
                  eval(entry.parseScript);
                }
              }
              if (
                options.errorMsg ||
                options.status != ESearchResultParseStatus.success
              ) {
                reject({
                  success: false,
                  msg: this.getErrorMessage(
                    site,
                    options.status,
                    options.errorMsg
                  ),
                  data: {
                    site,
                    isLogged: options.isLogged
                  }
                });
              } else {
                resolve(PPF.clone(options.results));
              }
            } catch (error) {
              console.error(error);
              logId = this.service.logger.add({
                module: EModule.background,
                event: "service.searcher.getSearchResult.siteEvalScriptFailed",
                msg: error
              });
              // 脚本执行出错
              reject({
                success: false,
                msg: this.service.i18n.t(
                  "service.searcher.siteEvalScriptFailed",
                  {
                    site
                  }
                ),
                data: {
                  logId
                }
              });
            }
          } else {
            logId = this.service.logger.add({
              module: EModule.background,
              event: "service.searcher.getSearchResult.siteSearchResultError",
              msg: result
            });
            // 没有返回预期的数据
            reject({
              success: false,
              msg: this.service.i18n.t(
                "service.searcher.siteSearchResultError",
                {
                  site
                }
              ),
              data: {
                logId
              },
              type: EDataResultType.error
            });
          }
        })
        .fail((jqXHR, textStatus, errorThrown) => {
          delete this.searchRequestQueue[url];

          this.service.debug({
            title: "getSearchResult.fail",
            url,
            entry,
            textStatus,
            errorThrown
          });
          logId = this.service.logger.add({
            module: EModule.background,
            event: "service.searcher.getSearchResult.fail",
            msg: errorThrown,
            data: {
              url,
              entry,
              code: jqXHR.status,
              textStatus,
              errorThrown,
              responseText: jqXHR.responseText
            }
          });

          // 网络请求失败
          reject({
            data: {
              logId,
              textStatus
            },
            msg: this.service.i18n.t("service.searcher.siteNetworkFailed", {
              site,
              msg: `${jqXHR.status} ${errorThrown}, ${textStatus}`
            }),
            success: false,
            type: EDataResultType.error
          });
        });
    });
  }

  /**
   * 根据错误代码获取错误信息
   * @param code
   */
  public getErrorMessage(
    site: Site,
    status: ESearchResultParseStatus = ESearchResultParseStatus.success,
    msg: string = ""
  ): string {
    if (status != ESearchResultParseStatus.success) {
      return this.service.i18n.t(`contentPage.search.${status}`, {
        siteName: site.name,
        msg
      });
    }
    return msg;
  }

  /**
   * 取消正在执行的搜索请求
   * @param site
   * @param key
   */
  public abortSearch(site: Site, key: string = ""): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let host = site.host + "";
      let searchConfig: SearchConfig = this.searchConfigs[host];

      if (searchConfig.entry) {
        this.service.logger.add({
          module: EModule.background,
          event: "searcher.abortSearch",
          msg: this.service.i18n.t("service.searcher.siteAbortSearch", {
            site
          }), //`正在取消[${site.host}]的搜索请求`,
          data: {
            site: site.host,
            key: key
          }
        });
        searchConfig.entry.forEach((entry: SearchEntry) => {
          // 判断是否指定了搜索页和用于获取搜索结果的脚本
          if (entry.entry && entry.parseScriptFile && entry.enabled !== false) {
            // 如果有自定义地址，则使用自定义地址
            if (site.cdn && site.cdn.length > 0) {
              site.url = site.cdn[0];
            }

            let rows: number =
              this.options.search && this.options.search.rows
                ? this.options.search.rows
                : 10;
            let url: string = site.url + entry.entry;

            url = this.replaceKeys(url, {
              key: key,
              rows: rows,
              passkey: site.passkey ? site.passkey : ""
            });
            let queue = this.searchRequestQueue[url];
            if (queue) {
              try {
                queue.abort();
                resolve();
              } catch (error) {
                this.service.logger.add({
                  module: EModule.background,
                  event: "searcher.abortSearch.error",
                  msg: this.service.i18n.t(
                    "service.searcher.siteAbortSearchError",
                    {
                      site
                    }
                  ), // "取消搜索请求失败",
                  data: {
                    site: site.host,
                    key: key,
                    error
                  }
                });
                reject(error);
              }
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        });
      }
    });
  }

  /**
   * 根据指定的站点获取站点的架构信息
   * @param site 站点信息
   */
  getSiteSchema(site: Site): SiteSchema {
    let schema: SiteSchema = {};
    if (typeof site.schema === "string") {
      schema =
        this.options.system &&
        this.options.system.schemas &&
        this.options.system.schemas.find((item: SiteSchema) => {
          return item.name == site.schema;
        });

      if (schema === undefined) {
        return schema;
      }
    }

    return PPF.clone(schema);
  }

  /**
   * 替换指定的字符串列表
   * @param source
   * @param keys
   */
  replaceKeys(
    source: string,
    keys: Dictionary<any>,
    prefix: string = ""
  ): string {
    let result: string = source;

    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        const value = keys[key];
        let search = "$" + key + "$";
        if (prefix) {
          search = `$${prefix}.${key}$`;
        }
        result = result.replace(search, value);
      }
    }
    return result;
  }

  /**
   * 从当前行中获取指定字段的值
   * @param site 当前站点
   * @param row 当前行
   * @param fieldName 字段名称
   * @return null 表示没有获取到内容
   */
  public getFieldValue(
    site: Site,
    row: JQuery<HTMLElement>,
    fieldName: string = ""
  ) {
    let selector: any;
    if (site.searchEntryConfig && site.searchEntryConfig.fieldSelector) {
      selector = site.searchEntryConfig.fieldSelector[fieldName];

      if (!selector) {
        return null;
      }
    } else {
      return null;
    }

    const parser = new InfoParser(this.service);
    return parser.getFieldData(
      row,
      selector,
      site.searchEntryConfig.fieldSelector
    );
  }

  /**
   * 根据指定信息获取分类
   * @param site 站点
   * @param page 当前搜索页面
   * @param id 分类ID
   */
  public getCategoryById(site: Site, page: string, id: string) {
    let result = {};
    if (site.categories) {
      site.categories.forEach((item: SiteCategories) => {
        if (
          item.category &&
          (item.entry == "*" || page.indexOf(item.entry as string))
        ) {
          let category = item.category.find((c: SiteCategory) => {
            return c.id == id;
          });

          if (category) {
            result = category;
          }
        }
      });
    }
    return result;
  }

  /**
   * cloudflare Email 解码方法，来自 https://usamaejaz.com/cloudflare-email-decoding/
   * @param {*} encodedString
   */
  public cfDecodeEmail(encodedString: string) {
    let email = "",
      r = parseInt(encodedString.substr(0, 2), 16),
      n,
      i;
    for (n = 2; encodedString.length - n; n += 2) {
      i = parseInt(encodedString.substr(n, 2), 16) ^ r;
      email += String.fromCharCode(i);
    }
    return email;
  }

  /**
   * 获取指定站点当前行标签列表
   * @param site
   * @param row
   */
  public getRowTags(site: Site, row: JQuery<HTMLElement>) {
    let tags: {}[] = [];
    if (site && site.host) {
      let config = this.searchConfigs[site.host];
      let selectors = config.torrentTagSelectors;

      if (selectors && selectors.length > 0) {
        selectors.forEach((item: any) => {
          if (item.selector) {
            let result = row.find(item.selector);
            if (result.length) {
              let color = item.color || BASE_TAG_COLORS[item.name] || "";

              let data: Dictionary<any> = {
                name: item.name,
                color
              };

              if (item.title && result.attr(item.title)) {
                data.title = result.attr(item.title);
              }
              tags.push(data);
            }
          }
        });
      }
    }
    return tags;
  }
}
