import localStorage from "./localStorage";
import md5 from "blueimp-md5";
import { EConfigKey, DataResult, EDataResultType } from "@/interface/common";

const isExtensionMode = !!(window["chrome"] && window.chrome.extension);
const isLocalhost = window.location.hostname === "localhost";
const RESOURCE_URL = isLocalhost
  ? "http://localhost:8001"
  : (isExtensionMode ? `chrome-extension://${chrome.runtime.id}` : "") +
    "/resource";
// 调试信息
let RESOURCE_API = {
  host: RESOURCE_URL,
  schemas: `${RESOURCE_URL}/schema.json`,
  schemaConfig: `${RESOURCE_URL}/schemas/{$schema}/config.json`,
  sites: `${RESOURCE_URL}/sites.json`,
  siteConfig: `${RESOURCE_URL}/sites/{$site}/config.json`,
  clients: `${RESOURCE_URL}/clients.json`,
  clientConfig: `${RESOURCE_URL}/clients/{$client}/config.json`,
  latestReleases: `https://api.github.com/repos/ronggang/PT-Plugin-Plus/releases/latest`
};

export const APP = {
  debugMode: process.env.NODE_ENV === "development",
  scriptQueues: [] as any,
  isExtensionMode: isExtensionMode,
  cache: {
    localStorage: new localStorage(),
    cacheKey: EConfigKey.cache,
    contents: {} as any,
    // 1 天
    expires: 60 * 60 * 24 * 1,
    init(callback?: any) {
      console.log("cache.init");
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
          eval(script.content);
          resolve();
          break;

        default:
          {
            let url = `${API.host}/${script.content || script}`;
            let content = this.cache.get(url);
            if (content) {
              eval(content);
              resolve();
            } else {
              $.get(
                url,
                result => {
                  eval(result);
                  this.cache.set(url, result);
                  resolve();
                },
                "text"
              );
            }
          }

          break;
      }
    });
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
          let url = `${API.host}/${options.content}`;
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
   * 同步获取脚本内容
   * @param path 路径
   */
  getScriptContent(path: string): JQueryXHR {
    return $.ajax({
      url: `${API.host}/${path}`,
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
  }
};

APP.cache.init();

export const API = RESOURCE_API;
