import {
  Site,
  Dictionary,
  EModule,
  UserInfo,
  EUserDataRequestStatus,
  ERequestResultType,
  ERequestMethod
} from "@/interface/common";
import PTPlugin from "./service";
import { InfoParser } from "./infoParser";
import { APP } from "@/service/api";
import { PPF } from "@/service/public";

type Service = PTPlugin;

export class User {
  private requestQueue: any = {};
  private requestQueueCount: number = 0;
  private infoParserCache: Dictionary<any> = {};

  // 用于脚本解析器调用
  public InfoParser = InfoParser;

  constructor(public service: Service) {}

  /**
   * 刷新用户数据
   * @param failedOnly 是否仅刷新最近状态为失败的站点
   */
  public refreshUserData(failedOnly: boolean = false): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let requests: any[] = [];
      this.service.options.sites.forEach((site: Site) => {
        if (!site.allowGetUserInfo || site.offline) {
          return false;
        }

        if (!failedOnly) {
          requests.push(this.getUserInfo(site, true));
        } else if (
          site.user &&
          ((site.user.lastUpdateStatus &&
            [
              EUserDataRequestStatus.needLogin,
              EUserDataRequestStatus.unknown
            ].includes(site.user.lastUpdateStatus)) ||
            !site.user.lastUpdateStatus)
        ) {
          requests.push(this.getUserInfo(site, true));
        }
      });

