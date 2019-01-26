import {
  Options,
  ESizeUnit,
  EConfigKey,
  Site,
  DownloadClient,
  UIOptions,
  SearchEntry
} from "@/interface/common";
import { API, APP } from "@/service/api";
import localStorage from "@/service/localStorage";
import { SyncStorage } from "./syncStorage";

/**
 * 配置信息类
 */
class Config {
  private name: string = EConfigKey.default;
  private localStorage: localStorage = new localStorage();
  public syncStorage: SyncStorage = new SyncStorage();

  public schemas: any[] = [];
  public sites: any[] = [];
  public clients: any[] = [];
  public requestCount: number = 0;

  constructor() {
    this.reload();
  }

  public reload() {
    APP.cache.clear();
    this.getSchemas();
    this.getSites();
    this.getClients();
  }

  /**
   * 系统参数
   */
  public options: Options = {
    exceedSizeUnit: ESizeUnit.GiB,
    sites: [],
    clients: [],
    system: {},
    allowDropToSend: true,
    allowSelectionTextSearch: true,
    needConfirmWhenExceedSize: true,
    exceedSize: 10,
    search: {
      rows: 10,
      // 搜索超时
      timeout: 30000
    },
    // 连接下载服务器超时时间（毫秒）
    connectClientTimeout: 5000,
    rowsPerPageItems: [
      10,
      20,
      50,
      100,
      200,
      { text: "$vuetify.dataIterator.rowsPerPageAll", value: -1 }
    ],
    searchSolutions: []
  };

  public uiOptions: UIOptions = {};

  /**
   * 保存配置
   * @param options 配置信息
   */
  public save(options?: Options) {
    if (options) {
      this.options = options;
    }
    this.localStorage.set(this.name, this.cleaningOptions(this.options));
  }

  /**
   * 清理参数配置，一些参数只需要运行时可用即可
   * @param options
   */
  private cleaningOptions(options: Options): Options {
    let _options = Object.assign({}, options);
    if (_options.sites) {
      _options.sites.forEach((item: Site) => {
        let systemSite: Site | undefined = this.sites.find((site: Site) => {
          return site.host == item.host;
        });

        if (systemSite) {
          // 不保存分类信息
          if (item.categories) {
            delete item.categories;
          }
          if (item.searchEntry) {
            item.searchEntry.forEach((entry: SearchEntry, index: number) => {
              if (!entry.isCustom) {
                (item.searchEntry as any)[index] = {
                  name: entry.name,
                  enabled: entry.enabled
                };
              }
            });
          }
        }
      });
    }

    console.log("cleaningOptions", _options);
    return _options;
  }

