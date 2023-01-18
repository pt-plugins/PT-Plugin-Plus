import md5 from "blueimp-md5";
import * as basicContext from "basiccontext";
import { Options, Site, Dictionary } from "@/interface/common";
import dayjs from "dayjs";
import { UAParser } from "ua-parser-js";

class HelpFunctions {
  public isExtensionMode: boolean = false;
  public browserName: string = "";
  public manifest: chrome.runtime.Manifest = {
    manifest_version: 2,
    name: "",
    version: ""
  };
  constructor() {
    try {
      this.isExtensionMode = !!(
        chrome.runtime &&
        chrome.extension &&
        chrome.runtime.getManifest
      );

      this.manifest = chrome.runtime.getManifest();
    } catch (error) {
      console.log("HelpFunctions: is not extension mode.", error);
    }

    this.browserName = new UAParser().getBrowser().name || "";
  }

  /**
   * 获取当天日期的键值
   */
  public getToDay(time?: number): string {
    let day = new Date();
    if (time) {
      day = new Date(time);
    }
    let yyyy = day.getFullYear();
    let m = day.getMonth() + 1;
    let mm = m < 10 ? "0" + m : m;

    let d = day.getDate();
    let dd = d < 10 ? "0" + d : d;

    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * 更新插件徽标提示
   * @param count
   */
  public updateBadge(count: number) {
    if (!this.isExtensionMode) return;
    try {
      if (count == 0) {
        chrome.browserAction.setBadgeText({ text: "" });
        chrome.browserAction.enable();
      } else {
        chrome.browserAction.setBadgeText({ text: count.toString() });
        chrome.browserAction.setBadgeBackgroundColor({
          color: "#aabbcc"
        });
        chrome.browserAction.disable();
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 获取当前版本
   */
  public getVersion() {
    if (this.isExtensionMode) {
      return "v" + (this.manifest.version_name || this.manifest.version);
    } else {
      return "localVersion";
    }
  }

  /**
   * 获取随机字符串
   * @param  {number} length    长度，默认为32
   * @param  {boolean} noSimilar 是否包含容易混淆的字符，默认为包含
   * @return {string}           返回的内容
   */
  public getRandomString(
    length: number = 32,
    noSimilar: boolean = false
  ): string {
    // 是否包含容易混淆的字符[oO,Ll,9gq,Vv,Uu,I1]，默认为包含
    let chars = noSimilar
      ? "abcdefhijkmnprstwxyz2345678ABCDEFGHJKMNPQRSTWXYZ"
      : "abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKMNOPQRSTUVWXYZ";
    let maxLength = chars.length;
    let result = [];
    for (let i = 0; i < length; i++) {
      result.push(chars.charAt(Math.floor(Math.random() * maxLength)));
    }

    return result.join("");
  }

  /**
   * 获取一个编号
   */
  public getNewId(): string {
    return md5(
      new Date().getTime().toString() + this.getRandomString()
    ).toString();
  }

  /**
   * 显示系统提示信息
   * @param options
   */
  public showNotifications(
    options: chrome.notifications.NotificationOptions,
    timeout: number = 3000
  ) {
    options = Object.assign(
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("/assets/icon-128.png"),
        title: "PT 助手 Plus",
        priority: 0,
        message: ""
      },
      options
    );

    let id = Math.floor(Math.random() * 99999) + "";

    chrome.notifications.create(id, options, function(myId) {
      id = myId;
    });

    setTimeout(() => {
      chrome.notifications.clear(id, () => {});
    }, timeout);
  }

  /**
   * 去除重复的查询字符串
   * @param url
   */
  public removeDuplicateQueryString(url: string) {
    let querys: string[] = [],
      queryString = "",
      rule = /([^&=]+)=([^&]*)/g,
      m,
      head = "",
      index = url.indexOf("?");

    if (index !== -1) {
      head = url.substr(0, index + 1);
      queryString = url.substr(index + 1);
      while ((m = rule.exec(queryString))) {
        const v = m[1] + "=" + m[2];
        if (!querys.includes(v)) {
          querys.push(v);
        }
      }

      return head + querys.join("&");
    }

    return url;
  }

  /**
   * 删除链接中指定值的查询字符串
   * @param url
   * @param value
   */
  public removeQueryStringFromValue(url: string, value: string) {
    let querys: string[] = [],
      queryString = "",
      rule = /([^&=]+)=([^&]*)/g,
      m,
      head = "",
      index = url.indexOf("?");

    if (index !== -1) {
      head = url.substr(0, index + 1);
      queryString = url.substr(index + 1);
      while ((m = rule.exec(queryString))) {
        const v = m[1] + "=" + m[2];
        if (m[2] !== value) {
          querys.push(v);
        }
      }

      return head + querys.join("&");
    }

    return url;
  }

  /**
   * 删除链接中指定的字段
   * @param url
   * @param value
   */
  public removeQueryStringFields(url: string, fields: string[]) {
    let querys: string[] = [],
      queryString = "",
      rule = /([^&=]+)=([^&]*)/g,
      m,
      head = "",
      index = url.indexOf("?");

    if (index !== -1) {
      head = url.substr(0, index + 1);
      queryString = url.substr(index + 1);
      while ((m = rule.exec(queryString))) {
        const v = m[1] + "=" + m[2];
        if (!fields.includes(m[1])) {
          querys.push(v);
        }
      }

      return head + querys.join("&");
    }

    return url;
  }

  public clone(source: any) {
    return JSON.parse(JSON.stringify(source));
  }

  /**
   * 输出调试信息
   * @param msg
   */
  public debug(...msg: any) {
    console.log(new Date().toLocaleString(), ...msg);
  }

  /**
   * 显示上下文菜单
   * @param menus
   * @param event
   */
  public showContextMenu(menus: any, event: any) {
    try {
      // 显示菜单
      basicContext.show(menus, event);

      // 修正偏移量
      $(".basicContext").css({
        left: "-=20px",
        top: "+=10px"
      });
    } catch (error) {}
  }

  public getCleaningURL(url: string) {
    return this.removeQueryStringFields(url, ["hit", "cmtpage", "page"]);
  }

  /**
   * 检查权限
   * @param permissions 需要检查的权限列表
   */
  public checkPermissions(permissions: string[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome && chrome.permissions) {
        // 查询当前权限
        chrome.permissions.contains(
          {
            permissions: permissions
          },
          result => {
            if (result === true) {
              resolve(true);
            } else {
              reject({
                success: false
              });
            }
          }
        );
      } else {
        reject({
          success: false
        });
      }
    });
  }

  /**
   * 申请权限
   * @param permissions 需要申请的权限列表
   */
  public requestPermissions(permissions: string[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome && chrome.permissions) {
        chrome.permissions.request(
          {
            permissions: permissions
          },
          granted => {
            if (granted === true) {
              resolve(true);
            } else {
              reject({
                success: false
              });
            }
          }
        );
      } else {
        reject({
          success: false
        });
      }
    });
  }

  /**
   * 使用指定的使用
   * @param permissions 权限列表
   * @param needConfirm 是否需要确认，因为有些权限默认浏览器会弹出确认，有些不会弹出确认，增加此参数用于手工确认
   */
  public usePermissions(
    permissions: string[],
    needConfirm: boolean = false,
    confirmMsg: string = ""
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.checkPermissions(permissions)
        .then(result => {
          resolve(result);
        })
        .catch(() => {
          let confirmed = true;
          if (needConfirm) {
            confirmed = confirm(confirmMsg);
          }
          if (!confirmed) {
            reject({
              success: false
            });
            return;
          }
          this.requestPermissions(permissions)
            .then(result => {
              resolve(result);
            })
            .catch(error => {
              reject(error);
            });
        });
    });
  }

  /**
   * 根据指定的host获取已定义的站点信息
   * @param host
   */
  public getSiteFromHost(host: string, options: Options) {
    let sites: Site[] = [];
    if (options.sites) {
      sites.push(...options.sites);
    }

    if (options.system && options.system.publicSites) {
      sites.push(...options.system.publicSites);
    }

    let site = sites.find((item: Site) => {
      let cdn = [item.url].concat(item.cdn, item.formerHosts?.map(x => `//${x}`));
      return item.host == host || cdn.join("").indexOf(`//${host}`) > -1;
    });

    if (site) {
      return this.clone(site);
    }

    return null;
  }

  public getNewBackupFileName(): string {
    return (
      "PT-Plugin-Plus-Backup-" + dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".zip"
    );
  }

  /**
   * 替换指定的字符串列表
   * @param source
   * @param maps
   */
  public replaceKeys(
    source: string,
    maps: Dictionary<any>,
    prefix: string = ""
  ): string {
    if (!source || typeof source !== 'string') {
      return source;
    }
    let result: string = source;

    for (const key in maps) {
      if (maps.hasOwnProperty(key)) {
        const value = maps[key];
        let search = "$" + key + "$";
        if (prefix) {
          search = `$${prefix}.${key}$`;
        }
        result = result.replace(search, value);
      }
    }
    return result;
  }

  /**
   * 检查指定的可选权限是否有被声明
   * @param key
   */
  public checkOptionalPermission(key: string): boolean {
    if (
      this.isExtensionMode &&
      this.manifest &&
      this.manifest.optional_permissions
    ) {
      return this.manifest.optional_permissions.includes(key);
    }

    return false;
  }

  /**
   * 转换时间
   * @param time 待转换的时间
   * @param timezoneOffset 时区偏移量，用于解决时差问题，如：+08:00, -08:00, +0800, UTC+0800, UTC+08:00
   * @see https://zh.wikipedia.org/wiki/各國時區列表
   * @see https://zh.wikipedia.org/wiki/时区
   * @see https://zh.wikipedia.org/wiki/ISO_8601
   */
  public transformTime(time?: number, timezoneOffset?: string) {
    if (!timezoneOffset || !time) {
      return time;
    }
    let result = time;
    // 标准时间戳需要 * 1000
    if (/^(\d){10}$/.test(result + "")) {
      result = parseInt(result + "") * 1000;
    }
    // 时间格式按 ISO 8601 标准设置，如：2020-01-01T00:00:01+0800
    let datetime = dayjs(result).format("YYYY-MM-DDTHH:mm:ss");
    result = new Date(`${datetime}${timezoneOffset}`).getTime();
    return result;
  }
}

/**
 * 导出公用函数
 * PT Plugin Public Function
 */
export const PPF = new HelpFunctions();
