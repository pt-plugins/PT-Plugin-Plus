import {
  Site,
  SiteSchema,
  Dictionary,
  Options,
  DataResult,
  EDataResultType
} from "@/interface/common";
import { APP } from "@/service/api";

export type SearchConfig = {
  searchPage: string;
  searchResultScript: string;
  script?: string;
  resultSelector?: string;
};

/**
 * 搜索类
 */
export class Searcher {
  private searchConfig: any = {};
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
      let config: SearchConfig = this.searchConfig[host];

      if (!config) {
        let schema = this.getSiteSchema(site);
        let resultSelector = "";

        config = {
          searchPage: "",
          searchResultScript: ""
        };

        if (schema && schema.search && schema.search.entry) {
          config.searchPage = schema.search.entry;
        } else if (site.search && site.search.entry) {
          config.searchPage = site.search.entry;
        }

        if (!config.searchPage) {
          result.msg = "该站点未配置搜索页面，请先配置";
          result.type = EDataResultType.error;
          reject(result);
          return;
        }

        let path = "";

        if (site.search && site.search.resultSelector) {
          resultSelector = site.search.resultSelector;
        } else {
          let _site = this.options.sites.find((item: Site) => {
            return item.host === site.host;
          });
          if (_site && _site.search && _site.search.resultSelector) {
            resultSelector = _site.search.resultSelector;
          }
        }

        if (!resultSelector && schema.search && schema.search.resultSelector) {
          resultSelector = schema.search.resultSelector;
        }

        if (schema && schema.search && schema.search.resultScript) {
          path = schema.search.resultScript;
          // 判断是否为相对路径
          if (path.substr(0, 1) !== "/") {
            path = `schemas/${schema.name}/${path}`;
          }
        } else if (site.search && site.search.resultScript) {
          path = site.search.resultScript;
          // 判断是否为相对路径
          if (path.substr(0, 1) !== "/") {
            path = `sites/${site.host}/${path}`;
          }
        }

        config.searchResultScript = path;
        config.resultSelector = resultSelector;

        if (!config.searchResultScript) {
          result.msg = "该站点未配置搜索结果获取脚本，请先配置";
          result.type = EDataResultType.error;
          reject(result);
          return;
        }

        this.searchConfig[host] = config;
      }

      // 判断是否指定了搜索页和用于获取搜索结果的脚本
      if (config.searchPage && config.searchResultScript) {
        let rows: number =
          this.options.search && this.options.search.rows
            ? this.options.search.rows
            : 10;
        let url: string = site.url + config.searchPage;

        url = this.replaceKeys(url, {
          key: key,
          rows: rows,
          passkey: site.passkey ? site.passkey : ""
        });

        if (!config.script) {
          APP.getScriptContent(config.searchResultScript).done(
            (script: string) => {
              config.script = script;
              this.getSearchResult(
                url,
                config.script,
                site,
                config.resultSelector
              )
                .then((result: any) => {
                  resolve(result);
                })
                .catch((result: any) => {
                  reject(result);
                });
            }
          );
        } else {
          this.getSearchResult(url, config.script, site, config.resultSelector)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
        }
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
