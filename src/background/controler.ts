import {
  Options,
  EAction,
  Site,
  SiteSchema,
  Dictionary,
  EConfigKey,
  DownloadClient,
  EDownloadClientType,
  DownloadOptions,
  DownloadResult
} from "../interface/common";
import { APP } from "../service/api";
import { filters as Filters } from "../service/filters";
import localStorage from "../service/localStorage";
export default class Controler {
  public options: Options = {
    sites: [],
    clients: []
  };

  public defaultClient: any;
  public defaultClientOptions: DownloadClient = {};
  public siteDefaultClients: any = {};
  public optionsTabId: number | undefined = 0;
  public downloadHistory: any[] = [];
  public clients: any = {};

  constructor(options: Options) {
    this.options = options;
    this.initDefaultClient();
    this.getDownloadHistory();
  }

  /**
   * 获取搜索结果
   * @param options
   */
  public getSearchResult(options: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let settings = {
        url: options.url,
        success: (result: any) => {
          if (
            (result && (typeof result == "string" && result.length > 100)) ||
            typeof result == "object"
          ) {
            console.log(result);

            // let script = options.scripts[index];
            const results: any[] = [];
            if (options.script) {
              eval(options.script);
            }

            resolve(results);
          } else {
            reject();
          }
        },
        error: (result: any) => {
          reject(result);
        }
      };

      $.ajax(settings);
    });
  }

  /**
   * 搜索种子
   * @param data
   */
  public searchTorrent(options: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      console.log(options.key);

      let rows: number =
        this.options.search && this.options.search.rows
          ? this.options.search.rows
          : 10;

      let urls: string[] = [];
      let scripts: string[] = [];
      let sites: Site[] = [];
      let errors: string[] = [];

      this.options.sites.forEach((item: Site) => {
        if (item.allowSearch) {
          let siteSchema: SiteSchema = this.getSiteSchema(item);
          let url: string = <string>item.url + siteSchema.searchPage;
          let script: string = <string>siteSchema.getSearchResultScript;

          url = this.replaceKeys(url, {
            key: options.key,
            rows: rows,
            passkey: item.passkey
          });

          urls.push(url);
          scripts.push(script);
          sites.push(item);
        }
      });

      this.doSearchTorrent({
        count: urls.length,
        callback: resolve,
        sites,
        urls,
        scripts,
        errors,
        onProgress: options.onProgress || function() {}
      });
    });
  }

  private doSearchTorrent(options: any) {
    let index = options.count - options.urls.length;
    let url = options.urls.shift();

    if (!url) {
      options.onProgress("搜索完成。");
      options.callback(options.errors);
      return;
    }
    let site = options.sites[index];
    options.onProgress(
      "正在搜索 [" +
        site.name +
        "]..." +
        (index + 1) +
        "/" +
        options.count +
        "."
    );
    let settings = {
      url: url,
      success: (result: any) => {
        this.doSearchTorrent(options);
        if (
          (result && (typeof result == "string" && result.length > 100)) ||
          typeof result == "object"
        ) {
          options.onProgress(result, "result");
          // let script = options.scripts[index];

          // if (script) {
          //   eval(script);
          // }
        } else {
          options.errors.push(site.name + " 搜索异常。[" + result + "]");
        }
      },
      error: () => {
        options.errors.push(site.name + " 搜索失败。");
        this.doSearchTorrent(options);
      }
    };

    $.ajax(settings);
  }

  /**
   * 获取下载历史记录
   */
  public getDownloadHistory(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let storage: localStorage = new localStorage();
      storage.get(EConfigKey.downloadHistory, (result: any) => {
        this.downloadHistory = result || [];
        resolve(this.downloadHistory);
      });
    });
  }

  /**
   * 删除下载历史记录
   * @param items 需要删除的列表
   */
  public removeDownloadHistory(items: any[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let storage: localStorage = new localStorage();
      storage.get(EConfigKey.downloadHistory, (result: any) => {
        this.downloadHistory = result;
        for (let index = this.downloadHistory.length - 1; index >= 0; index--) {
          let item = this.downloadHistory[index];
          let findIndex = items.findIndex((_data: any) => {
            return _data.data.url === item.data.url;
          });
          if (findIndex >= 0) {
            this.downloadHistory.splice(index, 1);
          }
        }
        storage.set(EConfigKey.downloadHistory, this.downloadHistory);
        resolve(this.downloadHistory);
      });
    });
  }

  /**
   * 清除下载记录
   */
  public clearDownloadHistory(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let storage: localStorage = new localStorage();
      this.downloadHistory = [];
      storage.set(EConfigKey.downloadHistory, this.downloadHistory);
      resolve(this.downloadHistory);
    });
  }

  /**
   * 发送下载信息到指定的客户端
   * @param data
   */
  public sendTorrentToClient(data: DownloadOptions): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let URL = Filters.parseURL(data.url);
      let host = URL.host;
      let clientConfig = this.options.clients.find((item: DownloadClient) => {
        return item.id === data.clientId;
      });
      if (!clientConfig) {
        reject({
          msg: "无效的下载服务器"
        });
        return;
      }

      this.getClient(clientConfig).then((result: any) => {
        this.doDownload(result, data, data.savePath).then((result: any) => {
          this.saveDownloadHistory(data, host, clientConfig.id);
          resolve(result);
        });
      });
    });
  }

  /**
   * 发送下载链接地址到默认服务器（客户端）
   * @param data 链接地址
   */
  public sendTorrentToDefaultClient(data: DownloadOptions): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let URL = Filters.parseURL(data.url);
      let host = URL.host;
      let site = this.getSiteFromHost(host);
      let siteDefaultPath = this.getSiteDefaultPath(site);
      let siteClientConfig = this.siteDefaultClients[host];
      if (!siteClientConfig) {
        this.initSiteDefaultClient(host).then((siteClientConfig: any) => {
          this.siteDefaultClients[host] = siteClientConfig;

          this.doDownload(siteClientConfig, data, siteDefaultPath).then(
            (result: any) => {
              this.saveDownloadHistory(
                data,
                site.host,
                siteClientConfig.options.id
              );
              resolve(result);
            }
          );
        });
      } else {
        this.doDownload(siteClientConfig, data, siteDefaultPath).then(
          (result: any) => {
            this.saveDownloadHistory(
              data,
              site.host,
              siteClientConfig.options.id
            );
            resolve(result);
          }
        );
      }
    });
  }

  /**
   * 保存下载记录
   * @param data 下载链接信息
   * @param host 站点域名
   * @param clientId 下载客户端ID
   */
  private saveDownloadHistory(
    data: any,
    host: string = "",
    clientId: string = ""
  ) {
    // 是否保存历史记录
    if (this.options.saveDownloadHistory) {
      let storage: localStorage = new localStorage();
      let saveData = {
        data,
        clientId,
        host,
        time: new Date().getTime()
      };
      if (!this.downloadHistory) {
        this.getDownloadHistory().then((result: any) => {
          this.downloadHistory = result;
          this.downloadHistory.push(saveData);
          storage.set(EConfigKey.downloadHistory, this.downloadHistory);
        });
      } else {
        let index = this.downloadHistory.findIndex((item: any) => {
          return item.data.url === data.url;
        });
        if (index === -1) {
          this.downloadHistory.push(saveData);
          storage.set(EConfigKey.downloadHistory, this.downloadHistory);
        }
      }
    }
  }

  /**
   * 执行下载操作
   * @param clientConfig
   * @param data
   * @param siteDefaultPath
   */
  private doDownload(
    clientConfig: any,
    data: DownloadOptions,
    siteDefaultPath: string = ""
  ): Promise<any> {
    return new Promise((resolve?: any, reject?: any) => {
      clientConfig.client
        .call(EAction.addTorrentFromURL, {
          url: data.url,
          savePath: data.savePath,
          autoStart: data.autoStart
        })
        .then((result: any) => {
          this.formatSendResult(
            result,
            clientConfig.options,
            siteDefaultPath
          ).then((result: any) => {
            resolve(result);
          });
        })
        .catch((result: any) => {
          reject(result);
        });
    });
  }

  /**
   * 根据指定的域名获取站点配置信息
   * @param host 域名
   */
  public getSiteFromHost(host: string): Site {
    return this.options.sites.find((item: Site) => {
      return item.host === host;
    });
  }

  /**
   * 获取当前站点的默认下载目录
   * @param string clientId 指定客户端ID，不指定表示使用默认下载客户端
   * @return string 目录信息，如果没有定义，则返回空字符串
   */
  public getSiteDefaultPath(site: Site, clientId: string = ""): string {
    if (!clientId) {
      clientId = site.defaultClientId || <string>this.options.defaultClientId;
    }

    let client = this.options.clients.find((item: any) => {
      return item.id === clientId;
    });
    let path = "";
    if (client && client.paths) {
      for (const host in client.paths) {
        if (site.host === host) {
          path = client.paths[host][0];
          break;
        }
      }
    }

    return path;
  }

  /**
   * 格式化发送结果
   * @param data
   * @param clientOptions
   * @param siteDefaultPath
   */
  private formatSendResult(
    data: any,
    clientOptions: any,
    siteDefaultPath: string
  ): Promise<any> {
    return new Promise((resolve?: any, reject?: any) => {
      let result: DownloadResult = {
        type: "success",
        msg: "种子已添加",
        success: true,
        data: data
      };

      switch (clientOptions.type) {
        // transmission
        case EDownloadClientType.transmission:
          if (data.id != undefined) {
            result.msg = data.name + " 已发送至 Transmission，编号：" + data.id;
            if (!siteDefaultPath) {
              result.type = "info";
              result.msg += "；但站点默认目录未配置，建议配置。";
            }
          } else if (data.status) {
            switch (data.status) {
              // 重复的种子
              case "duplicate":
                result.type = "error";
                result.success = false;
                result.msg =
                  data.torrent.name + " 种子已存在！编号：" + data.torrent.id;
                break;

              case "error":
                result.type = "error";
                result.success = false;
                result.msg = "链接发送失败，请检查下载服务器是否可用。";
                break;
              default:
                result.msg = data.msg;
                break;
            }
          } else {
            result.msg = data;
          }

          break;

        default:
          break;
      }

      resolve(result);
    });
  }

  /**
   * 根据指定客户端配置初始化客户端
   * @param clientOptions 客户端配置
   */
  private getClient(clientOptions: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (typeof clientOptions === "string") {
        let clientId = clientOptions;
        clientOptions = this.options.clients.find((item: DownloadClient) => {
          return item.id === clientId;
        });
        let client = this.clients[clientId];
        if (client) {
          resolve({ client, options: clientOptions });
          return;
        }
      }
      if ((<any>window)[clientOptions.type] === undefined) {
        // 加载初始化脚本
        APP.execScript({
          type: "file",
          content: `clients/${clientOptions.type}/init.js`
        }).then(() => {
          let client: any;
          eval(`client = new ${clientOptions.type}()`);
          client.init({
            loginName: clientOptions.loginName,
            loginPwd: clientOptions.loginPwd,
            address: clientOptions.address
          });
          this.clients[clientOptions.id] = client;
          resolve({ client, options: clientOptions });
        });
      } else {
        let client: any;
        eval(`client = new ${clientOptions.type}()`);
        client.init({
          loginName: clientOptions.loginName,
          loginPwd: clientOptions.loginPwd,
          address: clientOptions.address
        });
        this.clients[clientOptions.id] = client;
        resolve({ client, options: clientOptions });
      }
    });
  }

  /**
   * 初始化默认客户端
   */
  private initDefaultClient() {
    if (!this.options.clients) {
      return;
    }
    let clientOptions: any = this.options.clients.find((item: any) => {
      return item.id === this.options.defaultClientId;
    });

    if (clientOptions) {
      this.getClient(clientOptions).then((result: any) => {
        this.defaultClient = result.client;
        this.defaultClientOptions = result.options;
      });
    }
  }

  /**
   * 初始化指定站点默认客户端
   * @param hostname 站点host名称
   */
  private initSiteDefaultClient(hostname: string): Promise<any> {
    let site: any = this.options.sites.find((item: any) => {
      return item.host == hostname;
    });

    let clientOptions: any = this.options.clients.find((item: any) => {
      return item.id === site.defaultClientId;
    });

    if (clientOptions) {
      return this.getClient(clientOptions);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      resolve({
        client: this.defaultClient,
        options: this.defaultClientOptions
      });
    });
  }

  /**
   * 复制指定的内容到剪切板
   * @param text
   */
  public copyTextToClipboard(text: string = "") {
    if (!text) {
      return false;
    }
    var copyFrom = $("<textarea/>");
    copyFrom.text(text);
    $("body").append(copyFrom);
    copyFrom.select();
    document.execCommand("copy");
    copyFrom.remove();
    return true;
  }

  /**
   * 获取指定客户端的可用空间
   * @param data
   */
  public getFreeSpace(data: any): Promise<any> {
    if (!data.clientId) {
      return this.getDefaultClientFreeSpace(data);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      let clientOptions: any = this.options.clients.find((item: any) => {
        return item.id === data.clientId;
      });

      if (clientOptions) {
        this.getClient(clientOptions).then((result: any) => {
          result.client.call(EAction.getFreeSpace, data).then((result: any) => {
            resolve(result);
          });
        });
      }
    });
  }

  /**
   * 获取默认客户端的可用空间
   * @param data
   */
  public getDefaultClientFreeSpace(data: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.defaultClient
        .call(EAction.getFreeSpace, data)
        .then((result: any) => {
          resolve(result);
        });
    });
  }

  public updateOptionsTabId(id: number) {
    this.optionsTabId = id;
  }

  public openOptions(searchKey: string = "") {
    if (this.optionsTabId == 0) {
      this.createOptionTab(searchKey);
    } else {
      chrome.tabs.get(this.optionsTabId as number, tab => {
        if (!chrome.runtime.lastError && tab) {
          let url = "index.html";
          if (searchKey) {
            url = `index.html#/search-torrent/${searchKey}`;
          }
          chrome.tabs.update(tab.id as number, { selected: true, url: url });
        } else {
          this.createOptionTab(searchKey);
        }
      });
    }
  }

  private createOptionTab(searchKey: string = "") {
    let url = "index.html";
    if (searchKey) {
      url = `index.html#/search-torrent/${searchKey}`;
    }
    chrome.tabs.create(
      {
        url: url
      },
      tab => {
        this.optionsTabId = tab.id;
      }
    );
  }

  /**
   * 根据指定的站点获取站点的架构信息
   * @param site 站点信息
   */
  private getSiteSchema(site: Site): SiteSchema {
    let schema: SiteSchema = {};
    if (typeof site.schema === "string") {
      schema = this.options.system.schemas.find((item: SiteSchema) => {
        return item.name == site.schema;
      });
    } else {
      let site = this.options.system.sites.find((item: Site) => {
        return item.host == site.host;
      });
      if (site && site.schema) {
        schema = site.schema;
        schema.siteOnly = true;
      }
    }

    return schema;
  }

  private replaceKeys(source: string, keys: Dictionary<any>): string {
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
