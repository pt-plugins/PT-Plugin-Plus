import Extension from "../service/extension";
import {
  Options,
  EAction,
  Site,
  SiteSchema,
  Plugin,
  ButtonOption,
  NoticeOptions,
  EDownloadClientType,
  ESizeUnit,
  EDataResultType,
  Request,
  EButtonType,
  ECommonKey
} from "@/interface/common";
import { APP } from "@/service/api";
import { filters } from "@/service/filters";
import { PathHandler } from "@/service/pathHandler";

/**
 * 插件背景脚本，会插入到每个页面
 */
class PTPContent {
  public extension: Extension;
  public options: Options = {
    sites: [],
    clients: []
  };
  public site: Site = {
    name: ""
  };

  public action = EAction;
  public filters = filters;
  public defaultClient: any;
  public downloadClientType = EDownloadClientType;
  public sizeUnit = ESizeUnit;
  public buttonType = EButtonType;
  public allSiteKey = ECommonKey.allSite;

  public schema: SiteSchema = {};

  private scripts: any[] = [];
  private styles: any[] = [];

  public buttonBar: JQuery = <any>null;
  public droper: JQuery = $("<div style='display:none;' class='droper'/>");
  private buttons: any[] = [];
  private buttonBarHeight: number = 0;
  private logo: JQuery = <any>null;

  // 插件是否被重新启用过（暂不可用），onSuspend 事件无法执行。
  private backgroundServiceIsStoped = false;

  // 用于接收页面程序
  public pageApp: any;
  // 当前页面地址
  public locationURL: string = location.href;
  // 保存路径处理器
  public pathHandler: PathHandler = new PathHandler();

  constructor() {
    this.extension = new Extension();
    if (this.extension.isExtensionMode) {
      this.readConfig();
      this.initBrowserEvent();
    }
  }

  private readConfig() {
    this.extension.sendRequest(EAction.readConfig, (result: any) => {
      this.options = result;
      this.init();
    });
  }

  private init() {
    this.initPages();

    // 由于无法直接绑定 window 相关事件，故使用定时器来监听地址变化
    // 主要用于单页面站点，地址栏由 history.pushState 等方法来变更后可以重新创建插件图标
    setInterval(() => {
      this.checkLocationURL();
    }, 1000);
  }

  /**
   * 根据指定的host获取已定义的站点信息
   * @param host
   */
  public getSiteFromHost(host: string) {
    APP.debugMode && console.log("getSiteFromHost", host);
    let sites: Site[] = [];
    if (this.options.sites) {
      sites.push(...this.options.sites);
    }

    if (this.options.system && this.options.system.publicSites) {
      sites.push(...this.options.system.publicSites);
    }

    let site = sites.find((item: Site) => {
      let cdn = item.cdn || [];
      item.url && cdn.push(item.url);
      return item.host == host || cdn.join("").indexOf(host) > -1;
    });

    if (site) {
      return JSON.parse(JSON.stringify(site));
    }

    return null;
  }

