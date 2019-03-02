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

type Service = PTPlugin;

export class User {
  private requestQueue: Dictionary<JQueryXHR> = {};

  constructor(public service: Service) {}

  public refreshUserData() {}

  /**
   * 获取指定站点的用户信息
   * @param site
   * @param callback
   */
  public getUserInfo(site: Site): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!site) {
        reject(null);
        return;
      }

      // 获取最近一次数据
      let userInfo: UserInfo = this.service.userData.get(site.host as string);

      let rule = this.service.getSiteSelector(
        site.host as string,
        "userBaseInfo"
      );
      if (!rule) {
        reject(
          APP.createErrorMessage({
            status: EUserDataRequestStatus.notSupported,
            msg: "暂不支持"
          })
        );
        return;
      }

      // 上次请求未完成时，直接返回最近的数据
      if (this.requestQueue[`${site.host}-base`]) {
        resolve(userInfo);
        return;
      }

      let url: string = `${site.url}${rule.page}`;
      this.requestQueue[`${site.host}-base`] = this.getInfos(
        url,
        rule,
        (result: any) => {
          delete this.requestQueue[`${site.host}-base`];
          userInfo = Object.assign({}, result);

          if (!userInfo.isLogged) {
            reject(
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
            reject(
              APP.createErrorMessage({
                status: EUserDataRequestStatus.notSupported,
                msg: "没有找到 userExtendInfo 选择器"
              })
            );
            return;
          }

          if (userInfo.id) {
            // 上次请求未完成时，直接返回最近的数据
            if (this.requestQueue[`${site.host}-extend`]) {
              resolve(userInfo);
              return;
            }

            this.requestQueue[`${site.host}-extend`] = this.getInfos(
              `${site.url}${rule.page.replace("$userId$", userInfo.id)}`,
              rule,
              (result: any) => {
                delete this.requestQueue[`${site.host}-extend`];
                userInfo = Object.assign(userInfo, result);
                userInfo.lastUpdateTime = new Date().getTime();
                this.service.userData.update(site, userInfo);
                resolve(userInfo);
              },
              (error: any) => {
                delete this.requestQueue[`${site.host}-extend`];
                reject(APP.createErrorMessage(error));
              }
            );
          } else {
            reject(
              APP.createErrorMessage({
                status: EUserDataRequestStatus.unknown,
                msg: "获取用户编号失败"
              })
            );
          }
        },
        (error: any) => {
          delete this.requestQueue[`${site.host}-base`];
          reject(APP.createErrorMessage(error));
        }
      );
    });
  }

  /**
   * getInfos
   */
  public getInfos(
    url: string,
    rule: Dictionary<any>,
    onSuccess: any,
    onError: any
  ) {
    url = url
      .replace("://", "****")
      .replace(/\/\//g, "/")
      .replace("****", "://");

    return $.ajax({
      url,
      dataType: "text",
      contentType: "text/plain",
      timeout:
        (this.service.options.search && this.service.options.search.timeout) ||
        30000
    })
      .done(result => {
        let doc = new DOMParser().parseFromString(result, "text/html");
        // 构造 jQuery 对象
        let content = $(doc).find("body");
        if (content && rule) {
          try {
            let results = new InfoParser(this.service).getResult(content, rule);
            this.service.debug(results);
            onSuccess && onSuccess(results);
          } catch (error) {
            this.service.debug(error);
            onError && onError(error);
          }
        }
      })
      .fail(error => {
        onError && onError(error);
      });
  }

  /**
   * 取消正在执行的搜索请求
   * @param site
   * @param key
   */
  public abortGetUserInfo(site: Site): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let queueBase = this.requestQueue[`${site.host}-base`];
      let queueExtend = this.requestQueue[`${site.host}-extend`];
      let errors: any[] = [];

      if (queueBase) {
        try {
          queueBase.abort();
        } catch (error) {
          this.service.logger.add({
            module: EModule.background,
            event: "user.abortGetUserInfo.Base.error",
            msg: "取消获取用户信息请求失败",
            data: {
              site: site.host,
              error
            }
          });
          errors.push(error);
        }
      }

      if (queueExtend) {
        try {
          queueExtend.abort();
        } catch (error) {
          this.service.logger.add({
            module: EModule.background,
            event: "user.abortGetUserInfo.Extend.error",
            msg: "取消获取用户信息请求失败",
            data: {
              site: site.host,
              error
            }
          });
          errors.push(error);
        }
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(true);
      }
    });
  }
}
