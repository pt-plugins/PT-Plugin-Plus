import {
  Options,
  EAction,
  Site,
  SiteSchema,
  Dictionary,
  DownloadClient,
  EDownloadClientType,
  DownloadOptions,
  DataResult,
  EDataResultType,
  Request,
  EModule,
  ERequestMethod,
  UserInfo,
  EUserDataRange
} from "@/interface/common";
import { filters as Filters } from "@/service/filters";
import { ClientController } from "@/service/clientController";
import { DownloadHistory } from "./downloadHistory";
import { Searcher } from "./searcher";
import PTPlugin from "./service";
import { FileDownloader } from "@/service/downloader";
import { APP } from "@/service/api";
import URLParse from "url-parse";
import { User } from "./user";
import { MovieInfoService } from "@/service/movieInfoService";

type Service = PTPlugin;
export default class Controller {
  public options: Options = {
    sites: [],
    clients: []
  };

  public defaultClient: any;
  public defaultClientOptions: DownloadClient = {};
  public siteDefaultClients: any = {};
  public optionsTabId: number | undefined = 0;
  public downloadHistory: DownloadHistory = new DownloadHistory();
  public clients: any = {};
  public searcher: Searcher = new Searcher(this.service);
  public userService: User = new User(this.service);
  public movieInfoService = new MovieInfoService();

  public clientController: ClientController = new ClientController();
  public isInitialized: boolean = false;

  public contentPages: any[] = [];

  private imageBase64Cache: Dictionary<any> = {};

  constructor(public service: Service) {}

  public init(options: Options) {
    this.reset(options);
    this.isInitialized = true;
  }

  /**
   * 重置并刷新配置
   * @param options
   */
  public reset(options: Options) {
    this.options = options;
    this.clientController.init(options);
    this.searcher.options = options;
    this.initDefaultClient();
    this.siteDefaultClients = {};
  }

  /**
   * 获取搜索结果
   * @param options
   */
  public getSearchResult(options: any): Promise<any> {
    return this.searcher.searchTorrent(options.site, options.key);
  }

  /**
   * 取消一个正在执行的搜索请求
   * @param options
   */
  public abortSearch(options: any): Promise<any> {
    return this.searcher.abortSearch(options.site, options.key);
  }

  /**
   * 获取下载历史记录
   */
  public getDownloadHistory(): Promise<any> {
    return this.downloadHistory.load();
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
    clientId: string = "",
    success: boolean = true
  ) {
    // 是否保存历史记录
    if (this.options.saveDownloadHistory) {
      this.downloadHistory.add(data, host, clientId, success);
    }
  }

  /**
   * 删除下载历史记录
   * @param items 需要删除的列表
   */
  public removeDownloadHistory(items: any[]): Promise<any> {
    return this.downloadHistory.remove(items);
  }

  /**
   * 清除下载记录
   */
  public clearDownloadHistory(): Promise<any> {
    return this.downloadHistory.clear();
  }

