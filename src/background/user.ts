import {
  Site,
  Dictionary,
  EModule,
  UserInfo,
  EUserDataRequestStatus
} from "@/interface/common";
import PTPlugin from "./service";
import { InfoParser } from "./infoParser";
import { APP } from "@/service/api";
import { PPF } from "@/service/public";

type Service = PTPlugin;

export class User {
  private requestQueue: any = {};
  private requestQueueCount: number = 0;

  constructor(public service: Service) {}

  /**
   * 刷新用户数据
   * @param failedOnly 是否仅刷新最近状态为失败的站点
   */
  public refreshUserData(failedOnly: boolean = false): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let requests: any[] = [];
      this.service.options.sites.forEach((site: Site) => {
        if (!site.allowGetUserInfo) {
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

      let rule = this.service.getSiteSelector(
        site.host as string,
        "userBaseInfo"
      );
      if (!rule) {
        userInfo.lastUpdateStatus = EUserDataRequestStatus.notSupported;
        this.updateStatus(site, userInfo);
        rejectFN(
          APP.createErrorMessage({
            status: EUserDataRequestStatus.notSupported,
            msg: "暂不支持"
          })
        );

        return;
      }

      let url: string = `${site.url}${rule.page}`;
      let host = site.host as string;
      // 上次请求未完成时，直接返回最近的数据
      if (this.checkQueue(host, url)) {
        resolve(userInfo);
        return;
      }

      // 获取用户基本信息（用户名、ID、是否登录等）
      this.getInfos(host, url, rule)
        .then((result: any) => {
          delete this.requestQueue[`${site.host}-base`];
          userInfo = Object.assign({}, result);

          if (!userInfo.isLogged) {
            userInfo.lastUpdateStatus = EUserDataRequestStatus.needLogin;
            this.updateStatus(site, userInfo);

            rejectFN(
              APP.createErrorMessage({
                msg: "未登录",
                status: EUserDataRequestStatus.needLogin
              })
            );
            return;
          }

          rule = this.service.getSiteSelector(
            site.host as string,
            "userExtendInfo"
          );

          if (!rule) {
            userInfo.lastUpdateStatus = EUserDataRequestStatus.notSupported;
            this.updateStatus(site, userInfo);
            rejectFN(
              APP.createErrorMessage({
                status: EUserDataRequestStatus.notSupported,
                msg: "没有找到 userExtendInfo 选择器"
              })
            );
            return;
          }

          if (userInfo.name || userInfo.id) {
            let url = `${site.url}${rule.page
              .replace("$user.id$", userInfo.id)
              .replace("$user.name$", userInfo.name)}`;
            // 上次请求未完成时，直接返回最近的数据
            if (this.checkQueue(host, url)) {
              resolve(userInfo);
              return;
            }

            this.getInfos(host, url, rule)
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
                this.updateStatus(site, userInfo);
                rejectFN(APP.createErrorMessage(error));
              });
          } else {
            userInfo.lastUpdateStatus = EUserDataRequestStatus.unknown;
            this.updateStatus(site, userInfo);
            rejectFN(
              APP.createErrorMessage({
                status: EUserDataRequestStatus.unknown,
                msg: "获取用户名和编号失败"
              })
            );
          }
        })
        .catch((error: any) => {
          userInfo.lastUpdateStatus = EUserDataRequestStatus.unknown;
          this.updateStatus(site, userInfo);
          delete this.requestQueue[`${site.host}-base`];
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
      let selectors = ["userSeedingTorrents"];

      selectors.forEach((name: string) => {
        let host = site.host as string;
        let rule = this.service.getSiteSelector(host, name);

        if (rule) {
          let url = `${site.url}${rule.page
            .replace("$user.id$", userInfo.id)
            .replace("$user.name$", userInfo.name)}`;
          // 上次请求未完成时，跳过
          if (this.checkQueue(host, url)) {
            return;
          }

          requests.push(this.getInfos(host, url, rule));
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
    rule: Dictionary<any>
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      url = url
        .replace("://", "****")
        .replace(/\/\//g, "/")
        .replace("****", "://");
      PPF.updateBadge(++this.requestQueueCount);
      let request = $.ajax({
        url,
        dataType: "text",
        contentType: "text/plain",
        timeout:
          (this.service.options.search &&
            this.service.options.search.timeout) ||
          30000
      })
        .done(result => {
          this.removeQueue(host, url);
          PPF.updateBadge(--this.requestQueueCount);
          let doc = new DOMParser().parseFromString(result, "text/html");
          // 构造 jQuery 对象
          let content = $(doc).find("body");
          if (content && rule) {
            try {
              let results = new InfoParser(this.service).getResult(
                content,
                rule
              );
              resolve(results);
            } catch (error) {
              this.service.debug(error);
              reject(error);
            }
          }
        })
        .fail(error => {
          this.removeQueue(host, url);
          PPF.updateBadge(--this.requestQueueCount);
          reject(error);
        });

      this.addQueue(host, url, request);
    });
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
                msg: "取消获取用户信息请求失败",
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
}
