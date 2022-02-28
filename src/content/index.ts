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
  ECommonKey,
  Dictionary,
  EPluginPosition
} from "@/interface/common";
import { APP } from "@/service/api";
import { filters } from "@/service/filters";
import { PathHandler } from "@/service/pathHandler";
import i18n from "i18next";
import { InfoParser } from "@/background/infoParser";
import { PPF } from "@/service/public";

declare global {
  interface Window {
    Drag: any;
  }
}

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
  private messageItems: Dictionary<any> = {};

  public buttonBar: JQuery = <any>null;
  public droper: JQuery = $(
    "<div style='display:none;' class='pt-plugin-droper'/>"
  );
  private buttons: any[] = [];
  private logo: JQuery = <any>null;

  // 插件是否被重新启用过（暂不可用），onSuspend 事件无法执行。
  private backgroundServiceIsStoped = false;

  // 用于接收页面程序
  public pageApp: any;
  // 当前页面地址
  public locationURL: string = location.href;
  // 保存路径处理器
  public pathHandler: PathHandler = new PathHandler();
  // 多语言处理器
  public i18n = i18n;
  // 页面解析器
  public infoParser: InfoParser = new InfoParser();
  // 当前页面选择器配置
  public pageSelector: any = {};
  // 自动确定工具栏位置
  public autoPosition: boolean = true;

  // 保存当前工具栏位置key
  private positionStorageKey = "";

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
      this.initI18n();
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
   * 初始化多语言环境
   */
  private initI18n() {
    this.extension
      .sendRequest(EAction.getCurrentLanguageResource, null, "contentPage")
      .then(resource => {
        // console.log(resource);
        let locale = this.options.locale || "en";
        // 初始化
        i18n.init({
          lng: locale,
          interpolation: {
            prefix: "{",
            suffix: "}"
          },
          resources: {
            [locale]: {
              translation: resource
            }
          }
        });
        this.init();
      });
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
      let cdn = [item.url].concat(item.cdn);
      return item.host == host || cdn.join("").indexOf(`//${host}`) > -1;
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
    this.initSiteConfig().then(() => {
      this.initPlugins();
    }).catch(() => {
      APP.debugMode && console.log("initPages 失败");
    });
  }

  /**
   * 初始化站点配置
   */
  private initSiteConfig(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!this.options.showToolbarOnContentPage) {
        reject();
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
        // 等待页面选择器加载完成后，再加载插件内容
        this.initPageSelector().finally(() => {
          resolve();
        });
      } else {
        reject();
      }
    });
  }

  /**
   * 初始化符合条件的插件
   */
  private initPlugins() {
    this.positionStorageKey = `pt-plugin-${this.site.host}-position`;

    this.scripts = [];
    this.styles = [];
    // 初始化插件按钮列表
    this.initButtonBar();
    this.initDroper();

    if (this.schema && this.schema.plugins) {
      // 获取符合当前网站所需要的附加脚本
      this.schema.plugins.forEach((plugin: Plugin) => {
        let index = plugin.pages.findIndex((page: string) => {
          let fullpath = window.location.href;
          let path = window.location.pathname;
          let indexOf = fullpath.indexOf(page);
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
    let systemSite =
      this.options.system &&
      this.options.system.sites &&
      this.options.system.sites.find((item: Site) => {
        return item.host == this.site.host;
      });

    if (!this.site.plugins) {
      this.site.plugins = [];
    } else if (this.site.schema !== "publicSite" && systemSite) {
      for (let index = this.site.plugins.length - 1; index >= 0; index--) {
        const item = this.site.plugins[index];
        // 删除非自定义的插件，从系统定义中重新获取
        if (!item.isCustom) {
          this.site.plugins.splice(index, 1);
        }
      }
    }

    if (systemSite && systemSite.plugins) {
      // 将系统定义的内容添加到最前面，确保基本库优先加载
      this.site.plugins = systemSite.plugins.concat(this.site.plugins);
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
              if (path.substr(0, 1) !== "/" && path.substr(0, 4) !== "http") {
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
              if (path.substr(0, 1) !== "/" && path.substr(0, 4) !== "http") {
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
          msg: i18n.t("backgroundServiceIsStoped") //"插件已被禁用过重启过，请刷新页面后再重试"
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
        //`${action} 执行出错，可能后台服务不可用`
        this.showNotice(
          i18n.t("actionExecutionFailed", {
            action
          })
        );
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

    // 启用拖放功能
    if (window.Drag) {
      let dragTitle = $(
        "<div class='pt-plugin-drag-title' title='" + i18n.t("dragTitle") + "'>"
      ).appendTo(this.buttonBar);

      new window.Drag(this.buttonBar.get(0), {
        handle: dragTitle.get(0),
        onStop: (result: any) => {
          console.log(result);
          this.saveButtonBarPosition(result);
        }
      });

      // 双击重置位置
      dragTitle.on("dblclick", () => {
        this.resetButtonBarPosition();
      });
    }

    this.logo = $(
      "<div class='pt-plugin-logo' title='" + i18n.t("pluginTitle") + "'/>"
    ).appendTo(this.buttonBar);
    this.logo.on("click", () => {
      this.call(EAction.openOptions);
    });
    this.initButtonBarPosition();
    this.buttonBar.hide();
  }

  /**
   * 初始化工具栏位置
   */
  private initButtonBarPosition() {
    let result = window.localStorage.getItem(this.positionStorageKey);
    if (result) {
      try {
        let position = JSON.parse(result);

        this.buttonBar.css({
          top: position.top,
          left: position.left
        });
        this.autoPosition = false;
        return;
      } catch (error) {
        console.log(error);
      }
    }
    this.buttonBar.css({
      top: window.innerHeight / 2,
      left: "unset"
    });

    if (this.options.position == EPluginPosition.left) {
      this.buttonBar.css({
        right: "unset",
        left: "5px"
      });
    }
  }

  /**
   * 重置工具栏位置
   */
  private resetButtonBarPosition() {
    window.localStorage.removeItem(this.positionStorageKey);
    this.autoPosition = true;
    this.initButtonBarPosition();
    this.recalculateButtonBarPosition();
  }

  /**
   * 保存工具栏位置
   * @param position
   */
  private saveButtonBarPosition(position: any) {
    window.localStorage.setItem(
      this.positionStorageKey,
      JSON.stringify(position)
    );
    this.autoPosition = false;
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
    let inner = $("<div class='pt-plugin-button-inner'/>").appendTo(button);
    let loading = $("<div class='pt-plugin-loading'/>").appendTo(button);
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

    let onSuccess = (result: any) => {
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
    };

    let onError = (error: any) => {
      if (options.type == EButtonType.normal) {
        loading.hide();
      }
      inner.show();
      this.showNotice({
        msg:
          error ||
          i18n.t("callbackFailed", {
            label: options.label
          }) // `${options.label} 发生错误，请重试。`
      });
    };

    if (options.click) {
      button.click(event => {
        if (options.type == EButtonType.normal) {
          inner.hide();
          loading.show();
        }

        (<any>options).click(onSuccess, onError, event);
      });
    }

    button.appendTo(this.buttonBar);

    // 是否指定了拖放事件
    if (options.onDrop) {
      this.addDroper(button, options.onDrop, onSuccess, onError);
    }

    this.buttons.push(button);
    this.recalculateButtonBarPosition();
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

      let line = button.data("line");
      if (line) {
        line.remove();
      }
      button.remove();
      this.buttons.splice(index, 1);
    }

    this.recalculateButtonBarPosition();
  }

  /**
   * 重新计算工具栏位置
   */
  public recalculateButtonBarPosition() {
    if (this.buttons.length > 0) {
      this.buttonBar.show();
    } else {
      this.buttonBar.hide();
    }
    if (!this.autoPosition) {
      return;
    }
    this.buttonBar.css({
      top: window.innerHeight / 2 - <any>this.buttonBar.outerHeight(true) / 2
    });
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
        width: 320,
        indeterminate: false
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

    let notice = new (<any>window)["NoticeJs"](options);

    if (options.indeterminate === true) {
      this.messageItems[notice.id] = notice;
      notice.show();
      return notice;
    }

    return $(notice.show());
  }

  /**
   * 隐藏并关闭指定消息
   * @param id
   */
  public hideMessage(id: string) {
    if (this.messageItems[id]) {
      this.messageItems[id].close();
    }
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

    // 替换目录中的关键字后再返回
    return this.pathHandler.replacePathKey(path, this.site);
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
      this.showDroper();
    });

    this.buttonBar.on("dragleave", (e: any) => {
      this.buttonBar.removeClass("pt-plugin-body-over");
    });

    this.buttonBar.on("mouseleave", (e: any) => {
      this.buttonBar.removeClass("pt-plugin-body-over");
      this.hideDroper();
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
        this.logo.addClass("pt-plugin-onLoading");
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
        this.hideDroper();

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
                this.logo.removeClass("pt-plugin-onLoading");
                return;
              }
              if (this.pageApp) {
                this.pageApp
                  .call(EAction.downloadFromDroper, data)
                  .then(() => {
                    this.logo.removeClass("pt-plugin-onLoading");
                  })
                  .catch(() => {
                    this.logo.removeClass("pt-plugin-onLoading");
                  });
              } else {
                this.showNotice({
                  type: EDataResultType.info,
                  msg: i18n.t("notSupported"), // "当前页面不支持此操作",
                  timeout: 3
                });
                this.logo.removeClass("pt-plugin-onLoading");
              }
            } else {
              this.logo.removeClass("pt-plugin-onLoading");
            }
          }
        } catch (error) {
          this.logo.removeClass("pt-plugin-onLoading");
        }
      },
      false
    );

    // 离开拖放时
    this.droper.on("dragleave dragend", (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      this.hideDroper();
      this.logo.removeClass("pt-plugin-onLoading");
      this.buttonBar.removeClass("pt-plugin-body-over");
    });
  }

  /**
   * 增加拖放对象
   * @param parent
   * @param onDrop
   */
  public addDroper(
    parent: any,
    onDrop: Function,
    onSuccess: Function,
    onError: Function
  ) {
    if (!onDrop) {
      return;
    }
    let droper: JQuery = $(
      "<div style='display:none;' class='pt-plugin-droper'/>"
    );

    droper.appendTo(this.buttonBar);
    // 拖入接收对象时
    droper.on("dragover", (e: any) => {
      //console.log(e);
      e.stopPropagation();
      e.preventDefault();
      this.buttonBar.addClass("pt-plugin-body-over");
    });

    // 拖放事件
    droper.on("drop", (e: any) => {
      console.log(e);
      e.stopPropagation();
      e.preventDefault();
      this.hideDroper();

      // 获取未处理的地址
      try {
        let data = JSON.parse(
          e.originalEvent.dataTransfer.getData("text/plain")
        );
        if (data && data.url) {
          onDrop.call(this, data, e, onSuccess, onError);
        }
      } catch (error) {
        // 错误时，尝试直接使用文本内容
        let data = e.originalEvent.dataTransfer.getData("text/plain");
        if (data) {
          data = {
            url: data
          };

          onDrop.call(this, data, e, onSuccess, onError);
        }
      }
    });

    // 离开拖放时
    droper.on("dragleave dragend", (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      this.hideDroper();
      this.buttonBar.removeClass("pt-plugin-body-over");
    });

    // 设置位置
    droper.offset(parent.position());
  }

  private hideDroper() {
    $(".pt-plugin-droper").hide();
  }

  private showDroper() {
    $(".pt-plugin-droper").show();
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

          case EAction.hideMessage:
            this.hideMessage(message.data);
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
      this.locationURL = location.href;
      this.initPages();
    }
  }

  /**
   * 加载页面选择器
   */
  private initPageSelector(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.call(EAction.getSiteSelectorConfig, {
        host: this.site.host,
        name: location.pathname
      })
        .then(result => {
          this.pageSelector = result;
          resolve();
        })
        .catch(() => {
          // 如果没有当前页面的选择器，则尝试获取通用的选择器
          this.call(EAction.getSiteSelectorConfig, {
            host: this.site.host,
            name: "common"
          })
            .then(result => {
              this.pageSelector = result;
              resolve();
            })
            .catch(() => {
              // 没有选择器
              resolve();
            });
        });
    });
  }

  /**
   * 从当前页面或指定DOM中获取指定字段的内容
   * @param fieldName 字段名称
   * @param content 指定的父元素，默认为 body
   * @return null 表示没有获取到内容
   */
  public getFieldValue(fieldName: string = "", content: any = $("body")) {
    let selector: any;
    console.log("getFieldValue", fieldName);
    if (this.pageSelector && this.pageSelector.fields) {
      selector = this.pageSelector.fields[fieldName];

      if (!selector) {
        return null;
      }
    } else {
      return null;
    }

    return this.infoParser.getFieldData(content, selector, this.pageSelector);
  }
}

// 暴露到 window 对象
Object.assign(window, {
  PTService: new PTPContent(),
  PPF
});
