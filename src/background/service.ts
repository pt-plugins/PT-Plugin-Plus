import { EAction, Request, Options } from "../interface/common";
import Config from "./config";
import Controler from "./controler";

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
  public controler: any;

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
          if (this.controler) {
            this.controler.options = this.options;
          }
          break;

        // 发送种子到默认下载客户端
        case EAction.sendTorrentToDefaultClient:
          this.controler
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
          this.controler
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
          result = this.controler.copyTextToClipboard(request.data);
          if (result) {
            resolve(result);
          } else {
            reject();
          }
          break;

        // 获取可用空间
        case EAction.getFreeSpace:
          this.controler
            .getFreeSpace(request.data)
            .then((result: any) => {
              resolve(result);
            })
            .catch((result: any) => {
              reject(result);
            });
          break;

        case EAction.openOptions:
          this.controler.openOptions();
          resolve(true);
          break;

        case EAction.updateOptionsTabId:
          this.controler.updateOptionsTabId(result.data);
          resolve(true);
          break;

        // 搜索种子
        case EAction.searchTorrent:
          console.log(request.data);
          this.controler.openOptions(request.data);
          resolve(true);
          // this.controler &&
          //   this.controler
          //     .searchTorrent(request.data)
          //     .then((result: any) => {
          //       resolve(result);
          //     })
          //     .catch((result: any) => {
          //       reject(result);
          //     });
          break;

        case EAction.getSearchResult:
          this.controler &&
            this.controler
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
          this.controler &&
            this.controler
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
          this.controler &&
            this.controler
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
          this.controler &&
            this.controler
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
          this.controler = new Controler(this.options);
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
          this.controler.openOptions(data.selectionText);
        }
      });
    }
  }

  private debug(...msg: any) {
    // console.log("background", ...msg);
  }
}
