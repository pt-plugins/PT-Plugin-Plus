import {
  Options,
  ESizeUnit,
  EConfigKey,
  Site,
  DownloadClient,
  UIOptions,
  SearchEntry,
  EBeforeSearchingItemSearchMode,
  SearchSolution,
  SearchSolutionRange,
  IBackupServer,
  EBackupServerType,
  EUserDataRange,
  EPluginPosition,
  IBackupRawData,
  ISiteIcon
} from "@/interface/common";
import { API, APP } from "@/service/api";
import localStorage from "@/service/localStorage";
import { SyncStorage } from "./syncStorage";
import { PPF } from "@/service/public";
import dayjs from "dayjs";
import { OWSS } from "./plugins/OWSS";
import { WebDAV } from "./plugins/WebDAV";
import PTPlugin from "./service";
import { BackupFileParser } from "@/service/backupFileParser";
import { Favicon } from "@/service/favicon";
import FileSaver from "file-saver";

type Service = PTPlugin;

/**
 * 配置信息类
 */
class Config {
  private name: string = EConfigKey.default;
  private localStorage: localStorage = new localStorage();
  public syncStorage: SyncStorage = new SyncStorage();
  public favicon: Favicon = new Favicon(this.service);

  public schemas: any[] = [];
  public sites: any[] = [];
  public clients: any[] = [];
  public publicSites: any[] = [];
  public requestCount: number = 0;
  public backupFileParser: BackupFileParser = new BackupFileParser();

  constructor(public service: Service) {
    this.reload();
  }

  public reload() {
    APP.cache.clear();
    // this.getSchemas();
    // this.getSites();
    // this.getClients();
    this.getSystemConfig();
  }