  /**
   * 发送下载信息到指定的客户端
   * @param data
   */
  public sendTorrentToClient(data: DownloadOptions): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!data.url) {
        reject({
          msg: "无效的地址"
        });
        return;
      }
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
        this.doDownload(result, data, host)
          .then((result: any) => {
            resolve(result);
          })
          .catch((result: any) => {
            reject(result);
          });
      });
    });
  }

  /**
   * 发送下载链接地址到默认服务器（客户端）
   * @param downloadOptions 下载选项
   */
  public sendTorrentToDefaultClient(
    downloadOptions: DownloadOptions
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let URL = Filters.parseURL(downloadOptions.url);
      let host = URL.host;
      let site = this.getSiteFromHost(host);
      // 重新指定host内容，因为站点可能定义了多域名
      host = site.host;
      let siteDefaultPath = this.getSiteDefaultPath(site);
      let siteClientConfig = this.siteDefaultClients[host];
      if (siteDefaultPath) {
        downloadOptions.savePath = siteDefaultPath;
      }
      if (!siteClientConfig) {
        this.initSiteDefaultClient(host).then((siteClientConfig: any) => {
          this.siteDefaultClients[host] = siteClientConfig;

          this.doDownload(siteClientConfig, downloadOptions, host)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
        });
      } else {
        this.doDownload(siteClientConfig, downloadOptions, host)
          .then((result: any) => {
            resolve(result);
          })
          .catch((result: any) => {
            reject(result);
          });
      }
    });
  }

  /**
   * 执行下载操作
   * @param clientConfig
   * @param downloadOptions
   * @param host
   */
  private doDownload(
    clientConfig: any,
    downloadOptions: DownloadOptions,
    host: string = ""
  ): Promise<any> {
    return new Promise((resolve?: any, reject?: any) => {
      clientConfig.client
        .call(EAction.addTorrentFromURL, {
          url: downloadOptions.url,
          savePath: downloadOptions.savePath,
          autoStart: downloadOptions.autoStart
        })
        .then((result: any) => {
          this.service.logger.add({
            module: EModule.background,
            event: "service.controller.doDownload.finished",
            msg: `下载服务器${clientConfig.options.name}处理[${
              EAction.addTorrentFromURL
            }]命令完成`,
            data: result
          });

          if (result && result.code === 0) {
            switch (result.msg) {
              // 连接超时
              case "timeout":
                reject({
                  success: false,
                  msg:
                    "连接下载服务器超时，请检查网络设置或调整服务器超时时间！",
                  status: "error"
                });
                break;

              default:
                reject({
                  success: false,
                  msg: result.msg,
                  status: "error"
                });
                break;
            }

            this.saveDownloadHistory(
              downloadOptions,
              host,
              clientConfig.options.id,
              false
            );
            return;
          }

          this.saveDownloadHistory(
            downloadOptions,
            host,
            clientConfig.options.id,
            true
          );

          this.formatSendResult(result, clientConfig.options, downloadOptions)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
        })
        .catch((result: any) => {
          this.service.logger.add({
            module: EModule.background,
            event: "service.controller.doDownload.error",
            msg: `下载服务器${clientConfig.options.name}处理[${
              EAction.addTorrentFromURL
            }]命令失败`,
            data: result
          });
          this.saveDownloadHistory(
            downloadOptions,
            host,
            clientConfig.options.id,
            false
          );
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
      let cdn = item.cdn || [];
      item.url && cdn.push(item.url);
      return item.host == host || cdn.join("").indexOf(host) > -1;
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
   * @param downloadOptions
   */
  private formatSendResult(
    data: any,
    clientOptions: any,
    downloadOptions: DownloadOptions
  ): Promise<any> {
    return new Promise((resolve?: any, reject?: any) => {
      let result: DataResult = {
        type: EDataResultType.success,
        msg:
          `${downloadOptions.title || ""} 种子已添加完成。` +
          (downloadOptions.savePath
            ? `<br/>保存至 ${downloadOptions.savePath}`
            : ""),
        success: true,
        data: data
      };

      switch (clientOptions.type) {
        // transmission
        case EDownloadClientType.transmission:
          if (data.id != undefined) {
            result.msg = data.name + " 已发送至 Transmission，编号：" + data.id;
            if (downloadOptions.savePath) {
              result.msg += `<br/>保存至 ${downloadOptions.savePath} `;
            }
          } else if (data.status) {
            switch (data.status) {
              // 重复的种子
              case "duplicate":
                result.type = EDataResultType.error;
                result.success = false;
                result.msg =
                  data.torrent.name + " 种子已存在！编号：" + data.torrent.id;
                break;

              case "error":
                result.type = EDataResultType.error;
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
    return this.clientController.getClient(clientOptions);
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

  /**
   * 打开搜索种子页面
   * @param key 关键字
   * @param host 指定站点，默认搜索所有站
   */
  public searchTorrent(key: string = "", host: string = "") {
    let url = "";
    if (key) {
      url = `search-torrent/${key}`;
    }

    if (host) {
      url += `/${host}`;
    }

    this.openOptions(url);
  }

  /**
   * 打开配置页
   * @param path 要跳转的路径
   */
  public openOptions(path: string = "") {
    let url = "/";
    if (path) {
      url += path;
    }

    if (this.optionsTabId == 0) {
      this.createOptionTab(url);
    } else {
      chrome.tabs.get(this.optionsTabId as number, tab => {
        if (!chrome.runtime.lastError && tab) {
          chrome.tabs.update(tab.id as number, {
            active: true,
            url: "index.html#" + url
          });
        } else {
          this.createOptionTab(url);
        }
      });
    }
  }

  /**
   * 创建配置页面选项卡
   * @param url
   */
  private createOptionTab(url: string = "") {
    if (!url) {
      return;
    }
    if (url.substr(0, 1) === "/") {
      url = "index.html#" + url;
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
      schema =
        this.options.system &&
        this.options.system.schemas &&
        this.options.system.schemas.find((item: SiteSchema) => {
          return item.name == site.schema;
        });
    } else {
      let site: Site =
        this.options.system &&
        this.options.system.sites &&
        this.options.system.sites.find((item: Site) => {
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

  /**
   * 接收由前台发回的指令并执行
   * @param action 指令
   * @param callback 回调函数
   */
  public call(
    request: Request,
    sender?: chrome.runtime.MessageSender
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let service: any = this;
      console.log("contorller.call", request.action);
      service[request.action](request.data, sender)
        .then((result: any) => {
          resolve(result);
        })
        .catch((result: any) => {
          reject(result);
        });
    });
  }

  public addContentPage(
    data: any,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        if (sender.tab) {
          this.contentPages.push(sender.tab.id);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 备份系统参数至Google
   */
  public backupToGoogle(): Promise<any> {
    return this.service.config.backupToGoogle();
  }

  /**
   * 从Google恢复系统参数
   */
  public restoreFromGoogle(): Promise<any> {
    return this.service.config.restoreFromGoogle();
  }

  /**
   * 从Google中清除已备份的参数
   */
  public clearFromGoogle(): Promise<any> {
    return this.service.config.syncStorage.clear();
  }

  /**
   * 重新从网络中加载配置文件
   */
  public reloadConfig(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.service.config.reload();
      resolve();
    });
  }

  /**
   * 从指定的链接获取种子文件内容
   * @param url
   */
  public getTorrentDataFromURL(url: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let site = this.getSiteOptionsFromURL(url);
      let requestMethod = ERequestMethod.GET;
      if (site) {
        requestMethod = site.downloadMethod || ERequestMethod.GET;
      }
      let file = new FileDownloader({
        url,
        getDataOnly: true,
        timeout: this.service.options.connectClientTimeout
      });

      file.requestMethod = requestMethod;
      file.onCompleted = () => {
        console.log("getTorrentDataFromURL.completed", url);
        if (
          file.content &&
          /octet-stream|x-bittorrent/gi.test(file.content.type)
        ) {
          resolve(file.content);
        } else {
          reject(APP.createErrorMessage("无效的种子文件"));
        }
      };

      file.onError = (e: any) => {
        reject(APP.createErrorMessage(e));
      };

      file.start();
    });
  }

  /**
   * 根据指定URL获取站点配置信息
   * @param url
   */
  public getSiteOptionsFromURL(url: string): Site | undefined {
    let host = new URLParse(url).host;
    let site: Site =
      this.options.system &&
      this.options.system.sites &&
      this.options.system.sites.find((item: Site) => {
        return item.host == host;
      });

    return site;
  }

  public getUserInfoForAllSite(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let count = 0;
      let completed = 0;
      let results: any[] = [];
      this.options.sites.forEach((site: Site) => {
        if (site.allowGetUserInfo) {
          count++;

          this.getUserInfo(site)
            .then((result: any) => {
              if (result) {
                results.push({
                  site,
                  user: result
                });
              }

              completed++;
              if (completed >= count) {
                resolve(results);
              }
            })
            .catch(() => {
              completed++;
              if (completed >= count) {
                resolve(results);
              }
            });
        }
      });

      if (completed == count && completed == 0) {
        reject("没有站点需要获取用户信息");
      }
    });
  }

  /**
   * 获取指定站点的用户信息
   * @param site
   * @param callback
   */
  public getUserInfo(site: Site): Promise<any> {
    return this.userService.getUserInfo(site);
  }

  public abortGetUserInfo(site: Site): Promise<any> {
    return this.userService.abortGetUserInfo(site);
  }

  /**
   * 根据指定的图片地址获取Base64信息
   * @param url 图片地址
   */
  public getBase64FromImageUrl(url: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let data = this.imageBase64Cache[url];
      if (data) {
        resolve(data);
        return;
      }
      let file = new FileDownloader({
        url,
        getDataOnly: true,
        timeout: this.service.options.connectClientTimeout
      });

      file.onCompleted = () => {
        console.log("getBase64FromImageUrl.completed", url);
        if (file.content && /image/gi.test(file.content.type)) {
          var reader = new FileReader();
          reader.onloadend = () => {
            this.imageBase64Cache[url] = reader.result;
            resolve(reader.result);
          };
          reader.readAsDataURL(file.content);
        } else {
          reject(APP.createErrorMessage("无效的图片文件"));
        }
      };

      file.onError = (e: any) => {
        reject(APP.createErrorMessage(e));
      };

      file.start();
    });
  }

  public getUserHistoryData(host: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let data = this.service.userData.get(host, EUserDataRange.all);
      resolve(data);
    });
  }

  /**
   * 根据指定的关键字获取电影信息
   * @param key
   */
  public getMovieInfos(key: string): Promise<any> {
    return this.movieInfoService.getInfos(key);
  }

  /**
   * 根据指定的 IMDbId 获取评分信息
   * @param IMDbId
   */
  public getMovieRatings(IMDbId: string): Promise<any> {
    return this.movieInfoService.getRatings(IMDbId);
  }
}
