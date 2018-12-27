import {
  Options,
  EAction,
  Site,
  SiteSchema,
  Dictionary
} from "../interface/common";
import { APP } from "../service/api";
import { filters as Filters } from "../service/filters";
export default class Controler {
  public options: Options = {
    sites: [],
    clients: []
  };

  public defaultClient: any;
  public siteDefaultClients: any = {};
  public optionsTabId: number | undefined = 0;

  constructor(options: Options) {
    this.options = options;
    this.initDefaultClient();
  }

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
   * 发送下载链接地址到默认服务器（客户端）
   * @param data 链接地址
   */
  public sendTorrentToDefaultClient(data: any, sender?: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (sender) {
        let URL = Filters.parseURL(sender.url);
        let hostname = URL.host;
        let client = this.siteDefaultClients[hostname];
        if (!client) {
          this.initSiteDefaultClient(hostname).then((client: any) => {
            client
              .call(EAction.addTorrentFromURL, {
                url: data.url,
                savePath: data.savePath,
                autoStart: data.autoStart
              })
              .then((result: any) => {
                resolve(result);
              });
          });
        }
        return;
      }
      this.defaultClient
        .call(EAction.addTorrentFromURL, {
          url: data.url,
          savePath: data.savePath,
          autoStart: data.autoStart
        })
        .then((result: any) => {
          resolve(result);
        });
    });
  }

  /**
   * 根据指定客户端配置初始化客户端
   * @param clientOptions 客户端配置
   */
  private initClient(clientOptions: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
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
          resolve(client);
        });
      } else {
        let client: any;
        eval(`client = new ${clientOptions.type}()`);
        client.init({
          loginName: clientOptions.loginName,
          loginPwd: clientOptions.loginPwd,
          address: clientOptions.address
        });
        resolve(client);
      }
    });
  }

  /**
   * 初始化默认客户端
   */
  private initDefaultClient() {
    let clientOptions: any = this.options.clients.find((item: any) => {
      return item.id === this.options.defaultClientId;
    });

    if (clientOptions) {
      this.initClient(clientOptions).then((client: any) => {
        this.defaultClient = client;
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
      return this.initClient(clientOptions);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      resolve(this.defaultClient);
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
        this.initClient(clientOptions).then((client: any) => {
          client.call(EAction.getFreeSpace, data).then((result: any) => {
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

  public openOptions() {
    if (this.optionsTabId == 0) {
      this.createOptionTab();
    } else {
      chrome.tabs.get(this.optionsTabId as number, tab => {
        if (tab) {
          chrome.tabs.update(tab.id as number, { selected: true });
        } else {
          this.createOptionTab();
        }
      });
    }
  }

  private createOptionTab() {
    chrome.tabs.create(
      {
        url: "index.html"
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
