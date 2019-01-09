import {
  Options,
  Site,
  DownloadClient,
  DataResult,
  SiteSchema,
  EAction,
  EDataResultType,
  DownloadOptions
} from "@/interface/common";
import PTPlugin from "./service";
import URLParse from "url-parse";

type Service = PTPlugin;

export class ContextMenus {
  public options: Options = {
    sites: [],
    clients: []
  };

  private rootId = "PT-Plugin-Plugin-Content-Menu";
  private currentTabId = 0;

  private siteMenus: string[] = [];

  constructor(public service: Service) {
    chrome && chrome.tabs && this.initBrowserEvent();
  }

  /**
   * 初始化浏览器事件
   */
  private initBrowserEvent() {
    // 浏览器标签栏切换事件
    chrome.tabs.onActivated.addListener(
      (actionInfo: chrome.tabs.TabActiveInfo) => {
        chrome.tabs.get(actionInfo.tabId, (tab: chrome.tabs.Tab) => {
          console.log("onActivated", tab);
          this.clearSiteMenus();
          if (tab.url) {
            let host = new URLParse(tab.url).host;

            this.createSiteMenus(host);
          }
        });
      }
    );

    // 标签页面更新事件
    chrome.tabs.onUpdated.addListener(
      (
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab
      ) => {
        console.log("onUpdated", tab);
        this.clearSiteMenus();
        if (tab.url) {
          let host = new URLParse(tab.url).host;

          this.createSiteMenus(host);
        }
      }
    );
  }
  /**
   * 初始化上下文菜单
   * @param options Options 参数
   * @param service 后台服务
   */
  public init(options: Options) {
    this.options = options;

    // 清除原来的菜单
    this.clear();
    // 创建关键字搜索菜单，所有页面可用
    this.createSearchMenu();
    // 创建下载客户端上下文菜单，所有页面可用
    this.createClientMenus();
  }

  /**
   * 清除菜单
   */
  public clear() {
    chrome.contextMenus.removeAll();
  }

  /**
   * 清除站点的上下文菜单
   */
  private clearSiteMenus() {
    this.siteMenus.forEach((item: string) => {
      this.remove(item);
    });

    this.siteMenus = [];
  }

  /**
   * 创建站点上下文菜单
   */
  public createSiteMenus(host: string) {
    let site: Site = this.options.sites.find((item: Site) => {
      return item.host === host;
    });

    if (!site) {
      return;
    }
    this.options.clients.forEach((client: DownloadClient) => {
      if (client.paths) {
        let parentId = `${client.id}-path`;

        let count = 0;

        // 添加分隔线
        this.add({
          type: "separator"
        });

        // 添加以客户端名称为标题的菜单
        this.add({
          id: parentId,
          title: `${client.name} -> 指定目录`,
          contexts: ["link"]
        });

        // 根据已定义的路径创建菜单
        for (const host in client.paths) {
          let paths = client.paths[host];

          if (host !== site.host) {
            continue;
          }

          count++;
          paths.forEach((path: string) => {
            let id = `${client.id}-${host}-${path}`;
            this.add({
              id,
              title: path,
              parentId: parentId,
              contexts: ["link"],
              documentUrlPatterns: [`*://${host}/*`],
              onclick: (
                info: chrome.contextMenus.OnClickData,
                tab: chrome.tabs.Tab
              ) => {
                let data = info.menuItemId.split("-");
                let options: DownloadOptions = {
                  clientId: data[0],
                  url: info.linkUrl as string,
                  savePath: data[2]
                };

                this.sendTorrentToClient(tab.id, options);
              }
            });
          });
        }

        if (count > 0) {
          this.siteMenus.push(parentId);
        } else {
          this.remove(parentId);
        }
      }
    });
  }

  /**
   * 发送种子到指定的服务器
   * @param tabid
   * @param options
   */
  private sendTorrentToClient(tabid: number = 0, options: DownloadOptions) {
    let notice: any;
    chrome.tabs.sendMessage(
      tabid,
      {
        action: EAction.showMessage,
        data: {
          type: EDataResultType.info,
          msg: "正在发送链接至下载服务器 "
        }
      },
      (result: any) => {
        notice = result;
      }
    );

    console.log(options);

    let url = this.getParsedURL(options.url);
    if (typeof url !== "string") {
      chrome.tabs.sendMessage(tabid, {
        action: EAction.showMessage,
        data: url
      });
      notice && notice.remove && notice.remove();
      return;
    }

    options.url = url;

    this.service.controller
      .sendTorrentToClient(options)
      .then((result: any) => {
        notice && notice.remove && notice.remove();
        chrome.tabs.sendMessage(tabid, {
          action: EAction.showMessage,
          data: result
        });
      })
      .catch((result: any) => {
        notice && notice.remove && notice.remove();
        chrome.tabs.sendMessage(tabid, {
          action: EAction.showMessage,
          data: result
        });
      });
  }

