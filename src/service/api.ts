import localStorage from "./localStorage";
import md5 from "blueimp-md5";

const API_RAW_URL =
  "https://raw.githubusercontent.com/ronggang/PT-Plugin-Plus/master/resource";
const API_URL =
  "https://api.github.com/repos/ronggang/PT-Plugin-Plus/contents/resource";

export const API = {
  host: API_RAW_URL,
  schemas: `${API_URL}/schemas`,
  schemaConfig: `${API_RAW_URL}/schemas/{$schema}/config.json`,
  sites: `${API_URL}/sites`,
  siteConfig: `${API_RAW_URL}/sites/{$site}/config.json`,
  clients: `${API_URL}/clients`,
  clientConfig: `${API_RAW_URL}/clients/{$client}/config.json`,

  // 调试信息
  debugAPI: {
    // https://api.github.com/repos/ronggang/PT-Plugin/contents
    host: "http://localhost:8001",
    // https://api.github.com/repos/ronggang/PT-Plugin/contents/resource/schemas
    schemas: "/schema.json",
    schemaConfig: "http://localhost:8001/schemas/{$schema}/config.json",
    schema: "",
    // https://api.github.com/repos/ronggang/PT-Plugin/contents/resource/sites
    sites: "/sites.json",
    // https://raw.githubusercontent.com/ronggang/PT-Plugin/master/resource/sites/{$site}/config.json
    siteConfig: "http://localhost:8001/sites/{$site}/config.json",
    clients: "/clients.json",
    clientConfig: "http://localhost:8001/clients/{$client}/config.json"
  },
  cache: {
    localStorage: new localStorage(),
    cacheKey: "PT-Plugin-Plus-Cache-Contents",
    contents: {} as any,
    // 10 天
    expires: 60 * 60 * 24 * 10,
    init(callback?: any) {
      console.log("cache.init");
      this.localStorage.get(this.cacheKey, (result: any) => {
        if (result) {
          let expires = result["expires"];
          // 判断是否过期
          if (expires && new Date() > new Date(expires)) {
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
      this.contents["expires"] = new Date().getTime() + this.expires;
      this.localStorage.set(this.cacheKey, this.contents);
    },
    /**
     * 清除缓存
     */
    clear() {
      this.contents = {};
      this.localStorage.set(this.cacheKey, this.contents);
    }
  },
  getAPI() {},
  execScript(scriptPath: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let url = `${this.host}/${scriptPath}`;
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
    });
  },
  applyStyle(stylePath: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let url = `${this.host}/${stylePath}`;
      let content = this.cache.get(url);
      let style = $("<style/>").appendTo(document.body);
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
      // var link = $("<link/>")
      //   .attr({
      //     rel: "stylesheet",
      //     type: "text/css",
      //     href: `${this.host}/${stylePath}?__t__=` + Math.random()
      //   })
      //   .appendTo($("head")[0]);

      // resolve();
    });
  }
};

API.cache.init();