  /**
   * 系统参数
   */
  public options: Options = {
    exceedSizeUnit: ESizeUnit.GiB,
    sites: [],
    clients: [],
    backupServers: [],
    system: {},
    allowDropToSend: true,
    allowSelectionTextSearch: true,
    needConfirmWhenExceedSize: true,
    exceedSize: 10,
    search: {
      rows: 50,
      // 搜索超时
      timeout: 30000,
      saveKey: true
    },
    // 连接下载服务器超时时间（毫秒）
    connectClientTimeout: 30000,
    rowsPerPageItems: [
      10,
      20,
      50,
      100,
      200,
      { text: "$vuetify.dataIterator.rowsPerPageAll", value: -1 }
    ],
    searchSolutions: [],
    navBarIsOpen: true,
    showMoiveInfoCardOnSearch: true,
    beforeSearchingOptions: {
      getMovieInformation: true,
      maxMovieInformationCount: 5,
      searchModeForItem: EBeforeSearchingItemSearchMode.id
    },
    showToolbarOnContentPage: true,
    // 下载失败后是否进行重试
    downloadFailedRetry: false,
    // 下载失败重试次数
    downloadFailedFailedRetryCount: 3,
    // 下载失败间隔时间（秒）
    downloadFailedFailedRetryInterval: 5,
    // 批量下载时间间隔（秒）
    batchDownloadInterval: 0,
    // 启用后台下载任务
    enableBackgroundDownload: false,
    // 助手工具栏显示位置
    position: EPluginPosition.right,
    // 是否加密存储备份数据
    encryptBackupData: false,
    allowSaveSnapshot: true
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
   * 获取站点图标并缓存
   */
  public getFavicons(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let urls: string[] = [];
      this.sites.forEach((site: Site) => {
        urls.push(site.activeURL || site.url || "");
      });

      if (this.options.sites) {
        this.options.sites.forEach((site: Site) => {
          urls.push(site.activeURL || site.url || "");
        });
      }

      this.favicon
        .gets(urls)
        .then((results: any[]) => {
          results.forEach((result: any) => {
            let site = this.options.sites.find((item: Site) => {
              let cdn = [item.url].concat(item.cdn, item.formerHosts?.map(x => `//${x}`));
              return (
                item.host == result.host ||
                cdn.join("").indexOf(`//${result.host}`) > -1
              );
            });

            if (site) {
              site.icon = result.data;
            }
          });

          this.save();
          this.service.options = this.options;
          resolve(this.options);
        })
        .catch(error => {
          this.service.debug(error);
          reject(error);
        });
    });
  }

  /**
   * 获取单个站点图标
   * @param url
   */
  public getFavicon(url: string, reset: boolean = false): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.favicon
        .get(url, reset)
        .then((result: ISiteIcon) => {
          let site = this.options.sites.find((item: Site) => {
            let cdn = [item.url].concat(item.cdn, item.formerHosts?.map(x => `//${x}`));
            return (
              item.host == result.host ||
              cdn.join("").indexOf(`//${result.host}`) > -1
            );
          });

          if (site) {
            site.icon = result.data;
            this.save();
            this.service.options = this.options;
          }

          resolve(result);
        })
        .catch(error => {
          this.service.debug(error);
          reject(error);
        });
    });
  }

  /**
   * 清理参数配置，一些参数只需要运行时可用即可
   * @param options
   */
  public cleaningOptions(options: Options): Options {
    // 因 Object.assign 无法进行深拷贝，会造成对原有参数的破坏
    // 故还是采用 JSON 的方式
    let _options = JSON.parse(JSON.stringify(options));
    if (_options.sites) {
      _options.sites.forEach((item: Site) => {
        let systemSite: Site | undefined = this.sites.find((site: Site) => {
          return site.host == item.host;
        });

        if (systemSite) {
          // 移除运行时参数
          [
            "categories",
            "selectors",
            "patterns",
            "torrentTagSelectors",
            "icon",
            "activeURL",
            "searchEntryConfig",
            "schema",
            "supportedFeatures",
            "mergeSchemaTagSelectors"
          ].forEach((key: string) => {
            let _item = item as any;
            if (_item[key]) {
              delete _item[key];
            }
          });

          if (item.searchEntry) {
            item.searchEntry.forEach((entry: SearchEntry, index: number) => {
              if (!entry.isCustom) {
                // 仅保存名称和是否启用
                (item.searchEntry as any)[index] = {
                  name: entry.name,
                  enabled: entry.enabled
                };
              }
            });
          }
        }

        if (
          PPF.isExtensionMode &&
          item.icon &&
          item.icon.substr(0, 10) === "data:image"
        ) {
          delete item.icon;
        }
      });
    }

    // 移除客户端配置中运行时内容
    if (_options.clients) {
      _options.clients.forEach((item: any) => {
        [
          "pathDescription",
          "description",
          "warning",
          "scripts",
          "ver",
          "icon"
        ].forEach((key: string) => {
          if (item[key]) {
            delete item[key];
          }
        });
      });
    }

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
      this.resetRunTimeOptions(result);
      success && success(this.options);
    });
  }

  /**
   * 重置运行时配置
   * @param options
   */
  public resetRunTimeOptions(options?: Options) {
    if (options) {
      if (options.system) {
        delete options.system;
      }
      let defaultOptions = Object.assign({}, this.options);
      this.options = Object.assign(defaultOptions, options);
    }

    // 如果未指定语言，则以当前浏览器默认语言为准
    if (!this.options.locale) {
      this.options.locale = navigator.language || "zh-CN";
    }

    // 覆盖站点架构
    this.options.system = {
      schemas: this.schemas,
      sites: this.sites,
      clients: this.clients,
      publicSites: this.publicSites
    };

    this.upgradeSites();

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

          // 网站架构以系统定义为准
          if (systemSite.schema) {
            _site.schema = systemSite.schema;
          }

          // 清理已移除的标签选择器
          if (!systemSite.torrentTagSelectors && _site.torrentTagSelectors) {
            delete _site.torrentTagSelectors;
          } else {
            _site.torrentTagSelectors = systemSite.torrentTagSelectors;
          }

          if (!systemSite.patterns && _site.patterns) {
            delete _site.patterns;
          } else {
            _site.patterns = systemSite.patterns;
          }

          // 更新升级要求
          if (!systemSite.levelRequirements && _site.levelRequirements) {
            delete _site.levelRequirements;
          } else {
            _site.levelRequirements = systemSite.levelRequirements;
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

          // 设置默认图标
          if (!systemSite.icon && !_site.icon) {
            _site.icon = _site.url + "/favicon.ico"
          }

          this.options.sites[index] = _site;
        }
      });

    // 设置当前需要使用的URL地址
    this.options.sites.forEach((site: Site) => {
      if (site.cdn && site.cdn.length > 0) {
        site.activeURL = site.cdn[0];
        // 去除重复的地址，由之前的Bug引起
        site.cdn = this.arrayUnique(site.cdn);
      } else {
        site.activeURL = site.url;
      }

      if (site.priority == null) {
        site.priority = 100;
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

    if (PPF.isExtensionMode) {
      this.getFavicons();
    }

    console.log(this.options);
  }

  /**
   * 数组去重
   * @param source 源数组
   * @see https://www.cnblogs.com/wisewrong/p/9642264.html （性能比较）
   */
  private arrayUnique(source: any[]) {
    let result: any[] = [];
    let obj: any = {};

    source.forEach((value: any) => {
      if (!obj[value]) {
        result.push(value);
        obj[value] = 1;
      }
    });

    return result;
  }

  /**
   * 升级网站信息
   */
  public upgradeSites() {
    this.sites.forEach((systemSite: Site) => {
      if (!systemSite.host) {
        return;
      }
      let formerHosts = systemSite.formerHosts;
      let newHost = systemSite.host;
      if (formerHosts && formerHosts.length > 0) {
        formerHosts.forEach((host: string) => {
          let site: Site = this.options.sites.find((site: Site) => {
            return site.host === host;
          });

          // 更新站点基本信息
          if (site) {
            console.log("upgradeSites.site", site, newHost);
            site.host = newHost;
            site.url = systemSite.url;
            
            // 设置默认图标
            if (!systemSite.icon && !site.icon)
              site.icon = site.url + "/favicon.ico"
            else
              site.icon = systemSite.icon;
          }
          
          // 更新搜索方案
          if (this.options.searchSolutions) {
            this.options.searchSolutions.forEach(
              (soluteion: SearchSolution) => {
                soluteion.range.forEach((range: SearchSolutionRange) => {
                  if (range.host == host) {
                    console.log(
                      "upgradeSites.searchSolutions",
                      range.host,
                      newHost
                    );
                    range.host = newHost;
                  }
                });
              }
            );
          }

          // 更新下载服务器路径信息
          if (this.options.clients && this.options.clients.length > 0) {
            this.options.clients.forEach((client: DownloadClient) => {
              let paths = client.paths;
              if (paths) {
                for (const key in paths) {
                  if (key == host && paths.hasOwnProperty(key)) {
                    console.log(
                      "upgradeSites.client.paths",
                      client.name,
                      key,
                      newHost
                    );
                    const element = paths[key];
                    paths[newHost] = Object.assign([], element);
                    delete paths[key];
                  }
                }
              }
            });
          }
        });
      }
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
   * 获取系统配置
   */
  public getSystemConfig() {
    this.schemas = [];
    this.sites = [];
    this.clients = [];
    this.publicSites = [];
    this.getContentFromApi(`${API.systemConfig}`).then((result: any) => {
      if (result) {
        this.schemas = result.schemas;
        this.sites = result.sites;
        this.clients = result.clients;
        this.publicSites = result.publicSites;
      }
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
    PPF.updateBadge(++this.requestCount);
    return new Promise<any>((resolve?: any, reject?: any) => {
      let content = APP.cache.get(api);
      if (content) {
        resolve(content);
        PPF.updateBadge(--this.requestCount);
        return;
      }
      $.getJSON(api)
        .done(result => {
          APP.cache.set(api, result);
          PPF.updateBadge(--this.requestCount);
          resolve(result);
        })
        .fail(result => {
          PPF.updateBadge(--this.requestCount);
          reject && reject(result);
        });
    });
  }

  /**
   * 将系统参数备份到Google
   */
  public backupToGoogle(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome.storage && chrome.storage.sync) {
        let options = this.cleaningOptions(this.options);
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
                    this.resetRunTimeOptions(options);
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

  /**
   * 获取备份原始数据，用于插件背景页和前端传输
   */
  public getBackupRawData(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        const rawUserData = this.service.userData.get("", EUserDataRange.all);
        const rawOptions = this.cleaningOptions(this.service.options);

        delete rawOptions.system;

        let rawData: IBackupRawData = {
          options: rawOptions,
          userData: rawUserData,
          collection: {
            items: this.service.collection.items,
            groups: this.service.collection.groups
          },
          cookies: undefined,
          searchResultSnapshot: this.service.searchResultSnapshot.items,
          keepUploadTask: this.service.keepUploadTask.items,
          downloadHistory: undefined
        };

        const requests: Promise<any>[] = [];

        // 备份下载历史
        requests.push(this.service.controller.downloadHistory.load());

        // 是否备份站点 Cookies
        if (
          this.service.options.allowBackupCookies &&
          PPF.checkOptionalPermission("cookies")
        ) {
          requests.push(this.getAllSiteCookies());
        }

        Promise.all(requests)
          .then(results => {
            rawData.downloadHistory = results[0];
            if (results.length > 1) {
              rawData.cookies = results[1];
            }

            resolve(rawData);
          })
          .catch(() => {
            resolve(rawData);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 创建备份文件
   * @param fileName
   */
  public createBackupFile(fileName?: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.getBackupFileBlob()
        .then(blob => {
          FileSaver.saveAs(blob, fileName || this.getNewBackupFileName());
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 获取备份数据
   */
  public getBackupFileBlob(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        this.getBackupRawData()
          .then((rawData: any) => {
            this.backupFileParser
              .createBackupFileBlob(rawData)
              .then((blob: any) => {
                resolve(blob);
              });
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取所有站点Cookies
   */
  public getAllSiteCookies(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      PPF.checkPermissions(["cookies"])
        .then(() => {
          const sites = this.options.sites;

          if (sites && sites.length > 0) {
            const requests: any[] = [];
            sites.forEach((site: Site) => {
              requests.push(this.getCookiesFromSite(site));
            });

            Promise.all(requests)
              .then(results => {
                resolve(results);
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 获取指定站点Cookies
   * @param site
   */
  public getCookiesFromSite(site: Site): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      const url = site.activeURL || site.url;
      chrome.cookies.getAll(
        {
          url
        },
        result => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError.message);
            return;
          }
          resolve({
            host: site.host,
            url,
            cookies: result
          });
          console.log(result);
        }
      );
    });
  }

  /**
   * 恢复Cookies
   * @param datas
   */
  public restoreCookies(datas: any[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let requests: any[] = [];

      // 需要保留的内容
      const keepFields = [
        "name",
        "value",
        "domain",
        "path",
        "secure",
        "httpOnly",
        "expirationDate"
      ];
      datas.forEach((item: any) => {
        item.cookies.forEach((cookie: any) => {
          let options = PPF.clone(cookie);

          // 删除不需要的键
          for (const key in options) {
            if (options.hasOwnProperty(key) && !keepFields.includes(key)) {
              delete options[key];
            }
          }

          options.url = item.url;

          requests.push(this.setCookies(options, item.host));
        });
      });

      // 不管是否成功，都返回
      Promise.all(requests)
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  /**
   * 设置站点 Cookies
   * @param cookie
   * @param host
   */
  public setCookies(
    cookie: chrome.cookies.SetDetails,
    host: string
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let site: Site = PPF.getSiteFromHost(host, this.service.options);

      // 尝试获取当前站点已存在的Cookie
      chrome.cookies.get(
        {
          url: (site.activeURL || site.url) + "",
          name: cookie.name + ""
        },
        _cookie => {
          // 默认不对已存在相同的name的内容进行更新
          let allowSet = false;
          const now = new Date().getTime() / 1000;

          // 如果当前站点没有这个Cookies，则允许设置
          if (_cookie === null) {
            allowSet = true;
          } else if (
            // 如果站点存在这个Cookies，但已过期，允许设置
            _cookie.expirationDate &&
            _cookie.expirationDate < now
          ) {
            allowSet = true;
          }

          if (allowSet) {
            // 如果要导入的内容已过期，尝试按当天日期增加一天
            if (cookie.expirationDate && cookie.expirationDate < now) {
              cookie.expirationDate = now + 60 * 60 * 24;
            }

            chrome.cookies.set(cookie, result => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
              }
              resolve(result);
              console.log(result);
            });
          } else {
            console.log("跳过 %s: %s", host, cookie.name);
            resolve();
          }
        }
      );
    });
  }

  private getNewBackupFileName(): string {
    return PPF.getNewBackupFileName();
  }

  /**
   * 备份配置到服务器
   * @param server
   */
  public backupToServer(server: IBackupServer): Promise<any> {
    console.log("backupToServer", server);
    return new Promise<any>((resolve?: any, reject?: any) => {
      const time = dayjs().valueOf();
      const fileName = this.getNewBackupFileName();
      let service: OWSS | WebDAV | null = null;
      this.getBackupFileBlob()
        .then(blob => {
          const formData = new FormData();
          formData.append("name", fileName);
          formData.append("data", blob);

          switch (server.type) {
            case EBackupServerType.OWSS:
              service = new OWSS(server);
              break;

            case EBackupServerType.WebDAV:
              service = new WebDAV(server);
              break;

            default:
              reject("暂不支持");
              break;
          }

          if (service) {
            service
              .add(formData)
              .then(result => {
                resolve({
                  time,
                  fileName
                });
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 从备份服务器中恢复指定的文件
   * @param server
   * @param path
   */
  public restoreFromServer(server: IBackupServer, path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let service: OWSS | WebDAV | null = null;

      switch (server.type) {
        case EBackupServerType.OWSS:
          service = new OWSS(server);
          break;

        case EBackupServerType.WebDAV:
          service = new WebDAV(server);
          break;

        default:
          reject("暂不支持");
          break;
      }

      if (service) {
        service
          .get(path)
          .then(data => {
            this.backupFileParser
              .loadZipData(
                data,
                this.service.i18n.t("settings.backup.enterSecretKey"),
                this.service.options.encryptSecretKey
              )
              .then((result: any) => {
                resolve(result);
              })
              .catch((error: any) => {
                reject(error);
              });
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }

  /**
   * 获取备份文件列表
   * @param server
   * @param options
   */
  public getBackupListFromServer(
    server: IBackupServer,
    options: any = {}
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let service: OWSS | WebDAV | null = null;
      switch (server.type) {
        case EBackupServerType.OWSS:
          service = new OWSS(server);
          break;

        case EBackupServerType.WebDAV:
          service = new WebDAV(server);
          break;

        default:
          reject("暂不支持");
          break;
      }

      if (service) {
        service
          .list(options)
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
   * 删除指定的文件
   * @param server
   * @param path
   */
  public deleteFileFromBackupServer(
    server: IBackupServer,
    path: string
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let service: OWSS | WebDAV | null = null;
      switch (server.type) {
        case EBackupServerType.OWSS:
          service = new OWSS(server);
          break;

        case EBackupServerType.WebDAV:
          service = new WebDAV(server);
          break;

        default:
          reject("暂不支持");
          break;
      }

      if (service) {
        service
          .delete(path)
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
   * 测试指定的服务器是否可连接
   * @param server
   */
  public testBackupServerConnectivity(server: IBackupServer): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let service: OWSS | WebDAV | null = null;
      switch (server.type) {
        case EBackupServerType.OWSS:
          service = new OWSS(server);
          break;

        case EBackupServerType.WebDAV:
          service = new WebDAV(server);
          break;

        default:
          reject("暂不支持");
          break;
      }

      if (service) {
        service
          .ping()
          .then(result => {
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }
}
export default Config;
