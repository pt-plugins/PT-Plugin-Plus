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
  ESizeUnit
} from "../interface/common";
import { APP } from "../service/api";
import { filters } from "../service/filters";

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

  public schema: SiteSchema = {};

  private scripts: any[] = [];
  private styles: any[] = [];

  public buttonBar: JQuery = <any>null;
  public droper: JQuery = $("<div style='display:none;' class='droper'/>");
  private buttons: any[] = [];
  private buttonBarHeight: number = 0;
  private logo: JQuery = <any>null;

  // 用于接收页面程序
  public pageApp: any;

  constructor() {
    this.extension = new Extension();
    if (this.extension.isExtensionMode) {
      this.readConfig();
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
  }

  /**
   * 初始化符合条件的附加页面
   */
  private initPages() {
    // 判断当前页面的所属站点是否已经被定义
    if (this.options.sites.length) {
      this.site = this.options.sites.find((item: any) => {
        return item.host == window.location.hostname;
      });
    }

    // 如果当前站点未定义，则不再继续操作
    if (this.site && this.site.name) {
      this.schema = this.options.system.schemas.find((item: SiteSchema) => {
        return item.name == this.site.schema;
      });
    } else {
      return;
    }

    let site = this.options.system.sites.find((item: Site) => {
      return item.name == this.site.name;
    });

    this.site.plugins = site.plugins;
    // Object.assign(this.site.plugins, site.plugins);

    // 初始化插件按钮列表
    this.initButtonBar();
    this.initDroper();

    // 获取符合当前网站所需要的附加脚本
    this.schema.plugins.forEach((plugin: Plugin) => {
      let index = plugin.pages.findIndex((page: string) => {
        return window.location.pathname.indexOf(page) !== -1;
      });

      if (index !== -1) {
        plugin.scripts.forEach((script: string) => {
          this.scripts.push(`schemas/${this.schema.name}/${script}`);
        });
      }
    });

    // 网站指定的脚本
    if (this.site.plugins) {
      this.site.plugins.forEach((plugin: Plugin) => {
        let index = plugin.pages.findIndex((page: string) => {
          return window.location.pathname.indexOf(page) !== -1;
        });

        if (index !== -1) {
          plugin.scripts.forEach((script: string) => {
            this.scripts.push(`sites/${this.site.host}/${script}`);
          });

          if (plugin.styles) {
            plugin.styles.forEach((style: string) => {
              this.styles.push(`sites/${this.site.host}/${style}`);
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
      this.scripts.forEach((path: string) => {
        APP.execScript(path);
      });
    }
  }

  /**
   * 调用一个方法
   * @param action 需要执行的命令
   * @param data 额外需要传递的数据
   * @return Promise
   */
  public call(action: EAction, data?: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.extension.sendRequest(
        action,
        (result: any) => {
          if (result) {
            resolve(result);
          } else {
            reject();
          }
        },
        data
      );
    });
  }

  /**
   * 初始化按钮栏
   */
  private initButtonBar() {
    this.buttonBar = $("<div class='pt-plugin-body'/>").appendTo(document.body);
    this.logo = $("<div class='logo'/>").appendTo(this.buttonBar);
    this.buttonBarHeight = this.buttonBar.get(0).scrollHeight - 3;
    // console.log(this.buttonBarHeight);
    this.buttonBar.hide();
  }

  /**
   * 添加一个按钮
   * @param options 按钮参数
   */
  public addButton(options: ButtonOption) {
    let line = $("<hr/>").appendTo(this.buttonBar);
    let buttonType = "<a class='button'/>";
    if (!options.click) {
      buttonType = "<span class='button'/>";
    }
    let button = $(buttonType).attr("title", options.title);
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
      button.click(() => {
        inner.hide();
        loading.show();
        // success.show();
        // console.log((<any>options).click);
        (<any>options).click(
          (result: any) => {
            loading.hide();
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
            loading.hide();
            inner.show();
            this.showNotice({
              msg: error || `${options.label} 发生错误，请重试。`
            });
            // new (<any>window)["NoticeJs"]({
            //   type: "error",
            //   text: error || `${options.label} 发生错误，请重试。`,
            //   position: "bottomRight",
            //   timeout: 50
            // }).show();
          }
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
   * 显示消息提示
   * @param options 需要显示的消息选项
   * @return DOM
   */
  public showNotice(options: NoticeOptions | string) {
    options = Object.assign(
      {
        type: "error",
        timeout: 5,
        position: "bottomRight",
        progressBar: true,
        width: 320
      },
      typeof options === "string" ? { msg: options } : options
    );

    options.text = options.text || options.msg;
    if (options.timeout) {
      options.timeout = options.timeout * 10;
    }
    delete options.msg;

    return new (<any>window)["NoticeJs"](options).show();
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
        e.dataTransfer.dropEffect = "copy";
        if (e.target.tagName == "A") {
          e.dataTransfer.setData("text/plain", e.target.getAttribute("href"));
        }
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
        let url = e.dataTransfer.getData("text/plain");

        if (url && this.pageApp) {
          this.pageApp.call(EAction.downloadFromDroper, url).then(() => {
            this.logo.removeClass("onLoading");
          });
        } else {
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
}

// 暴露到 window 对象
Object.assign(window, {
  PTSevrice: new PTPContent()
});
