import localStorage from "./localStorage";
import md5 from "blueimp-md5";
import {
  EConfigKey,
  DataResult,
  EDataResultType,
  EInstallType
} from "@/interface/common";
import { PPF } from "./public";
import "./favicon";

let rootPath = "";
let isExtensionMode = false;
const isDebugMode = process.env.NODE_ENV === "development";
// 检测浏览器当前状态和模式
try {
  let runtime = chrome.runtime as any;
  isExtensionMode = true;
  rootPath = runtime.getManifest().options_ui.page.replace("index.html", "");
  if (rootPath && rootPath.substr(-1) == "/") {
    rootPath = rootPath.substr(0, rootPath.length - 1);
  }

  if (!rootPath) {
    rootPath = `chrome-extension://${chrome.runtime.id}`;
  }

  isDebugMode && console.log("is extension mode.");
} catch (error) {
  isExtensionMode = false;
  isDebugMode && console.log("is not extension mode.");
}

const RESOURCE_URL = !isExtensionMode
  ? `http://${window.location.hostname}:8001`
  : (isExtensionMode ? rootPath : "") + "/resource";
// 调试信息
let RESOURCE_API = {
  host: RESOURCE_URL,
  schemas: `${RESOURCE_URL}/schemas.json`,
  schemaConfig: `${RESOURCE_URL}/schemas/{$schema}/config.json`,
  sites: `${RESOURCE_URL}/sites.json`,
  siteConfig: `${RESOURCE_URL}/sites/{$site}/config.json`,
  clients: `${RESOURCE_URL}/clients.json`,
  clientConfig: `${RESOURCE_URL}/clients/{$client}/config.json`,
  latestReleases: `https://api.github.com/repos/pt-plugins/PT-Plugin-Plus/releases/latest`,
  systemConfig: `${RESOURCE_URL}/systemConfig.json`
};

export const APP = {
  debugMode: isDebugMode,
  scriptQueues: [] as any,
  isExtensionMode: isExtensionMode,
  cache: {
    localStorage: new localStorage(),
    cacheKey: EConfigKey.cache,
    contents: {} as any,
    // 1 天
    expires: 60 * 60 * 24 * 1,
    init(callback?: any) {
      APP.debugMode && console.log("cache.init");
      this.localStorage.get(this.cacheKey, (result: any) => {
        if (result) {
          let expires = result["expires"];
          // 判断是否过期
          if ((expires && new Date() > new Date(expires)) || APP.debugMode) {
            this.contents = {};
          } else {
            this.contents = result;
          }
        }
        callback && callback();
      });
    },
    /**
     * 获取缓存
     * @param key
     */
    get(key: string): string | null {
      if (this.contents) {
        return this.contents[md5(key)];
      }
      return null;
    },
    /**
     * 设置缓存
     * @param key
     * @param content
     */
    set(key: string, content: string) {
      this.contents[md5(key)] = content;
      this.contents["update"] = new Date().getTime();
      this.contents["expires"] = new Date().getTime() + this.expires;
      this.localStorage.set(this.cacheKey, this.contents);
    },
    /**
     * 清除缓存
     */
    clear() {
      this.contents = {};
      this.localStorage.set(this.cacheKey, this.contents);
    },
    /**
     * 获取缓存最后更新时间
     */
    getLastUpdateTime(): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        this.localStorage.get(this.cacheKey, (result: any) => {
          if (result) {
            let update = result["update"];
            resolve(update || 0);
          } else {
            reject();
          }
        });
      });
    }
  },
  addScript(script: any) {
    APP.debugMode && console.log("addScript", script);
    this.scriptQueues.push(script);
  },
  applyScripts() {
    let script = this.scriptQueues.shift();
    if (script) {
      this.execScript(script).then(() => {
        this.applyScripts();
      });
    }
  },
  /**
   * 执行脚本
   * @param script
   */
  execScript(script: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      switch (script.type) {
        case "code":
          this.runScript(script.content);
          resolve();
          break;

        default:
          {
            let url = script.content || script;
            if (url.substr(0, 4) !== "http") {
              if (url.substr(0, 1) !== "/") {
                url = `/${url}`;
              }
              url = `${API.host}${url}`;
            }

            let content = this.cache.get(url);
            try {
              if (content) {
                this.runScript(content);
                resolve();
              } else {
                console.log("execScript: %s", url);
                $.ajax({
                  url,
                  dataType: "text"
                })
                  .done(result => {
                    this.runScript(result);
                    this.cache.set(url, result);
                    resolve();
                  })
                  .fail((jqXHR, status, text) => {
                    if (
                      jqXHR.responseJSON &&
                      jqXHR.responseJSON.code &&
                      jqXHR.responseJSON.msg
                    ) {
                      reject(
                        jqXHR.responseJSON.msg +
                        " (" +
                        jqXHR.responseJSON.code +
                        ")"
                      );
                    } else {
                      reject(status + ", " + text);
                    }
                  });
              }
            } catch (error) {
              reject(error);
            }
          }

          break;
      }
    });
  },
  /**
   * 执行指定的脚本
   * @param script 脚本内容
   * @param scope 作用域
   */
  runScript(script: string, scope: any = window) {
    // 默认将脚本作用于 window 对象，这种方式可以正常加载外部的第三方库
    eval.call(scope, script);
  },
  /**
   * 追加样式信息
   * @param options
   */
  applyStyle(options: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let style = $("<style/>").appendTo(document.body);
      switch (options.type) {
        case "file": {
          let url = options.content;
          if (url.substr(0, 4) !== "http") {
            if (url.substr(0, 1) !== "/") {
              url = `/${url}`;
            }
            url = `${API.host}${url}`;
          }
          let content = this.cache.get(url);

          if (content) {
            style.html(content);
            resolve();
          } else {
            $.get(
              url,
              result => {
                style.html(result);
                this.cache.set(url, result);
                resolve();
              },
              "text"
            );
          }
          break;
        }

        default:
          style.html(options.content);
          resolve();
          break;
      }

      // var link = $("<link/>")
      //   .attr({
      //     rel: "stylesheet",
      //     type: "text/css",
      //     href: `${this.host}/${stylePath}?__t__=` + Math.random()
      //   })
      //   .appendTo($("head")[0]);

      // resolve();
    });
  },
  /**
   * 异步获取脚本内容
   * @param path 路径
   */
  getScriptContent(path: string): JQueryXHR {
    let url = `${API.host}/${path}`;
    // 外部链接
    if (path.substr(0, 4) === "http") {
      url = path;
    } else {
      url = url.replace("resource//", "resource/");
    }
    APP.debugMode && console.log("getScriptContent", url);
    return $.ajax({
      url,
      dataType: "text"
    });
  },
  /**
   * 创建错误信息，用于函数返回
   * @param msg
   */
  createErrorMessage(msg: any): DataResult {
    return {
      type: EDataResultType.error,
      msg,
      success: false
    };
  },

  /**
   * 显示系统提示信息
   * @param options
   */
  showNotifications(
    options: chrome.notifications.NotificationOptions,
    timeout = 3000
  ) {
    PPF.showNotifications(options, timeout);
  },
  getInstallType(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome && chrome.management) {
        chrome.management.getSelf(result => {
          // 判断是否为 crx 方式
          if (
            result.updateUrl &&
            result.updateUrl.indexOf("pt-plugins/PT-Plugin-Plus") > 0
          ) {
            resolve(EInstallType.crx);
          } else {
            resolve(result.installType);
          }
        });
      } else {
        reject();
      }
    });
  }
};

APP.cache.init();
export const API = RESOURCE_API;