  /**
   * 创建关键字搜索菜单，所有页面可用
   */
  private createSearchMenu() {
    // 是否启用选择内容时搜索
    if (this.options.allowSelectionTextSearch) {
      // 选中内容进行搜索
      this.add({
        title: '搜索 "%s" 相关的种子',
        contexts: ["selection"],
        onclick: (
          info: chrome.contextMenus.OnClickData,
          tab: chrome.tabs.Tab
        ) => {
          this.service.controller.openOptions(info.selectionText);
        }
      });
    }
  }

  /**
   * 创建下载客户端上下文菜单，所有页面可用
   */
  private createClientMenus() {
    if (this.options.defaultClientId) {
      let client = this.options.clients.find((item: DownloadClient) => {
        return item.id === this.options.defaultClientId;
      });
      if (client) {
        this.add({
          id: client.id,
          title: `发送到默认服务器 ${client.name} -> ${client.address}`,
          contexts: ["link"],
          onclick: (
            info: chrome.contextMenus.OnClickData,
            tab: chrome.tabs.Tab
          ) => {
            this.sendTorrentToClient(tab.id, {
              clientId: info.menuItemId,
              url: info.linkUrl as string
            });
          }
        });

        // 添加分隔线
        this.add({
          type: "separator"
        });
      }
    }

    if (this.options.clients.length > 1) {
      this.add({
        id: this.rootId,
        title: "发送到其他服务器",
        contexts: ["link"]
      });

      // 创建可用的客户端菜单
      this.options.clients.forEach((client: DownloadClient) => {
        if (client.id !== this.options.defaultClientId) {
          this.add({
            id: client.id,
            title: `${client.name} -> ${client.address}`,
            parentId: this.rootId,
            contexts: ["link"],
            onclick: (
              info: chrome.contextMenus.OnClickData,
              tab: chrome.tabs.Tab
            ) => {
              this.sendTorrentToClient(tab.id, {
                clientId: info.menuItemId,
                url: info.linkUrl as string
              });
            }
          });
        }
      });
    }
  }

  /**
   * 向浏览器添加上下文菜单
   * @param options 菜单选项
   * @param callback 回调
   */
  private add(
    options: chrome.contextMenus.CreateProperties,
    callback?: (() => void) | undefined
  ) {
    if (!options.id) {
      options.id = this.getRandomString();
    }
    chrome.contextMenus.create(options, callback);
  }

  /**
   * 从浏览器中删除指定的菜单
   * @param id 菜单ID
   * @param callback 回调
   */
  private remove(id: string, callback?: (() => void) | undefined) {
    chrome.contextMenus.remove(id, callback);
  }

  /**
   * 获取随机字符串
   * @param  {number} length    [长度，默认为16]
   * @param  {boolean} noSimilar [是否包含容易混淆的字符，默认为包含]
   * @return {string}           [返回的内容]
   */
  private getRandomString(
    length: number = 16,
    noSimilar: boolean = true
  ): string {
    // 是否包含容易混淆的字符[oO,Ll,9gq,Vv,Uu,I1]，默认为包含
    let chars = noSimilar
      ? "abcdefhijkmnprstwxyz2345678ABCDEFGHJKMNPQRSTWXYZ"
      : "abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKMNOPQRSTUVWXYZ";
    let maxLength = chars.length;
    let result = [];
    for (let i = 0; i < length; i++) {
      result.push(chars.charAt(Math.floor(Math.random() * maxLength)));
    }

    return result.join("");
  }

  /**
   * 获取解析过的地址
   * @param source
   */
  private getParsedURL(source: string | any): string | DataResult {
    let url = new URLParse(source);
    let site: Site = this.options.sites.find((item: Site) => {
      return item.host === url.hostname;
    });

    if (!site) {
      return source;
    }
    let options = {
      url,
      site,
      result: source,
      error: {} as DataResult
    };

    let parser = this.getSiteParser(site, "downloadURL");
    if (parser) {
      try {
        eval(parser);
      } catch (error) {
        console.error(error);
      }
    }

    if (options.error && options.error.msg) {
      return options.error;
    }

    return options.result;
  }

  private getSiteParser(site: Site, name: string): string {
    let result = site.parser && site.parser[name];
    if (!result) {
      let schema: SiteSchema =
        this.options.system &&
        this.options.system.schemas &&
        this.options.system.schemas.find((item: SiteSchema) => {
          return item.name === site.schema;
        });

      result = schema.parser && schema.parser[name];
    }
    return result;
  }
}