  /**
   * 读取配置信息
   * @return Promise 配置信息
   */
  public read(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      // 加载用户界面设置
      this.localStorage.get(EConfigKey.uiOptions, (result: any) => {
        if (result) {
          let defaultOptions = Object.assign({}, this.uiOptions);
          this.uiOptions = Object.assign(defaultOptions, result);
        }
      });

      this.loadConfig(resolve);
    });
  }

  /**
   * 加载配置
   * @param success
   */
  private loadConfig(success: any) {
    // 如果还有网络请求，则继续等待
    if (this.requestCount > 0) {
      setTimeout(() => {
        this.loadConfig(success);
      }, 100);
      return;
    }
    this.localStorage.get(this.name, (result: any) => {
      if (result) {
        delete result.system;
        let defaultOptions = Object.assign({}, this.options);
        this.options = Object.assign(defaultOptions, result);
      }
      // 覆盖站点架构
      this.options.system = {
        schemas: this.schemas,
        sites: this.sites,
        clients: this.clients
      };

      // 升级不存在的配置项
      this.options.sites &&
        this.options.sites.length &&
        this.sites.forEach((systemSite: Site) => {
          let index = this.options.sites.findIndex((site: Site) => {
            return site.host === systemSite.host;
          });

          if (index > -1) {
            let _site: Site = Object.assign(
              Object.assign({}, systemSite),
              this.options.sites[index]
            );

            if (systemSite.categories) {
              _site.categories = systemSite.categories;
            }

            // 合并系统定义的搜索入口
            if (_site.searchEntry && systemSite.searchEntry) {
              systemSite.searchEntry.forEach((sysEntry: SearchEntry) => {
                if (_site.searchEntry) {
                  let _index: number | undefined =
                    _site.searchEntry &&
                    _site.searchEntry.findIndex((entry: SearchEntry) => {
                      return entry.name == sysEntry.name && !entry.isCustom;
                    });

                  if (_index != undefined && _index > -1) {
                    _site.searchEntry[_index] = Object.assign(
                      Object.assign({}, sysEntry),
                      {
                        enabled: _site.searchEntry[_index].enabled
                      }
                    );
                  } else {
                    _site.searchEntry.push(Object.assign({}, sysEntry));
                  }
                }
              });
            } else if (systemSite.searchEntry) {
              _site.searchEntry = systemSite.searchEntry;
            }

            this.options.sites[index] = _site;
          }
        });

      // 升级不存在的配置项
      this.options.clients &&
        this.options.clients.length &&
        this.options.clients.forEach((item, index) => {
          let client = this.clients.find((c: DownloadClient) => {
            return c.type === item.type;
          });

          if (client) {
            this.options.clients[index] = Object.assign(
              Object.assign({}, client),
              this.options.clients[index]
            );
          }
        });

      console.log(this.options);

      success && success(this.options);
    });
  }

  public readUIOptions(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      // 加载用户界面设置
      this.localStorage.get(EConfigKey.uiOptions, (result: any) => {
        if (result) {
          let defaultOptions = Object.assign({}, this.uiOptions);
          this.uiOptions = Object.assign(defaultOptions, result);
        }

        resolve(this.uiOptions);
      });
    });
  }

  public saveUIOptions(options: UIOptions): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.localStorage.set(EConfigKey.uiOptions, options || this.uiOptions);
      resolve();
    });
  }

  /**
   * 获取支持的网站架构
   */
  public getSchemas(): any {
    this.schemas = [];
    this.getContentFromApi(`${API.schemas}`).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            this.addSchema(
              API.schemaConfig.replace(/\{\$schema\}/g, item.name)
            );
          }
        });
      }
    });
  }

  public addSchema(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.schemas.push(result);
      }
    });
  }

  public getSites() {
    this.sites = [];
    this.getContentFromApi(API.sites).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            // this.schemas.push(item.name);
            this.addSite(API.siteConfig.replace(/\{\$site\}/g, item.name));
          }
        });
      }
    });
  }

  public addSite(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.sites.push(result);
      }
    });
  }

  public getClients() {
    this.clients = [];
    this.getContentFromApi(API.clients).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            this.addClient(
              API.clientConfig.replace(/\{\$client\}/g, item.name)
            );
          }
        });
      }
    });
  }

  public addClient(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.clients.push(result);
      }
    });
  }

  /**
   * 从远程请求指定的内容
   * @param api
   */
  public getContentFromApi(api: string): Promise<any> {
    this.updateBadge(++this.requestCount);
    return new Promise<any>((resolve?: any, reject?: any) => {
      let content = APP.cache.get(api);
      if (content) {
        resolve(content);
        this.updateBadge(--this.requestCount);
        return;
      }
      $.getJSON(api)
        .done(result => {
          APP.cache.set(api, result);
          this.updateBadge(--this.requestCount);
          resolve(result);
        })
        .fail(result => {
          this.updateBadge(--this.requestCount);
          reject && reject(result);
        });
    });
  }

  /**
   * 更新插件徽标提示
   * @param count
   */
  private updateBadge(count: number) {
    if (!APP.isExtensionMode) return;
    if (count == 0) {
      chrome.browserAction.setBadgeText({ text: "" });
      chrome.browserAction.enable();
    } else {
      chrome.browserAction.setBadgeText({ text: count.toString() });
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#aabbcc"
      });
      chrome.browserAction.disable();
    }
  }

  /**
   * 将系统参数备份到Google
   */
  public backupToGoogle(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome.storage && chrome.storage.sync) {
        let options = Object.assign({}, this.options);
        if (options.system) {
          delete options.system;
        }

        // 因Google 8K限制，固将内容拆分后保存
        // https://developer.chrome.com/extensions/storage#type-StorageArea
        let clients = Object.assign([], options.clients);
        let sites = Object.assign([], options.sites);

        delete options.clients;
        delete options.sites;

        // 主要配置
        this.syncStorage
          .set(this.name, options)
          .then(() => {
            // 客户端配置
            this.syncStorage
              .set(this.name + ".clients", clients)
              .then(() => {
                // 站点配置
                this.syncStorage
                  .set(this.name + ".sites", sites)
                  .then(() => {
                    resolve(this.options);
                  })
                  .catch((error: any) => {
                    reject(APP.createErrorMessage(error));
                  });
              })
              .catch((error: any) => {
                reject(APP.createErrorMessage(error));
              });
          })
          .catch((error: any) => {
            reject(APP.createErrorMessage(error));
          });
      } else {
        reject(APP.createErrorMessage("chrome.storage 不存在"));
      }
    });
  }

  /**
   * 从Google云端恢复系统参数
   */
  public restoreFromGoogle(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome.storage && chrome.storage.sync) {
        this.syncStorage
          .get(this.name)
          .then((result: any) => {
            let system = Object.assign({}, this.options.system);
            let options = result;

            options.system = system;

            // 获取客户端配置
            this.syncStorage
              .get(this.name + ".clients")
              .then((result: any) => {
                options.clients = result;
                // 获取站点配置
                this.syncStorage
                  .get(this.name + ".sites")
                  .then((result: any) => {
                    options.sites = result;
                    this.options = options;
                    this.save();
                    setTimeout(() => {
                      resolve(this.options);
                    }, 300);
                  })
                  .catch((error: any) => {
                    reject(APP.createErrorMessage(error));
                  });
              })
              .catch((error: any) => {
                reject(APP.createErrorMessage(error));
              });
          })
          .catch((error: any) => {
            reject(APP.createErrorMessage(error));
          });
      } else {
        reject(APP.createErrorMessage("chrome.storage 不存在"));
      }
    });
  }
}
export default Config;
