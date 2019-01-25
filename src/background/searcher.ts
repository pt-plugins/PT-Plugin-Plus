import {
  Site,
  SiteSchema,
  Dictionary,
  Options,
  DataResult,
  EDataResultType,
  SearchEntry,
  EModule
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
    return new Promise<any>((resolve?: any, reject?: any) => {
      let result: DataResult = {
        success: false
      };

      let siteServce: SiteService = new SiteService(site, this.options);
      let searchConfig: SearchConfig = {};
      let schema = this.getSiteSchema(site);

      if (siteServce.options.searchEntry) {
        searchConfig.rootPath = `sites/${site.host}/`;
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
        result.msg = "该站点未配置搜索页面，请先配置";
        result.type = EDataResultType.error;
        reject(result);
        return;
      }

      this.searchConfigs[site.host as string] = searchConfig;

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
          let url: string =
            site.url +
            entry.entry +
            (entry.queryString ? `&${entry.queryString}` : "");

          url = this.replaceKeys(url, {
            key: key,
            rows: rows,
            passkey: site.passkey ? site.passkey : ""
          });

          entryCount++;

          if (!entry.parseScript) {
            let scriptPath = entry.parseScriptFile;
            // 判断是否为相对路径
            if (scriptPath.substr(0, 1) !== "/") {
              scriptPath = `${searchConfig.rootPath}${scriptPath}`;
            }
            APP.getScriptContent(scriptPath).done((script: string) => {
              entry.parseScript = script;
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
      this.searchRequestQueue[url] = $.ajax({
        url: url,
        timeout: (this.options.search && this.options.search.timeout) || 30000
      })
        .done((result: any) => {
          delete this.searchRequestQueue[url];
          if (
            (result && (typeof result == "string" && result.length > 100)) ||
            typeof result == "object"
          ) {
            let doc = new DOMParser().parseFromString(result, "text/html");
            // 构造 jQuery 对象
            let page = $(doc).find("body");

            const options = {
              results: [],
              responseText: result,
              site,
              resultSelector: entry.resultSelector,
              page,
              entry,
              torrentTagSelectors: torrentTagSelectors,
              errorMsg: ""
            };

            // 执行获取结果的脚本
            try {
              if (entry.parseScript) {
                eval(entry.parseScript);
              }
              if (options.errorMsg) {
                reject({
                  success: false,
                  msg: options.errorMsg
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
            reject();
          }
        })
        .fail((result: any) => {
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