  /**
   * 初始化符合条件的附加页面
   */
  private initPages() {
    if (!this.options.showToolbarOnContentPage) {
      return;
    }
    // 判断当前页面的所属站点是否已经被定义
    this.site = this.getSiteFromHost(window.location.hostname);

    if (this.site) {
      // 适应多域名
      this.site.url = window.location.origin + "/";
    }

    // 如果当前站点未定义，则不再继续操作
    if (this.site && this.site.name) {
      if (typeof this.site.schema === "string") {
        this.schema =
          this.options.system &&
          this.options.system.schemas &&
          this.options.system.schemas.find((item: SiteSchema) => {
            return item.name == this.site.schema;
          });
      } else {
        let site =
          this.options.system &&
          this.options.system.sites &&
          this.options.system.sites.find((item: Site) => {
            return item.host == this.site.host;
          });
        if (site && site.schema && typeof site.schema !== "string") {
          this.schema = site.schema;
          this.schema.siteOnly = true;
        }
      }
    } else {
      return;
    }

    this.scripts = [];
    this.styles = [];

    // 初始化插件按钮列表
    this.initButtonBar();
    this.initDroper();

    if (this.schema && this.schema.plugins) {
      // 获取符合当前网站所需要的附加脚本
      this.schema.plugins.forEach((plugin: Plugin) => {
        let index = plugin.pages.findIndex((page: string) => {
          let path = window.location.pathname;
          let indexOf = path.indexOf(page);
          // 如果页面不包含，则使用正则尝试
          if (indexOf === -1) {
            return new RegExp(page, "").test(path);
          }
          return true;
          // return window.location.pathname.indexOf(page) !== -1;
        });

        if (index !== -1) {
          plugin.scripts.forEach((script: string) => {
            let path = script;
            // 判断是否为相对路径
            if (path.substr(0, 1) !== "/") {
              path = this.schema.siteOnly
                ? `sites/${this.site.host}/${script}`
                : `schemas/${this.schema.name}/${script}`;
            }
            this.scripts.push({
              type: "file",
              content: path
            });
          });
        }
      });
    }

    // 获取系统定义的网站信息
    let site =
      this.options.system &&
      this.options.system.sites &&
      this.options.system.sites.find((item: Site) => {
        return item.name == this.site.name;
      });

    if (!this.site.plugins) {
      this.site.plugins = [];
    } else if (this.site.schema !== "publicSite") {
      for (let index = this.site.plugins.length - 1; index >= 0; index--) {
        const item = this.site.plugins[index];
        // 删除非自定义的插件，从系统定义中重新获取
        if (!item.isCustom) {
          this.site.plugins.splice(index, 1);
        }
      }
    }

    if (site && site.plugins) {
      this.site.plugins.push(...site.plugins);
    }

    // 网站指定的脚本
    if (this.site.plugins) {
      let siteConfigPath =
        this.site.schema == "publicSite" ? "publicSites" : "sites";

      if (this.site.path) {
        siteConfigPath += `/${this.site.path}`;
      } else {
        siteConfigPath += `/${this.site.host}`;
      }
      this.site.plugins.forEach((plugin: Plugin) => {
        let index = plugin.pages.findIndex((page: string) => {
          let path = window.location.pathname;
          let indexOf = path.indexOf(page);
          // 如果页面不包含，则使用正则尝试
          if (indexOf === -1) {
            return new RegExp(page, "").test(path);
          }
          return true;
        });

        if (index !== -1) {
          plugin.scripts &&
            plugin.scripts.forEach((script: any) => {
              let path = script;
              // 判断是否为相对路径
              if (path.substr(0, 1) !== "/") {
                path = `${siteConfigPath}/${script}`;
              }
              // 文件
              this.scripts.push({
                type: "file",
                content: path
              });
            });

          if (plugin.script) {
            // 代码
            this.scripts.push({
              type: "code",
              content: plugin.script
            });
          }

          if (plugin.styles) {
            plugin.styles.forEach((style: string) => {
              let path = style;
              if (path.substr(0, 1) !== "/") {
                path = `${siteConfigPath}/${style}`;
              }
              this.styles.push({
                type: "file",
                content: path
              });
            });
          }

          if (plugin.style) {
            // 代码
            this.styles.push({
              type: "code",
              content: plugin.style
            });
          }
        }
      });
    }

    if (this.styles && this.styles.length > 0) {
      this.styles.forEach((path: string) => {
        APP.applyStyle(path);
      });
    }

    // 加入脚本并执行
    if (this.scripts && this.scripts.length > 0) {
      this.scripts.forEach((script: any) => {
        APP.addScript(script);
      });
      // 按顺序执行所有脚本
      APP.applyScripts();
    }

    // 通知后台添加了一个新页面
    this.extension.sendRequest(EAction.addContentPage).catch(error => {
      console.log(error);
    });
  }

