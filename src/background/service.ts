import {
  EAction,
  Request,
  Options,
  EModule,
  ELogEvent,
  Site,
  SiteSchema,
  Dictionary,
  EUserDataRequestStatus
} from "@/interface/common";
import Config from "./config";
import Controller from "./controller";

import { Logger } from "@/service/logger";
import { ContextMenus } from "./contextMenus";
import { UserData } from "./userData";
import { PPF } from "@/service/public";
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
  // 事件处理器
  public controller: Controller = new Controller(this);
  // 日志处理器
  public logger: Logger = new Logger();
  // 上下文菜单处理器
  public contentMenus: ContextMenus = new ContextMenus(this);
  // 用户数据处理
  public userData: UserData = new UserData(this);

  private reloadCount: number = 0;
  private autoRefreshUserDataTimer: number = 0;
  private autoRefreshUserDataIsWorking: boolean = false;
  private autoRefreshUserDataFailedCount: number = 0;

  constructor(localMode: boolean = false) {
    this.initBrowserEvent();
    this.logger.add({
      module: EModule.background,
      event: ELogEvent.init
    });
    this.localMode = localMode;
    this.initConfig();
  }

  /**
   * 接收由前台发回的指令并执行
   * @param action 指令
   * @param callback 回调函数
   */
  public requestMessage(request: Request, sender?: any): Promise<any> {
    console.log("requestMessage", request.action);
    return new Promise<any>((resolve?: any, reject?: any) => {
      let result: any;
      if (
        ![
          EAction.getSystemLogs,
          EAction.writeLog,
          EAction.readConfig,
          EAction.saveConfig,
          EAction.saveUIOptions,
          EAction.openOptions
        ].includes(request.action)
      ) {
        this.logger.add({
          module: EModule.background,
          event: `${ELogEvent.requestMessage}.${request.action}`
        });
      }

      try {
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
            if (this.controller.isInitialized) {
              this.controller.reset(this.options);
            }
            this.contentMenus.init(this.options);
            this.resetAutoRefreshUserDataTimer();
            resolve(this.options);
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

          // 打开选项卡
          case EAction.openOptions:
            this.controller.openOptions(request.data);
            resolve(true);
            break;

          case EAction.updateOptionsTabId:
            this.controller.updateOptionsTabId(request.data);
            resolve(true);
            break;

          // 搜索种子
          case EAction.searchTorrent:
            console.log(request.data);
            this.controller.searchTorrent(request.data);
            resolve(true);
            break;

          // 测试客户是否可连接
          case EAction.testClientConnectivity:
            this.controller.clientController
              .testClientConnectivity(request.data)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                this.logger.add({
                  module: EModule.background,
                  event: `${EAction.testClientConnectivity}`,
                  msg: `测试客户连接失败[${request.data.address}]`,
                  data: result
                });
                reject(result);
              });
            break;

          case EAction.getSystemLogs:
            this.logger
              .load()
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;

          case EAction.removeSystemLogs:
            this.logger
              .remove(request.data)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;

          case EAction.clearSystemLogs:
            this.logger
              .clear()
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;

          case EAction.writeLog:
            this.logger.add(request.data);
            resolve(true);
            break;

          case EAction.readUIOptions:
            this.config
              .readUIOptions()
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;

          case EAction.saveUIOptions:
            this.config
              .saveUIOptions(request.data)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;

          // 如果没有特殊的情况默认使用处理器来处理
          default:
            this.controller
              .call(request, sender)
              .then((result: any) => {
                resolve(result);
              })
              .catch((result: any) => {
                reject(result);
              });
            break;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 初始化参数
   */
  private initConfig() {
    if (
      this.reloadCount < 10 &&
      (this.config.sites.length === 0 || this.config.clients.length === 0)
    ) {
      setTimeout(() => {
        this.initConfig();
      }, 500);
      this.reloadCount++;
      return;
    }

    this.readConfig().then(() => {
      this.init();
    });
  }

  /**
   * 读取参数信息
   */
  private readConfig(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.config.read().then((result: any) => {
        this.initUserData();
        this.options = result;
        resolve(result);
        if (!this.localMode) {
          this.controller.init(this.options);
        }
      });
    });
  }

  /**
   * 保存当前参数
   */
  public saveConfig() {
    this.config.save(this.options);
  }

  /**
   * 初始化用户数据
   */
  private initUserData() {
    this.options.sites.forEach((site: Site) => {
      site.user = this.userData.get(site.host as string);
    });
  }

  /**
   * 重设自动获取用户数据定时器
   */
  private resetAutoRefreshUserDataTimer(isInit: boolean = false) {
    clearInterval(this.autoRefreshUserDataTimer);
    if (!this.options.autoRefreshUserData) {
      return;
    }

    // 先尝试当天
    this.options.autoRefreshUserDataNextTime = this.getNextTime(0);
    // 如果当前下次获取时间小于当前时间，则设置为第二天
    if (new Date().getTime() >= this.options.autoRefreshUserDataNextTime) {
      // 初始化时，10 秒后获取数据
      if (isInit) {
        // 如果当天还没有获取过，就重新获取
        if (
          PPF.getToDay() !=
          PPF.getToDay(this.options.autoRefreshUserDataLastTime)
        ) {
          this.options.autoRefreshUserDataNextTime =
            new Date().getTime() + 10000;
        } else {
          this.options.autoRefreshUserDataNextTime = this.getNextTime();
        }
      } else {
        this.options.autoRefreshUserDataNextTime = this.getNextTime();
      }
    }

    this.autoRefreshUserDataFailedCount = 0;
    let failedRetryCount =
      this.options.autoRefreshUserDataFailedRetryCount || 3;
    let failedRetryInterval =
      this.options.autoRefreshUserDataFailedRetryInterval || 5;

    this.autoRefreshUserDataTimer = setInterval(() => {
      let time = new Date().getTime();

      if (
        this.options.autoRefreshUserDataNextTime &&
        time >= this.options.autoRefreshUserDataNextTime &&
        !this.autoRefreshUserDataIsWorking
      ) {
        this.options.autoRefreshUserDataNextTime = this.getNextTime();
        this.autoRefreshUserDataIsWorking = true;
        this.controller.userService
          .refreshUserData(this.autoRefreshUserDataFailedCount > 0)
          .then((results: any) => {
            this.debug("refreshUserData DONE.", results);
            this.autoRefreshUserDataIsWorking = false;
            let haveError = false;
            results.some((result: any) => {
              if (!result) {
                haveError = true;
                return true;
              }

              if (!result.id) {
                if (
                  result.msg &&
                  result.msg.status != EUserDataRequestStatus.notSupported
                ) {
                  haveError = true;
                  return true;
                }
              }
            });

            if (haveError) {
              // 失败重试
              if (this.autoRefreshUserDataFailedCount < failedRetryCount) {
                // 设置几分钟后重试
                this.options.autoRefreshUserDataNextTime =
                  new Date().getTime() + failedRetryInterval * 60000;
                this.debug(
                  "数据刷新失败, 下次重试时间",
                  new Date(this.options
                    .autoRefreshUserDataNextTime as number).toLocaleString()
                );
              } else {
                this.debug("数据刷新失败, 重试次数已超限制");
              }
              this.autoRefreshUserDataFailedCount++;
            } else {
              this.debug("数据刷新完成");
              this.autoRefreshUserDataFailedCount = 0;
            }
          });
      }
    }, 1000);
  }

  /**
   * 获取下一个时间
   * @param addDays
   */
  private getNextTime(addDays: number = 1) {
    let today = PPF.getToDay();
    let time = new Date(
      `${today} ${this.options.autoRefreshUserDataHours}:${
        this.options.autoRefreshUserDataMinutes
      }:00`
    );

    return new Date(time.setDate(time.getDate() + addDays)).getTime();
  }

  /**
   * 保存用户数据
   */
  public saveUserData() {
    this.initUserData();
    this.config.save(this.options);
  }

  /**
   * 服务初始化
   */
  public init() {
    if (!this.localMode) {
      this.contentMenus.init(this.options);
      this.resetAutoRefreshUserDataTimer(true);
    }
  }

  /**
   * 输出调试信息
   * @param msg
   */
  public debug(...msg: any) {
    console.log(new Date().toLocaleString(), ...msg);
  }

  /**
   * 初始化浏览器事件
   */
  private initBrowserEvent() {
    if (window.chrome === undefined) {
      return;
    }
    console.log("service.initBrowserEvent");
    // 监听由活动页面发来的消息事件
    chrome.runtime &&
      chrome.runtime.onMessage &&
      chrome.runtime.onMessage.addListener(
        (message: any, sender: chrome.runtime.MessageSender, callback) => {
          this.requestMessage(message, sender)
            .then((result: any) => {
              callback && callback(result);
            })
            .catch((result: any) => {
              callback && callback(result);
            });
          // 这句不能去掉
          return true;
        }
      );
  }

  /**
   * 获取指定解析器
   * @param host
   * @param name
   */
  public getSiteParser(host: string, name: string): string {
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

      result = schema.parser && schema.parser[name];
    }
    return result;
  }

  /**
   * 获取指定选择器
   * @param host
   * @param name
   */
  public getSiteSelector(host: string, name: string): Dictionary<any> | null {
    // 由于选择器可能会更新，所以需要从系统配置中加载
    let site: Site =
      this.options.system &&
      this.options.system.sites &&
      this.options.system.sites.find((item: Site) => {
        return item.host === host;
      });

    if (!site) {
      return null;
    }

    let result = site.selectors && site.selectors[name];
    if (!result) {
      let schema: SiteSchema =
        this.options.system &&
        this.options.system.schemas &&
        this.options.system.schemas.find((item: SiteSchema) => {
          return item.name === site.schema;
        });
      if (schema && schema.selectors) {
        result = schema.selectors[name];
      }
    }
    return result;
  }
}
