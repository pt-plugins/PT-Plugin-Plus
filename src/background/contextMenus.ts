import {
  Options,
  Site,
  DownloadClient,
  DataResult,
  SiteSchema,
  EAction,
  EDataResultType,
  DownloadOptions,
  EModule,
  ECommonKey,
  SearchSolution
} from "@/interface/common";
import PTPlugin from "./service";
import URLParse from "url-parse";
import { APP } from "@/service/api";
import { PathHandler } from "@/service/pathHandler";

type Service = PTPlugin;

export class ContextMenus {
  public options: Options = {
    sites: [],
    clients: []
  };

  private rootId = "PT-Plugin-Plugin-Content-Menu";
  private currentTabId = 0;

  private siteMenus: string[] = [];
  private pathHandler: PathHandler = new PathHandler();

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
        this.clearSiteMenus();
        if (tab.url) {
          let host = new URLParse(tab.url).host;

          this.createSiteMenus(host);
        }
      }
    );

    // 图标单击事件
    // 暂时取消弹出内容，直接转到配置页
    chrome.browserAction.onClicked.addListener(() => {
      this.service.controller.openOptions();
    });
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
    this.createSearchMenus();
    // 创建下载客户端上下文菜单，所有页面可用
    this.createClientMenus();
    // 创建插件图标右键菜单
    this.createPluginIconPopupMenus();
  }

  /**
   * 创建插件图标右键菜单
   */
  public createPluginIconPopupMenus() {
    // 查看下载历史
    this.add({
      title: this.service.i18n.t("service.contextMenus.history"),
      contexts: ["browser_action"],
      onclick: () => {
        chrome.tabs.create({
          url: "index.html#/history"
        });
      }
    });

    // 查看助手日志
    this.add({
      title: this.service.i18n.t("service.contextMenus.systemLog"),
      contexts: ["browser_action"],
      onclick: () => {
        chrome.tabs.create({
          url: "index.html#/system-logs"
        });
      }
    });

    this.add({
      type: "separator",
      contexts: ["browser_action"]
    });

    // 使用问题反馈
    this.add({
      title: this.service.i18n.t("service.contextMenus.issues"),
      contexts: ["browser_action"],
      onclick: () => {
        chrome.tabs.create({
          url: "https://github.com/pt-plugins/PT-Plugin-Plus/issues/new"
        });
      }
    });
  }

  /**
   * 清除菜单
   */
  public clear() {
    chrome && chrome.contextMenus && chrome.contextMenus.removeAll();
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
   * 获取指定站点的URL匹配规则
   * @param site
   */
  private getSiteDocumentUrlPatterns(site: Site): string[] {
    let url = site.url + "";
    if (url.substr(-1) != "/") {
      url += "/";
    }
    let documentUrlPatterns: string[] = [`*://${site.host}/*`, `${url}`];

    if (site.cdn && site.cdn.length > 0) {
      for (let i = 0; i < site.cdn.length; i++) {
        const url = site.cdn[i]
        documentUrlPatterns.push(`${url}${url.substr(-1) != '/' ? '/*' : '*'}`, url);
      }
    }

    return documentUrlPatterns;
  }

  /**
   * 根据指定的目录信息创建菜单
   * @param paths
   * @param site
   * @param client
   * @param parentId
   */
  private createPathMenus(
    paths: string[],
    site: Site,
    client: DownloadClient,
    parentId: string
  ) {
    paths.forEach((path: string, index: number) => {
      let id = `${client.id}**${site.host}**${path}**${index}`;
      this.add({
        id,
        title: this.pathHandler.replacePathKey(path, site),
        parentId: parentId,
        contexts: ["link"],
        documentUrlPatterns: this.getSiteDocumentUrlPatterns(site),
        targetUrlPatterns: this.getSiteUrlPatterns(site),
        onclick: (
          info: chrome.contextMenus.OnClickData,
          tab: chrome.tabs.Tab
        ) => {
          let data = info.menuItemId.split("**");
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

  /**
   * 创建站点上下文菜单
   */
  public createSiteMenus(host: string) {
    let site: Site = this.options.sites.find((item: Site) => {
      let cdn = [item.url].concat(item.cdn);
      return item.host === host || cdn.join("|").indexOf(host) > -1;
    });

    if (!site) {
      return;
    }

    // 是否启用选择内容时搜索
    if (this.options.allowSelectionTextSearch) {
      let menuId: string = site.host as string;
      this.siteMenus.push(menuId);
      // 选中内容进行搜索
      this.add({
        id: menuId,
        title: this.service.i18n.t(
          "service.contextMenus.searchSelectionTextOnThisSite"
        ),
        contexts: ["selection"],
        documentUrlPatterns: this.getSiteDocumentUrlPatterns(site),
        onclick: (
          info: chrome.contextMenus.OnClickData,
          tab: chrome.tabs.Tab
        ) => {
          this.service.controller.searchTorrent(info.selectionText, host);
        }
      });
    }

    this.options.clients.forEach((client: DownloadClient) => {
      if (client.paths) {
        let parentId = `${client.id}-path`;

        let count = 0;

        // 添加以客户端名称为标题的菜单
        this.add({
          id: parentId,
          title: this.service.i18n.t(
            "service.contextMenus.downloadClientPath",
            {
              clientName: client.name
            }
          ),
          contexts: ["link"],
          documentUrlPatterns: this.getSiteDocumentUrlPatterns(site),
          targetUrlPatterns: this.getSiteUrlPatterns(site)
        });

        // 根据已定义的路径创建菜单
        for (const host in client.paths) {
          let paths = client.paths[host];

          if (host !== site.host) {
            continue;
          }

          count++;
          this.createPathMenus(paths, site, client, parentId);
        }

        // 最后添加当前客户端适用于所有站点的目录
        let publicPaths = client.paths[ECommonKey.allSite];
        if (publicPaths) {
          count++;
          this.createPathMenus(publicPaths, site, client, parentId);
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
   * 获取指定站点的配置种子链接规则
   * @param site
   */
  private getSiteUrlPatterns(site: Site): string[] {
    let result: string[] = [];
    if (site.patterns && site.patterns["torrentLinks"]) {
      result = site.patterns["torrentLinks"];
    } else {
      let schema = this.getSiteSchema(site);
      if (schema && schema.patterns && schema.patterns["torrentLinks"]) {
        result = schema.patterns["torrentLinks"];
      } else {
        result.push("*://*/*");
      }
    }
    return result;
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
    }

    return schema;
  }

  /**
   * 发送种子到指定的服务器
   * @param tabid
   * @param options
   */
  private sendTorrentToClient(tabid: number = 0, options: DownloadOptions) {
    console.log("sendTorrentToClient", options);
    let site = this.getSiteFromURL(options.url);
    if (site && options.savePath) {
      let savePath = this.pathHandler.getSavePath(options.savePath, site);
      if (savePath === false) {
        // "用户已取消"
        APP.showNotifications({
          message: this.service.i18n.t("service.contextMenus.userCanceled")
        });
        return;
      }

      options.savePath = savePath;
    }

    let notice: any;
    try {
      chrome.tabs.sendMessage(
        tabid,
        {
          action: EAction.showMessage,
          data: {
            type: EDataResultType.info,
            msg: this.service.i18n.t("service.contextMenus.sendingLink"),
            timeout: 2,
            indeterminate: true
          }
        },
        (result: any) => {
          if (chrome.runtime.lastError) {
            let message = chrome.runtime.lastError.message || "";
            if (message.match(/Could not establish connection/)) {
              // "插件状态未知，当前操作可能失败，请刷新页面后再试"
              APP.showNotifications({
                message: this.service.i18n.t(
                  "service.contextMenus.pluginStatusIsUnknown"
                )
              });
            } else {
              APP.showNotifications({
                message: chrome.runtime.lastError.message
              });
            }
            return;
          }
          notice = result;
        }
      );
    } catch (error) {
      APP.showNotifications({
        message: error
      });
      return;
    }

    this.service.logger.add({
      module: EModule.background,
      event: "contextMenus.sendTorrentToClient.begin",
      msg: this.service.i18n.t("service.contextMenus.sendingLink"),
      data: options
    });

    let client = this.options.clients.find((item: DownloadClient) => {
      return item.id === options.clientId;
    });

    if (!client) {
      chrome.tabs.sendMessage(tabid, {
        action: EAction.showMessage,
        data: {
          type: EDataResultType.error,
          msg: this.service.i18n.t(
            "service.contextMenus.downloadClientGetFailed"
          )
        }
      });

      this.service.logger.add({
        module: EModule.background,
        event: "contextMenus.sendTorrentToClient.getClientError",
        msg: this.service.i18n.t(
          "service.contextMenus.downloadClientGetFailed"
        ),
        data: options
      });
      this.hideNotice(tabid, notice);
      return;
    }

    // 设置是否自动开始
    options.autoStart = client.autoStart;
    console.log(options);

    let url = this.getParsedURL(options.url);
    if (typeof url !== "string") {
      chrome.tabs.sendMessage(tabid, {
        action: EAction.showMessage,
        data: url
      });
      this.hideNotice(tabid, notice);
      return;
    }

    options.url = url;

    this.service.controller
      .sendTorrentToClient(options)
      .then((result: any) => {
        this.service.logger.add({
          module: EModule.background,
          event: "contextMenus.sendTorrentToClient.done",
          msg: this.service.i18n.t(
            "service.contextMenus.sendTorrentToClientDone"
          ), // "下载链接发送完成。",
          data: result
        });
        chrome.tabs.sendMessage(tabid, {
          action: EAction.showMessage,
          data: result
        });
      })
      .catch((result: any) => {
        this.service.logger.add({
          module: EModule.background,
          event: "contextMenus.sendTorrentToClient.error",
          msg: this.service.i18n.t(
            "service.contextMenus.sendTorrentToClientError"
          ), // "下载链接发送失败！",
          data: result
        });
        chrome.tabs.sendMessage(tabid, {
          action: EAction.showMessage,
          data: result.status == "" ? this.service.i18n.t("service.contextMenus.sendTorrentToClientError") : result
        });
      })
      .finally(() => {
        this.hideNotice(tabid, notice);
      });
  }

  /**
   * 隐藏指定的 notice
   * @param tabid
   * @param notice
   */
  private hideNotice(tabid: number = 0, notice: any) {
    if (!notice) return;
    if (notice.id) {
      chrome.tabs.sendMessage(tabid, {
        action: EAction.hideMessage,
        data: notice.id
      });
    } else if (notice.hide) {
      notice.hide();
    }
  }

  /**
   * 创建关键字搜索菜单，所有页面可用
   */
  private createSearchMenus() {
    // 是否启用选择内容时搜索
    if (this.options.allowSelectionTextSearch) {
      // 选中内容进行搜索
      this.add({
        title: this.service.i18n.t("service.contextMenus.searchSelectionText"), // '搜索 "%s" 相关的种子',
        contexts: ["selection"],
        onclick: (
          info: chrome.contextMenus.OnClickData,
          tab: chrome.tabs.Tab
        ) => {
          this.service.controller.searchTorrent(info.selectionText);
        }
      });

      this.pushMoreSearchMenus();
    }

    let imdbMenuId = "searchWithIMDb";
    // 搜索IMDb相关种子
    this.add({
      id: imdbMenuId,
      title: this.service.i18n.t("service.contextMenus.searchByIMDb"), // "搜索当前IMDb相关种子",
      contexts: ["link"],
      targetUrlPatterns: ["*://www.imdb.com/title/tt*"]
    });

    // 搜索IMDb相关种子
    this.add({
      parentId: imdbMenuId,
      title: this.service.i18n.t("service.contextMenus.searchByDefault"), // "搜索当前IMDb相关种子",
      contexts: ["link"],
      targetUrlPatterns: ["*://www.imdb.com/title/tt*"],
      onclick: (
        info: chrome.contextMenus.OnClickData,
        tab: chrome.tabs.Tab
      ) => {
        if (info.linkUrl) {
          let link = info.linkUrl.match(/(tt\d+)/);
          if (link && link.length >= 2) {
            this.service.controller.searchTorrent(link[1]);
          }
        }
      }
    });

    this.pushMoreSearchMenus(
      imdbMenuId,
      ["link"],
      ["*://www.imdb.com/title/tt*"],
      /(tt\d+)/
    );

    let donbanMenuId = "searchWithDouban";
    // "搜索当前豆瓣链接相关种子"
    this.add({
      id: donbanMenuId,
      title: this.service.i18n.t("service.contextMenus.searchByDouban"),
      contexts: ["link"],
      targetUrlPatterns: ["*://movie.douban.com/subject/*"]
    });

    // "搜索当前豆瓣链接相关种子"
    this.add({
      parentId: donbanMenuId,
      title: this.service.i18n.t("service.contextMenus.searchByDefault"),
      contexts: ["link"],
      targetUrlPatterns: ["*://movie.douban.com/subject/*"],
      onclick: (
        info: chrome.contextMenus.OnClickData,
        tab: chrome.tabs.Tab
      ) => {
        if (info.linkUrl) {
          let link = info.linkUrl.match(/subject\/(\d+)/);
          if (link && link.length >= 2) {
            this.service.controller.searchTorrent("douban" + link[1]);
          }
        }
      }
    });

    this.pushMoreSearchMenus(
      donbanMenuId,
      ["link"],
      ["*://movie.douban.com/subject/*"],
      /subject\/(\d+)/,
      "douban"
    );
  }

  /**
   * 添加更多搜索相关菜单
   * @param _parentId
   * @param contexts
   * @param targetUrlPatterns
   * @param match
   * @param keyPrefix
   */
  private pushMoreSearchMenus(
    _parentId: string | undefined = undefined,
    contexts: string[] = ["selection"],
    targetUrlPatterns: string[] | undefined = undefined,
    match: RegExp = /(tt\d+)/,
    keyPrefix: string = ""
  ) {
    const sites = this.options.sites;
    // 以指定的站点进行搜索
    if (sites && sites.length > 0) {
      let parentId = `${_parentId}searchInSite`;

      this.add({
        id: parentId,
        title: this.service.i18n.t("service.contextMenus.searchInSite"),
        contexts: contexts,
        parentId: _parentId,
        targetUrlPatterns
      });

      // 添加站点
      sites.forEach((site: Site) => {
        let id = `${parentId}**${site.host}`;
        this.add({
          id,
          title: `${site.name} - ${site.host}`,
          parentId: parentId,
          contexts: contexts,
          targetUrlPatterns,
          onclick: (
            info: chrome.contextMenus.OnClickData,
            tab: chrome.tabs.Tab
          ) => {
            let data = info.menuItemId.split("**");
            this.service.debug(
              this.service.i18n.t("service.contextMenus.searchInSite"),
              info
            );
            if (contexts.includes("link") && info.linkUrl) {
              let link = info.linkUrl.match(match);
              if (link && link.length >= 2) {
                this.service.controller.searchTorrent(
                  keyPrefix + link[1],
                  data[1]
                );
              }
            } else {
              this.service.controller.searchTorrent(
                info.selectionText,
                data[1]
              );
            }
          }
        });
      });
    }

    const solutions = this.options.searchSolutions;
    // 以指定的方案进行搜索
    if (solutions && solutions.length > 0) {
      let parentId = `${_parentId}searchInSolution`;

      this.add({
        id: parentId,
        title: this.service.i18n.t("service.contextMenus.searchInSolution"),
        contexts: contexts,
        parentId: _parentId,
        targetUrlPatterns
      });
      solutions.forEach((item: SearchSolution) => {
        let id = `${parentId}**${item.id}`;
        this.add({
          id,
          title: `${item.name}`,
          parentId: parentId,
          contexts: contexts,
          targetUrlPatterns,
          onclick: (
            info: chrome.contextMenus.OnClickData,
            tab: chrome.tabs.Tab
          ) => {
            this.service.debug(
              this.service.i18n.t("service.contextMenus.searchInSolution"),
              info
            );
            let data = info.menuItemId.split("**");
            if (contexts.includes("link") && info.linkUrl) {
              let link = info.linkUrl.match(match);
              if (link && link.length >= 2) {
                this.service.controller.searchTorrent(
                  keyPrefix + link[1],
                  data[1]
                );
              }
            } else {
              this.service.controller.searchTorrent(
                info.selectionText,
                data[1]
              );
            }
          }
        });
      });
    }

    // 在所有站点中搜索
    this.add({
      title: this.service.i18n.t("service.contextMenus.searchInAllSite"),
      parentId: _parentId,
      contexts: contexts,
      targetUrlPatterns,
      onclick: (
        info: chrome.contextMenus.OnClickData,
        tab: chrome.tabs.Tab
      ) => {
        if (info.linkUrl) {
          let link = info.linkUrl.match(match);
          if (contexts.includes("link") && link && link.length >= 2) {
            this.service.controller.searchTorrent(keyPrefix + link[1], "all");
          }
        } else {
          this.service.controller.searchTorrent(info.selectionText, "all");
        }
      }
    });
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
          title: this.service.i18n.t(
            "service.contextMenus.sendTorrentToDefaultClient",
            {
              client
            }
          ), // `发送到默认服务器 ${client.name} -> ${client.address}`,
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
    }

    if (this.options.clients.length > 1) {
      this.add({
        id: this.rootId,
        title: this.service.i18n.t("service.contextMenus.sendTorrentToClient"), // "发送到其他服务器",
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
    chrome &&
      chrome.contextMenus &&
      chrome.contextMenus.create(options, callback);
  }

  /**
   * 从浏览器中删除指定的菜单
   * @param id 菜单ID
   * @param callback 回调
   */
  private remove(id: string, callback?: (() => void) | undefined) {
    try {
      chrome.contextMenus.remove(id, callback);
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
      }
    } catch (error) {
      console.log(error);
    }
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
    let site: Site | null = this.getSiteFromURL(source);

    if (!site) {
      return source;
    }

    let options = {
      url,
      site,
      result: source,
      error: {} as DataResult
    };

    let parser = this.getSiteParser(site.host as string, "downloadURL");
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

  /**
   * 获取指定解析器
   * @param host
   * @param name
   */
  private getSiteParser(host: string, name: string): string {
    // 由于解析器可能会更新，所以需要从系统配置中加载
    let site: Site =
      this.options.system &&
      this.options.system.sites &&
      this.options.system.sites.find((item: Site) => {
        return item.host === host;
      });

    if (!site) {
      return "";
    }

    let result = site.parser && site.parser[name];
    if (!result) {
      let schema: SiteSchema =
        this.options.system &&
        this.options.system.schemas &&
        this.options.system.schemas.find((item: SiteSchema) => {
          return item.name === site.schema;
        });

      if (schema && schema.parser) {
        result = schema.parser[name];
      }
    }
    return result;
  }

  /**
   * 根据指定的URL获取站点信息
   * @param source
   */
  private getSiteFromURL(source: string) {
    let url = new URLParse(source);
    if (!url.host) {
      return null;
    }
    let site: Site = this.options.sites.find((item: Site) => {
      let cdn = [item.url].concat(item.cdn);
      return item.host == url.host || cdn.join("").indexOf(url.host) > -1;
    });

    if (!site) {
      return null;
    }
    return site;
  }
}
