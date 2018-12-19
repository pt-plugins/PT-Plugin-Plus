import Extension from "../service/extension";
import {
  Options,
  EAction,
  Site,
  SiteSchema,
  Plugin,
  ButtonOption,
  NoticeOptions,
  EDownloadClientType
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

  public schema: SiteSchema = {};

  private scripts: any[] = [];
  private styles: any[] = [];

  public buttonBar: JQuery = <any>null;
  public droper: JQuery = $("<div style='display:none;' class='droper'/>");
  private buttons: any[] = [];
  private buttonBarHeight: number = 0;

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
    $("<div class='logo'/>").appendTo(this.buttonBar);
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
              this.showNotice({
                type: "success",
                msg: result.msg
              });
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
   */
  public showNotice(options: NoticeOptions) {
    options = Object.assign(
      {
        type: "error",
        timeout: 5,
        position: "bottomRight"
      },
      options
    );
    new (<any>window)["NoticeJs"]({
      type: options.type,
      text: options.msg,
      position: options.position,
      timeout: <number>options.timeout * 10
    }).show();
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
      },
      false
    );

    this.droper[0].addEventListener(
      "drop",
      (e: any) => {
        //console.log(e);
        e.stopPropagation();
        e.preventDefault();
        this.droper.hide();

        var url = e.dataTransfer.getData("text/plain");
        console.log(url);

        if (!this.site.passkey) {
          this.showNotice({
            msg: "请先设置站点密钥（Passkey）。"
          });
          return;
        }

        if (url) {
          // if (this.site.dropScript)
          // {
          // 	var _script = system.site.dropScript.replace("\$input-url\$",url);
          // 	_script = _script.replace("\$input-host\$",system.site.host);
          // 	_script = _script.replace("\$input-passkey\$",system.site.passkey);
          // 	url = eval(_script);
          // 	//url = url.replace("\$site\$",system.site.host);
          // 	url = url.replace("\$host\$",system.site.host);
          // 	url = url.replace("\$passkey\$",system.site.passkey);
          // }
          // else
          // {
          // 	id = url.getQueryString("id");
          // 	if (id) {
          // 		if (system.site && system.config.droptosend) {
          // 			// 如果站点没有配置禁用https，则默认添加https链接
          // 			url = system.site.host + "download.php?id=" + id + "&passkey=" + system.site.passkey + (system.site.disableHttps?"":"&https=1");
          // 		}
          // 	}
          // }
          // console.log(url);
          // var folder = null;
          // if (system.site.defaultFolder) {
          // 	folder = system.site.defaultFolder;
          // } else if (system.site.folders.length > 0) {
          // 	folder = system.site.folders[0];
          // }
          // system.showStatusMessage("正在发送链接地址 " + (url.replace(system.site.passkey, "***")) + " 到下载服务器", 0);
          // chrome.extension.sendMessage({
          // 	action: "send-url-to-client",
          // 	url: url,
          // 	folder: folder
          // }, function(result) {
          // 	system.showStatusMessage(result.msg, 5);
          // });
        }
        //console.log(e.dataTransfer.getData('text/plain'));
        //system.debug("drop.e.dataTransfer:",e.dataTransfer);
        //system.checkDropFiles(e.dataTransfer.files);
      },
      false
    );

    // 离开拖放时
    this.droper.on("dragleave", (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      this.droper.hide();
      //system.debug("dragleave");
    });
  }
}

// 暴露到 window 对象
Object.assign(window, {
  PTSevrice: new PTPContent()
});
