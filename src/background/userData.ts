import {
  EConfigKey,
  UserInfo,
  Site,
  Dictionary,
  EUserDataRange
} from "@/interface/common";
import localStorage from "@/service/localStorage";
import PTPlugin from "./service";
import { PPF } from "@/service/public";

export class UserData {
  public items: Dictionary<any> | null = null;
  public storage: localStorage = new localStorage();
  public configKey: string = EConfigKey.userDatas;

  constructor(public service: PTPlugin) {
    this.load();
  }

  /**
   * 获取记录
   */
  public load(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(this.configKey, (result: any) => {
        console.log("UserData.load", result);
        this.items = result || {};
        resolve(this.items);
      });
    });
  }

  /**
   * 获取指定站点的数据
   * @param host
   * @param range
   */
  public get(host: string, range: EUserDataRange = EUserDataRange.latest) {
    if (!this.items) {
      return null;
    }

    if (!host) {
      return this.items;
    }

    let datas: Dictionary<any> = this.items[host];
    if (!datas) {
      return null;
    }
    switch (range) {
      case EUserDataRange.all:
        return datas;
      case EUserDataRange.today:
        return datas[PPF.getToDay()];
    }

    return datas[EUserDataRange.latest];
  }

  /**
   * 更新用户数据
   * @param site 站点信息
   * @param data 用户数据
   */
  public update(site: Site, data: UserInfo) {
    let host = site.host;
    if (!host) {
      return;
    }
    let saveData: UserInfo = Object.assign({}, data);
    if (this.items == null) {
      this.load().then(() => {
        this.update(site, data);
      });
    } else {
      let siteData = this.items[host];
      let key = PPF.getToDay();
      if (!siteData) {
        siteData = {};
      }

      siteData[key] = saveData;
      siteData[EUserDataRange.latest] = saveData;

      this.items[host] = siteData;

      this.storage.set(this.configKey, this.items).then(() => {
        this.service.saveUserData();
      });
    }
  }

  /**
   * 清除记录
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = {};
      this.storage.set(this.configKey, this.items).then(() => {
        this.service.saveUserData();
        resolve(this.items);
      });
    });
  }

  /**
   * 升级站点数据
   */
  public upgrade(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (
        this.service.options &&
        this.service.options.system &&
        this.service.options.system.sites
      ) {
        let sites = this.service.options.system.sites;

        this.load().then(datas => {
          if (datas) {
            sites.forEach((systemSite: Site) => {
              if (!systemSite.host) {
                return;
              }
              let formerHosts = systemSite.formerHosts;
              let newHost = systemSite.host;
              if (formerHosts && formerHosts.length > 0) {
                formerHosts.forEach((host: string) => {
                  for (const key in datas) {
                    if (key == host && datas.hasOwnProperty(key)) {
                      const element = datas[key];
                      datas[newHost] = Object.assign({}, element);
                      delete datas[key];
                    }
                  }
                });
              }
            });

            this.items = datas;
            this.storage.set(this.configKey, datas);
            this.service.saveUserData();
            resolve(datas);
          } else {
            reject(null);
          }
        });
      } else {
        reject(null);
      }
    });
  }

  /**
   * 重置数据
   * @param datas 源数据
   */
  public reset(datas: any) {
    this.items = datas;
    this.storage.set(this.configKey, this.items).then(() => {
      this.service.saveUserData();
    });
  }
}
