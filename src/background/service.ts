import { EAction, Request, Options } from "../interface/common";
import Config from "./config";
import Controller from "./controller";

/**
 * PT 助手后台服务类
 */
export default class PTPlugin {
  // 当前配置对象
  public config: Config = new Config();
  public options: Options = {
    sites: [],
    clients: []
  };
  // 本地模式，用于本地快速调试
  public localMode: boolean = false;
  public controller: any;

  constructor(localMode: boolean = false) {
    this.localMode = localMode;
    this.readConfig().then(() => {
      this.init();
    });
  }

  /**
   * 接收由前台发回的指令并执行
   * @param action 指令
   * @param callback 回调函数
   */
  public requestMessage(request: Request, sender?: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let result: any;
      switch (request.action) {
        // 读取参数
        case EAction.readConfig:
          // this.config.read().then((result: any) => {
          //   console.log("PTPlugin.requestMessage.done:", result);
          //   this.options = result;
          //   resolve(result);
          // });
          if (this.localMode) {
            this.readConfig().then(() => {
              resolve(this.options);
            });
          } else {
            resolve(this.options);
          }

          break;

        // 保存参数
        case EAction.saveConfig:
          this.config.save(request.data);
          this.options = request.data;
          if (this.controller) {
            this.controller.options = this.options;
          }
          break;

        // 发送种子到默认下载客户端
        case EAction.sendTorrentToDefaultClient:
          this.controller
            .sendTorrentToDefaultClient(request.data)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
          break;

        // 发送种子到指定的客户端
        case EAction.sendTorrentToClient:
          this.controller
            .sendTorrentToClient(request.data)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
          break;

        // 复制指定的内容到剪切板
        case EAction.copyTextToClipboard:
          result = this.controller.copyTextToClipboard(request.data);
          if (result) {
            resolve(result);
          } else {
            reject();
          }
          break;

        // 获取可用空间
        case EAction.getFreeSpace:
          this.controller
            .getFreeSpace(request.data)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
          break;

        case EAction.openOptions:
          this.controller.openOptions();
          resolve(true);
          break;

        case EAction.updateOptionsTabId:
          this.controller.updateOptionsTabId(result.data);
          resolve(true);
          break;

        // 搜索种子
        case EAction.searchTorrent:
          console.log(request.data);
          this.controller.openOptions(request.data);
          resolve(true);
          // this.controller &&
          //   this.controller
          //     .searchTorrent(request.data)
          //     .then((result: any) => {
          //       resolve(result);
          //     })
          //     .catch((result: any) => {
          //       reject(result);
          //     });
          break;

        case EAction.getSearchResult:
          this.controller &&
            this.controller
              .getSearchResult(request.data)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
          break;

        // 获取下载记录
        case EAction.getDownloadHistory:
          this.controller &&
            this.controller
              .getDownloadHistory()
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
          break;

        // 删除下载记录
        case EAction.removeDownloadHistory:
          this.controller &&
            this.controller
              .removeDownloadHistory(request.data)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
          break;

        // 清除下载记录
        case EAction.clearDownloadHistory:
          this.controller &&
            this.controller
              .clearDownloadHistory()
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
          break;
      }
    });
  }

  private readConfig(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.config.read().then((result: any) => {
        this.options = result;
        resolve(result);
        if (!this.localMode) {
          this.controller = new Controller(this.options);
        }
      });
    });
  }

  public init() {
    if (!this.localMode) {
      this.initContextMenus();
    }
  }

  /**
   * 初始化上下文菜单
   */
  private initContextMenus() {
    chrome.contextMenus.removeAll();
    this.debug("initContextMenus", this.options);
    // 是否启用选择内容时搜索
    if (this.options.allowSelectionTextSearch) {
      // 选中内容进行搜索
      chrome.contextMenus.create({
        title: '搜索 "%s" 相关的种子',
        contexts: ["selection"],
        onclick: (data, tab) => {
          this.controller.openOptions(data.selectionText);
        }
      });
    }
  }

  private debug(...msg: any) {
    // console.log("background", ...msg);
  }
}
