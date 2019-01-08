import {
  Site,
  SiteSchema,
  Dictionary,
  Options,
  DataResult,
  EDataResultType,
  SearchEntry
} from "@/interface/common";
import { APP } from "@/service/api";

export type SearchConfig = {
  site?: Site;
  entry?: SearchEntry[];
  rootPath?: string;
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

      let host = site.host + "";
      let searchConfig: SearchConfig = this.searchConfigs[host];
      let schema = this.getSiteSchema(site);

      if (!searchConfig) {
        searchConfig = {
          site,
          rootPath: ""
        };

        if (site.searchEntry) {
          searchConfig.rootPath = `sites/${site.host}/`;
          searchConfig.entry = site.searchEntry;
        } else if (schema && schema.searchEntry) {
          searchConfig.rootPath = `schemas/${schema.name}/`;
          searchConfig.entry = schema.searchEntry;
        }

        if (!searchConfig.entry) {
          result.msg = "该站点未配置搜索页面，请先配置";
          result.type = EDataResultType.error;
          reject(result);
          return;
        }

        this.searchConfigs[host] = searchConfig;
      }

      if (!searchConfig) {
        result.msg = "该站点搜索入口未配置，请先配置";
        result.type = EDataResultType.error;
        reject(result);
        return;
      }

      if (searchConfig.entry) {
        let results: any[] = [];
        let entryCount = searchConfig.entry.length;
        let doneCount = 0;

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
                  entry.parseScript,
                  site,
                  entry.resultSelector
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
                entry.parseScript,
                site,
                entry.resultSelector
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
      }
    });
  }

  public getSearchResult(
    url: string,
    getResultScript: string,
    site: Site,
    resultSelector: string = ""
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      $.ajax({
        url: url,
        timeout: (this.options.search && this.options.search.timeout) || 30000
      })
        .done((result: any) => {
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
              resultSelector,
              page
            };
            // console.log(page);

            // resolve(results);
            try {
              if (getResultScript) {
                eval(getResultScript);
              }
              resolve(options.results);
            } catch (error) {
              console.error(error);
              reject(error);
            }
          } else {
            reject();
          }
        })
        .fail((result: any) => {
          reject(result);
        });
    });
  }

  /**
   * 根据指定的站点获取站点的架构信息
   * @param site 站点信息
   */
  getSiteSchema(site: Site): SiteSchema {
    let schema: SiteSchema = {};
    if (typeof site.schema === "string") {
      schema = this.options.system.schemas.find((item: SiteSchema) => {
        return item.name == site.schema;
      });
    } else if (site) {
      let _site = this.options.system.sites.find((item: Site) => {
        return item.host == site.host;
      });
      if (_site && _site.schema) {
        schema = _site.schema;
        schema.siteOnly = true;
      }
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
