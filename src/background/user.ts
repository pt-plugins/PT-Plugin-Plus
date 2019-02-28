import { Site, Dictionary, EModule, UserInfo } from "@/interface/common";
import PTPlugin from "./service";
import { InfoParser } from "./infoParser";

type Service = PTPlugin;

export class User {
  private requestQueue: Dictionary<JQueryXHR> = {};

  constructor(public service: Service) {}
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
      let userInfo: UserInfo = {
        id: "",
        name: ""
      };

      let rule = this.service.getSiteSelector(
        site.host as string,
        "userBaseInfo"
      );
      if (!rule) {
        reject(null);
        return;
      }
      let url: string = `${site.url}${rule.page}`;
      this.requestQueue[`${site.host}-base`] = this.getInfos(
        url,
        rule,
        (result: any) => {
          delete this.requestQueue[`${site.host}-base`];
          userInfo = Object.assign({}, result);

          rule = this.service.getSiteSelector(
            site.host as string,
            "userExtendInfo"
          );

          if (!rule) {
            reject(null);
            return;
          }

          if (userInfo.id) {
            this.requestQueue[`${site.host}-extend`] = this.getInfos(
              `${site.url}${rule.page.replace("$userId$", userInfo.id)}`,
              rule,
              (result: any) => {
                delete this.requestQueue[`${site.host}-extend`];
                userInfo = Object.assign(userInfo, result);
                resolve(userInfo);
              }
            );
          } else {
            reject(null);
          }
        }
      );
    });
  }

  /**
   * getInfos
   */
  public getInfos(url: string, rule: Dictionary<any>, callback: any) {
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
            console.log(results);
            callback && callback(results);
          } catch (error) {
            console.log(error);
            callback && callback(null);
          }
        }
      })
      .fail(() => {
        callback && callback(null);
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
        resolve();
      }
    });
  }
}