      Promise.all(requests).then(results => {
        resolve(results);
      });
    });
  }

  updateStatus(site: Site, userInfo: UserInfo) {
    userInfo.lastUpdateTime = new Date().getTime();
    this.service.userData.update(site, userInfo);
  }

  private getSiteURL(site: Site) {
    if (site.cdn && site.cdn.length > 0) {
      return site.cdn[0];
    }

    return site.url;
  }

  /**
   * 获取指定站点的用户信息
   * @param site
   * @param returnResolve 指定为 true 时，失败时也调用 resolve
   */
  public getUserInfo(site: Site, returnResolve: boolean = false): Promise<any> {
    this.service.options.autoRefreshUserDataLastTime = new Date().getTime();
    this.service.saveConfig();
    return new Promise<any>((resolve?: any, reject?: any) => {
      let rejectFN = returnResolve ? resolve : reject;
      if (!site) {
        rejectFN(null);
        return;
      }

      // 获取最近一次数据
      let userInfo: UserInfo =
        this.service.userData.get(site.host as string) || {};

      let rule = this.service.getSiteSelector(site, "userBaseInfo");
      if (!rule) {
        userInfo.lastUpdateStatus = EUserDataRequestStatus.notSupported;
        this.updateStatus(site, userInfo);
        rejectFN(
          APP.createErrorMessage({
            status: EUserDataRequestStatus.notSupported,
            msg: this.service.i18n.t("service.user.notSupported") // "暂不支持"
          })
        );

        return;
      }

      let url: string = `${this.getSiteURL(site)}${rule.page}`;
      let host = site.host as string;
      // 上次请求未完成时，直接返回最近的数据
      if (this.checkQueue(host, url)) {
        resolve(userInfo);
        return;
      }

      // 获取用户基本信息（用户名、ID、是否登录等）
      this.getInfos(host, url, rule)
        .then((result: any) => {
          console.log("userBaseInfo", host, result);
          userInfo = Object.assign({}, result);
          // 是否已定义已登录选择器
          if (rule && rule.fields && rule.fields.isLogged) {
            // 如果已定义则以选择器匹配为准
            if (userInfo.isLogged && (userInfo.name || userInfo.id)) {
              userInfo.isLogged = true;
            } else {
              userInfo.isLogged = false;
            }
          } else if (userInfo.name || userInfo.id) {
            userInfo.isLogged = true;
          }

          if (!userInfo.isLogged) {
            userInfo.lastUpdateStatus = EUserDataRequestStatus.needLogin;
            //this.updateStatus(site, userInfo);

            rejectFN(
              APP.createErrorMessage({
                msg: this.service.i18n.t("service.user.notLogged"), //"未登录",
                status: EUserDataRequestStatus.needLogin
              })
            );
            return;
          }

          rule = this.service.getSiteSelector(site, "userExtendInfo");

          if (!rule) {
            this.updateStatus(site, userInfo);
            resolve(userInfo);
            return;
          }

          if (userInfo.name || userInfo.id) {
            let url = `${this.getSiteURL(site)}${rule.page
              .replace("$user.id$", userInfo.id)
              .replace("$user.name$", userInfo.name)
              .replace("$user.bonusPage$", userInfo.bonusPage)
              .replace("$user.unsatisfiedsPage$", userInfo.unsatisfiedsPage)}`;
            // 上次请求未完成时，直接返回最近的数据
            if (this.checkQueue(host, url)) {
              resolve(userInfo);
              return;
            }

            this.getInfos(host, url, rule, site, userInfo)
              .then((result: any) => {
                userInfo = Object.assign(userInfo, result);

                userInfo.lastUpdateStatus = EUserDataRequestStatus.success;
                this.updateStatus(site, userInfo);
                this.getMoreInfos(site, userInfo).then(() => {
                  resolve(userInfo);
                });
              })
              .catch((error: any) => {
                userInfo.lastUpdateStatus = EUserDataRequestStatus.unknown;
                //this.updateStatus(site, userInfo);
                rejectFN(APP.createErrorMessage(error));
              });
          } else {
            userInfo.lastUpdateStatus = EUserDataRequestStatus.unknown;
            //this.updateStatus(site, userInfo);
            rejectFN(
              APP.createErrorMessage({
                status: EUserDataRequestStatus.unknown,
                msg: this.service.i18n.t("service.user.getUserInfoFailed") //"获取用户名和编号失败"
              })
            );
          }
        })
        .catch((error: any) => {
          userInfo.lastUpdateStatus = EUserDataRequestStatus.unknown;
          console.log("getInfos Error :",error);
          //this.updateStatus(site, userInfo);
          rejectFN(APP.createErrorMessage(error));
        });
    });
  }

  /**
   * 获取更多用户信息（如有有定义的话）
   * @param site
   * @param userInfo
   */
  public getMoreInfos(site: Site, userInfo: UserInfo): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let requests: any[] = [];
      let selectors = ["userSeedingTorrents", "bonusExtendInfo", "hnrExtendInfo", "levelExtendInfo", "userUploadedTorrents"];

      selectors.forEach((name: string) => {
        let host = site.host as string;
        let rule = this.service.getSiteSelector(site, name);

        if (rule) {
          let url = `${this.getSiteURL(site)}${rule.page
            .replace("$user.id$", userInfo.id)
            .replace("$user.name$", userInfo.name)
            .replace("$user.bonusPage$", userInfo.bonusPage)
            .replace("$user.unsatisfiedsPage$", userInfo.unsatisfiedsPage)}`;
          // 上次请求未完成时，跳过
          if (this.checkQueue(host, url)) {
            return;
          }

          // 执行该规则的前提条件（条件表达式）
          if (rule.prerequisites) {
            // user 用于条件中执行的内容
            const user = userInfo;
            try {
              let result = eval(rule.prerequisites);
              if (result !== true) {
                return;
              }
            } catch (error) {
              console.log(error);
              return;
            }
          }

          requests.push(this.getInfos(host, url, rule, site, userInfo));
        }
      });
      if (requests.length) {
        // 不管是否成功都执行 resolve 回调
        Promise.all(requests)
          .then((results: any[]) => {
            results.forEach((result: any) => {
              userInfo = Object.assign(userInfo, result);

              userInfo.lastUpdateStatus = EUserDataRequestStatus.success;
              this.updateStatus(site, userInfo);
            });

            resolve(userInfo);
          })
          .catch(result => {
            resolve(userInfo);
          });
      } else {
        resolve(userInfo);
      }
    });
  }

  /**
   * getInfos
   */
  public getInfos(
    host: string,
    url: string,
    rule: Dictionary<any>,
    site?: Site,
    userInfo?: UserInfo
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      url = url
        .replace("://", "****")
        .replace(/\/\//g, "/")
        .replace("****", "://");

      let requestData = rule.requestData;
      if (requestData && userInfo) {
        try {
          for (const key in requestData) {
            if (requestData.hasOwnProperty(key)) {
              const value = requestData[key];
              requestData[key] = PPF.replaceKeys(value, userInfo, "user");
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
      let headers = rule.headers;
      if (headers && userInfo) {
        try {
          for (const key in headers) {
            if (headers.hasOwnProperty(key)) {
              const value = headers[key];
              headers[key] = PPF.replaceKeys(value, userInfo, "user");
            }
          }
        } catch (error) {
          console.log(error);
        }
      }

      /**
       * 是否有脚本解析器
       */
      if (rule.parser && site) {
        this.runParser(rule, site, userInfo, resolve, reject);
        return;
      }

      PPF.updateBadge(++this.requestQueueCount);

      let request = $.ajax({
        url,
        method: rule.requestMethod || ERequestMethod.GET,
        dataType: "text",
        data: requestData,
        headers: rule.headers,
        timeout: this.service.options.connectClientTimeout || 30000
      })
        .done(result => {
          this.removeQueue(host, url);
          PPF.updateBadge(--this.requestQueueCount);
          let content: any;
          try {
            if (rule.dataType !== ERequestResultType.JSON) {
              let doc = new DOMParser().parseFromString(result, "text/html");
              // 构造 jQuery 对象
              let topElement = rule.topElement || "body";
              content = $(doc).find(topElement);
            } else {
              content = JSON.parse(result);
            }
          } catch (error) {
            this.service.debug("getInfos.error", host, url, error);
            reject(error);
            return;
          }

          if (content && rule) {
            try {
              let results = new InfoParser().getResult(content, rule);
              resolve(results);
            } catch (error) {
              this.service.debug(error);
              reject(error);
            }
          }
        })
        .fail((jqXHR, textStatus, errorThrown) => {
          this.removeQueue(host, url);
          PPF.updateBadge(--this.requestQueueCount);
          let msg = this.service.i18n.t("service.searcher.siteNetworkFailed", {
            site,
            msg: `${jqXHR.status} ${errorThrown}, ${textStatus}`
          });
          this.service.debug(msg, host, url, jqXHR.responseText);
          reject(msg);
        });

      this.addQueue(host, url, request);
    });
  }

  /**
   * 执行脚本解析器
   * @param rule
   * @param site
   * @param userInfo
   * @param resolve
   * @param reject
   */
  public runParser(
    rule: Dictionary<any>,
    site: Site,
    userInfo?: UserInfo,
    resolve?: any,
    reject?: any
  ) {
    let siteConfigPath = site.schema == "publicSite" ? "publicSites" : "sites";

    if (site.path) {
      siteConfigPath += `/${site.path}`;
    } else {
      siteConfigPath += `/${site.host}`;
    }

    let path = rule.parser;
    // 判断是否为相对路径
    if (path.substr(0, 1) !== "/" && path.substr(0, 4) !== "http") {
      path = `${siteConfigPath}/${path}`;
    }

    // 传递给解析解析的参数
    let _options = {
      site,
      rule,
      userInfo,
      resolve,
      reject
    };

    // 当前对象
    let _self = this;

    let script = this.infoParserCache[path];
    if (script) {
      eval(script);
    } else {
      APP.getScriptContent(path).done(script => {
        this.infoParserCache[path] = script;
        eval(script);
      });
    }
  }

  public addQueue(host: string, url: string, request: any) {
    let queues = this.requestQueue[host] || {};
    queues[url] = request;
    this.requestQueue[host] = queues;
  }

  public checkQueue(host: string, url: string): boolean {
    let queues = this.requestQueue[host] || {};
    return queues[url] ? true : false;
  }

  public removeQueue(host: string, url: string) {
    let queues = this.requestQueue[host] || {};
    if (queues[url]) {
      delete queues[url];
    }
    this.requestQueue[host] = queues;
  }

  /**
   * 取消正在执行的搜索请求
   * @param site
   * @param key
   */
  public abortGetUserInfo(site: Site): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let host = site.host as string;
      let queues = this.requestQueue[host];
      let errors: any[] = [];

      if (queues) {
        for (const key in queues) {
          if (queues.hasOwnProperty(key)) {
            const request = queues[key];
            try {
              request.abort();
            } catch (error) {
              this.service.logger.add({
                module: EModule.background,
                event: "user.abortGetUserInfo.error",
                msg: this.service.i18n.t("service.user.abortGetUserInfoFailed"), //"取消获取用户信息请求失败",
                data: {
                  site: site.host,
                  error
                }
              });
              errors.push(error);
            }
          }
        }
        delete this.requestQueue[host];
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(true);
      }
    });
  }

  // MAM需要在访问API时传入存于Cookies中的mam_id，构建这个辅助方法以便获取Cookie
  public getCookie(site: Site, needle: String): Promise<any> {
    return new Promise((resolve, reject) => {
      PPF.checkPermissions(["cookies"]).then(() => {
        this.service.config.getCookiesFromSite(site).then((result) => {
          for (const cookie of result.cookies) {
            if (cookie["name"] === needle) {
              resolve(cookie["value"]);
            }
          }
          resolve("");
        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        reject(error);
      });
    });
  }
}
