import md5 from "blueimp-md5";

class HelpFunctions {
  public isExtensionMode: boolean = false;
  constructor() {
    try {
      this.isExtensionMode = !!(
        chrome.runtime &&
        chrome.extension &&
        chrome.runtime.getManifest
      );
    } catch (error) {
      console.log("HelpFunctions: is not extension mode.", error);
    }
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
      const manifest = chrome.runtime.getManifest();
      return "v" + (manifest.version_name || manifest.version);
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
        iconUrl: chrome.extension.getURL("/assets/icon-128.png"),
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

  public clone(source: any) {
    return JSON.parse(JSON.stringify(source));
  }
}

/**
 * 导出公用函数
 * PT Plugin Public Function
 */
export const PPF = new HelpFunctions();
