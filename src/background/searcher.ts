import {
  Site,
  SiteSchema,
  Dictionary,
  Options,
  DataResult,
  EDataResultType,
  SearchEntry,
  EModule,
  ERequestResultType
} from "@/interface/common";
import { APP } from "@/service/api";
import { SiteService } from "./site";
import PTPlugin from "./service";

export type SearchConfig = {
  site?: Site;
  entry?: SearchEntry[];
  rootPath?: string;
  torrentTagSelectors?: any[];
};

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

  constructor(public service: PTPlugin) {}

  /**
   * 搜索种子
   * @param site 需要搜索的站点
   * @param key 需要搜索的关键字
   */
  public searchTorrent(site: Site, key: string = ""): Promise<any> {
    console.log("searchTorrent: start");
    return new Promise<any>((resolve?: any, reject?: any) => {
      let result: DataResult = {
        success: false
      };

      let siteServce: SiteService = new SiteService(site, this.options);
      let searchConfig: SearchConfig = {};
      let schema = this.getSiteSchema(site);
      let host = site.host as string;

      if (siteServce.options.searchEntry) {
        searchConfig.rootPath = `sites/${host}/`;
        searchConfig.entry = siteServce.options.searchEntry;
      } else if (schema && schema.searchEntry) {
        searchConfig.rootPath = `schemas/${schema.name}/`;
        searchConfig.entry = schema.searchEntry;
      }

      if (siteServce.options.torrentTagSelectors) {
        searchConfig.torrentTagSelectors =
          siteServce.options.torrentTagSelectors;
      } else if (schema && schema.torrentTagSelectors) {
        searchConfig.torrentTagSelectors = schema.torrentTagSelectors;
      }

      if (!searchConfig.entry) {
        result.msg = `该站点[${site.name}]未配置搜索页面，请先配置`;
        result.type = EDataResultType.error;
        reject(result);
        console.log("searchTorrent: tip");
        return;
      }

      this.searchConfigs[host] = searchConfig;

      let results: any[] = [];
      let entryCount = 0;
      let doneCount = 0;

      searchConfig.entry.forEach((entry: SearchEntry) => {
        // 判断是否指定了搜索页和用于获取搜索结果的脚本
        if (entry.entry && entry.parseScriptFile && entry.enabled !== false) {
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
          if ((entry.entry + "").substr(0, 1) == "/") {
            entry.entry = (entry.entry + "").substr(1);
          }
          let url: string =
            site.url +
            entry.entry +
            (entry.queryString ? `&${entry.queryString}` : "");

          url = this.replaceKeys(url, {
            key:
              key +
              (entry.appendToSearchKeyString
                ? ` ${entry.appendToSearchKeyString}`
                : ""),
            rows: rows,
            passkey: site.passkey ? site.passkey : ""
          });

          entryCount++;

          let scriptPath = entry.parseScriptFile;
          // 判断是否为相对路径
          if (scriptPath.substr(0, 1) !== "/") {
            scriptPath = `${searchConfig.rootPath}${scriptPath}`;
          }

          if (!entry.parseScript) {
            entry.parseScript = this.parseScriptCache[scriptPath];
          }

          if (!entry.parseScript) {
            console.log("searchTorrent: getScriptContent", scriptPath);
            APP.getScriptContent(scriptPath)
              .done((script: string) => {
                console.log("searchTorrent: getScriptContent done", scriptPath);
                this.parseScriptCache[scriptPath] = script;
                entry.parseScript = script;
                this.getSearchResult(
                  url,
                  site,
                  entry,
                  searchConfig.torrentTagSelectors
                )
                  .then((result: any) => {
                    console.log("searchTorrent: getSearchResult done", url);
                    if (result && result.length) {
                      results.push(...result);
                    }
                    doneCount++;

                    if (doneCount === entryCount || results.length >= rows) {
                      resolve(results.slice(0, rows));
                    }
                  })
                  .catch((result: any) => {
                    console.log(
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
                console.log("searchTorrent: getScriptContent fail", error);
              });
          } else {
            this.getSearchResult(
              url,
              site,
              entry,
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
        result.msg = `该站点[${site.name}]未指定搜索页面，请先指定一个搜索入口`;
        result.type = EDataResultType.error;
        reject(result);
      }

      console.log("searchTorrent: quene done");
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
    console.log("getSearchResult.start", url);
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.searchRequestQueue[url] = $.ajax({
        url: url,
        dataType: "text",
        contentType: "text/plain",
        timeout: (this.options.search && this.options.search.timeout) || 30000
      })
        .done((result: any) => {
          console.log("getSearchResult.done", url);
          delete this.searchRequestQueue[url];
          if (
            (result && (typeof result == "string" && result.length > 100)) ||
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
              reject({
                success: false,
                msg: `[${site.name}]数据解析失败！`
              });
              return;
            }

            const options = {
              results: [],
              responseText: result,
              site,
              resultSelector: entry.resultSelector,
              page,
              entry,
              torrentTagSelectors: torrentTagSelectors,
              errorMsg: "",
              isLogged: false
            };

            // 执行获取结果的脚本
            try {
              if (entry.parseScript) {
                eval(entry.parseScript);
              }
              if (options.errorMsg) {
                reject({
                  success: false,
                  msg: options.errorMsg,
                  data: {
                    site,
                    isLogged: options.isLogged
                  }
                });
              } else {
                resolve(options.results);
              }
            } catch (error) {
              console.error(error);
              reject({
                success: false,
                msg: `[${site.name}]脚本执行出错！`
              });
            }
          } else {
            reject({
              success: false,
              msg: `[${site.name}]没有返回预期的数据。`
            });
          }
        })
        .fail((result: any) => {
          console.log("getSearchResult.fail", url);
          delete this.searchRequestQueue[url];
          reject(result);
        });
    });
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
          msg: `正在取消[${site.host}]的搜索请求`,
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
                  msg: "取消搜索请求失败",
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
    }

    return schema;
  }

  replaceKeys(source: string, keys: Dictionary<any>): string {
    let result: string = source;

    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        const value = keys[key];
        result = result.replace("$" + key + "$", value);
      }
    }
    return result;
  }
}