  /**
   * 调用一个方法
   * @param action 需要执行的命令
   * @param data 额外需要传递的数据
   * @return Promise
   */
  public call(action: EAction, data?: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (this.backgroundServiceIsStoped) {
        reject({
          msg: "插件已被禁用过重启过，请刷新页面后再重试"
        });
        return;
      }
      try {
        this.extension
          .sendRequest(action, null, data)
          .then((result: any) => {
            if (result) {
              resolve && resolve(result);
            } else {
              reject && reject();
            }
          })
          .catch((result: any) => {
            reject(result);
          });
      } catch (error) {
        this.showNotice(`${action} 执行出错，可能后台服务不可用`);
        reject(error);
      }
    });
  }

  /**
   * 初始化按钮栏
   */
  private initButtonBar() {
    // 删除之前已创建的插件按钮栏
    if ($(".pt-plugin-body").length) {
      $(".pt-plugin-body").remove();
    }
    this.buttonBar = $("<div class='pt-plugin-body'/>").appendTo(document.body);
    this.logo = $(
      "<div class='logo' title='PT助手 - 点击打开配置页'/>"
    ).appendTo(this.buttonBar);
    this.logo.on("click", () => {
      this.call(EAction.openOptions);
    });
    this.buttonBarHeight = this.buttonBar.get(0).scrollHeight - 3;
    // console.log(this.buttonBarHeight);
    this.buttonBar.hide();
  }

  /**
   * 添加一个按钮
   * @param options 按钮参数
   */
  public addButton(options: ButtonOption) {
    options = Object.assign(
      {
        type: EButtonType.normal
      },
      options
    );

    let line = $("<hr/>").appendTo(this.buttonBar);
    let buttonType = "<a class='pt-plugin-button'/>";
    if (!options.click || options.type == EButtonType.label) {
      buttonType = "<span class='pt-plugin-button'/>";
    }
    let button = $(buttonType)
      .attr({
        title: options.title,
        key: options.key
      })
      .data("line", line);
    let inner = $("<div class='inner'/>").appendTo(button);
    let loading = $("<div class='loading'/>").appendTo(button);
    let success = $("<div class='action-success'/>")
      .html('<div class="action-success-ani"></div>')
      .appendTo(button);
    if (options.icon) {
      $("<i class='material-icons md-36'/>")
        .html(options.icon)
        .appendTo(inner);
    }
    $("<div/>")
      .html(options.label)
      .appendTo(inner);

    if (options.click) {
      button.click(event => {
        if (options.type == EButtonType.normal) {
          inner.hide();
          loading.show();
        }

        (<any>options).click(
          (result: any) => {
            if (options.type == EButtonType.normal) {
              loading.hide();
            } else {
              inner.hide();
            }

            success.show();
            if (result && result.msg) {
              if (!result.type) {
                result.type = "success";
              }
              this.showNotice(result);
            }
            setTimeout(() => {
              success.hide();
              inner.show();
            }, 2000);
          },
          (error: any) => {
            if (options.type == EButtonType.normal) {
              loading.hide();
            }
            inner.show();
            this.showNotice({
              msg: error || `${options.label} 发生错误，请重试。`
            });
          },
          event
        );
      });
    }

    button.appendTo(this.buttonBar);

    let offset = <any>line.outerHeight(true) + <any>button.outerHeight(true);
    this.buttonBarHeight += offset;

    this.buttons.push(button);

    // console.log(this.buttonBarHeight, offset);
    this.buttonBar.height(this.buttonBarHeight).show();
  }

  /**
   * 删除指定Key的按钮
   * @param key
   */
  public removeButton(key: string) {
    let index = this.buttons.findIndex((button: JQuery) => {
      return button.attr("key") == key;
    });

    if (index != -1) {
      let button = this.buttons[index];

      let offset = <any>button.outerHeight(true);
      this.buttonBarHeight -= offset;
      let line = button.data("line");
      if (line) {
        this.buttonBarHeight -= <any>line.outerHeight(true);
        line.remove();
      }
      button.remove();
      this.buttons.splice(index, 1);
      this.buttonBar.height(this.buttonBarHeight).show();
    }
  }

  /**
   * 显示消息提示
   * @param options 需要显示的消息选项
   * @return DOM
   */
  public showNotice(options: NoticeOptions | string) {
    APP.debugMode && console.log(options);
    options = Object.assign(
      {
        type: "error",
        timeout: 5,
        position: "bottomRight",
        progressBar: true,
        width: 320
      },
      typeof options === "string"
        ? { msg: options }
        : typeof options.msg === "object"
        ? options.msg
        : options
    );

    options.text = options.text || options.msg;
    if (options.timeout) {
      options.timeout = options.timeout * 10;
    }
    delete options.msg;

    return $(new (<any>window)["NoticeJs"](options).show());
  }

  /**
   * 获取当前站点的默认下载目录
   * @param string clientId 指定客户端ID，不指定表示使用默认下载客户端
   * @return string 目录信息，如果没有定义，则返回空字符串
   */
  public getSiteDefaultPath(clientId: string = ""): string {
    if (!clientId) {
      clientId =
        this.site.defaultClientId || <string>this.options.defaultClientId;
    }

    let client = this.options.clients.find((item: any) => {
      return item.id === clientId;
    });
    let path = "";
    if (client && client.paths) {
      for (const host in client.paths) {
        if (this.site.host === host) {
          path = client.paths[host][0];
          break;
        }
      }
    }

    return path;
  }

  /**
   * 获取指定客户端配置
   * @param clientId
   */
  public getClientOptions(clientId: string = "") {
    if (!clientId) {
      clientId =
        this.site.defaultClientId || <string>this.options.defaultClientId;
    }

    let client = this.options.clients.find((item: any) => {
      return item.id === clientId;
    });

    return client;
  }

  /**
   * 初始化拖放对象
   */
  public initDroper() {
    if (!this.options.allowDropToSend) return;

    // 添加文档拖放事件
    document.addEventListener("dragstart", (e: any) => {
      if (e.target.tagName == "A") {
        let data = {
          url: e.target.getAttribute("href"),
          title: e.target.getAttribute("title")
        };
        e.dataTransfer.setData("text/plain", JSON.stringify(data));
      }
    });

    // 拖入时
    this.buttonBar.on("dragover", (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      this.droper.show();
    });

    this.buttonBar.on("dragleave mouseleave", (e: any) => {
      this.buttonBar.removeClass("pt-plugin-body-over");
    });

    this.droper.appendTo(this.buttonBar);
    // 拖入接收对象时
    this.droper[0].addEventListener(
      "dragover",
      (e: any) => {
        //console.log(e);
        e.stopPropagation();
        e.preventDefault();
        // e.dataTransfer.dropEffect = "copy";
        // if (e.target.tagName == "A") {
        //   let data = {
        //     url: e.target.getAttribute("href"),
        //     title: e.target.getAttribute("title")
        //   };
        //   e.dataTransfer.setData("text/plain", JSON.stringify(data));
        // }
        this.logo.addClass("onLoading");
        this.buttonBar.addClass("pt-plugin-body-over");
      },
      false
    );

    // 拖放事件
    this.droper[0].addEventListener(
      "drop",
      (e: any) => {
        //console.log(e);
        e.stopPropagation();
        e.preventDefault();
        this.droper.hide();

        // 获取未处理的地址
        try {
          let data = JSON.parse(e.dataTransfer.getData("text/plain"));
          if (data) {
            if (data.url) {
              // IMDb地址
              let IMDbMatch = data.url.match(/imdb\.com\/title\/(tt\d+)/);
              if (IMDbMatch && IMDbMatch.length > 1) {
                this.extension.sendRequest(
                  EAction.openOptions,
                  null,
                  `search-torrent/${IMDbMatch[1]}`
                );
                this.logo.removeClass("onLoading");
                return;
              }
              if (this.pageApp) {
                this.pageApp
                  .call(EAction.downloadFromDroper, data)
                  .then(() => {
                    this.logo.removeClass("onLoading");
                  })
                  .catch(() => {
                    this.logo.removeClass("onLoading");
                  });
              } else {
                this.showNotice({
                  type: EDataResultType.info,
                  msg: "当前页面不支持此操作",
                  timeout: 3
                });
                this.logo.removeClass("onLoading");
              }
            } else {
              this.logo.removeClass("onLoading");
            }
          }
        } catch (error) {
          this.logo.removeClass("onLoading");
        }
      },
      false
    );

    // 离开拖放时
    this.droper.on("dragleave", (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      this.droper.hide();
      this.logo.removeClass("onLoading");
      this.buttonBar.removeClass("pt-plugin-body-over");
    });
  }

  private initBrowserEvent() {
    chrome.runtime.onMessage.addListener(
      (
        message: Request,
        sender: chrome.runtime.MessageSender,
        callback: (response: any) => void
      ) => {
        APP.debugMode && console.log("content.onMessage", message);
        switch (message.action) {
          case EAction.showMessage:
            let notice = this.showNotice(message.data);
            callback && callback(notice);
            break;

          case EAction.serviceStoped:
            this.backgroundServiceIsStoped = true;
            break;
        }
      }
    );
  }

  /**
   * 验证地址栏变化后重新创建插件图标
   */
  public checkLocationURL() {
    if (location.href != this.locationURL) {
      APP.debugMode &&
        console.log(`地址变化：${this.locationURL} -> ${location.href}`);
      this.locationURL = location.href;
      this.initPages();
    }
  }
}

// 暴露到 window 对象
Object.assign(window, {
  PTService: new PTPContent()
});
