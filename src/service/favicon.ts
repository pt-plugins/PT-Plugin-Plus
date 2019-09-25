import { Dictionary } from "@/interface/common";
import { filters } from "./filters";
import { FileDownloader } from "./downloader";
const StorageKey = "Favicon-Cache";
// 1 像素透明
const NOIMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export class Favicon {
  private cache: Dictionary<any> = {};

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    let result = window.localStorage.getItem(StorageKey);
    if (result) {
      this.cache = JSON.parse(result) || {};
    }
  }

  private saveCache() {
    window.localStorage.setItem(StorageKey, JSON.stringify(this.cache));
  }

  public get(url: string) {
    let URL = filters.parseURL(url);
    let cache = this.cache[URL.host];
    if (!cache) {
      this.cacheFavicon(URL.origin, URL.host);

      cache = NOIMAGE;
    }
    return cache;
  }

  /**
   * 缓存图标
   * @param url 站点地址
   * @param host 域名
   */
  private cacheFavicon(url: string, host: string) {
    this.download(`${url}/favicon.ico`)
      .then(result => {
        if (result && /image/gi.test(result.type)) {
          this.transformBlob(result, "base64").then(base64 => {
            this.cache[host] = base64;
            this.saveCache();
          });
        }
      })
      .catch(() => {
        this.cacheFromIndex(url, host);
      });
  }

  /**
   * 从站点首页内容中获取图标地址并缓存
   * @param url
   * @param host
   */
  private cacheFromIndex(url: string, host: string) {
    this.download(url)
      .then(result => {
        if (result && /text/gi.test(result.type)) {
          this.transformBlob(result, "text").then(text => {
            try {
              const doc = new DOMParser().parseFromString(text, "text/html");
              // 构造 jQuery 对象
              const head = $(doc).find("head");
              let query = head.find("link[rel*=icon]:first");
              if (query && query.length > 0) {
                let URL = filters.parseURL(url);
                let link = query.attr("href") + "";

                if (link.substr(0, 2) === "//") {
                  link = `${URL.protocol}:${link}`;
                } else if (link.substr(0, 4) !== "http") {
                  link = `${URL.origin}/${link}`;
                }

                this.download(`${url}/${link}`)
                  .then(result => {
                    if (result && /image/gi.test(result.type)) {
                      this.transformBlob(result, "base64").then(base64 => {
                        this.cache[host] = base64;
                        this.saveCache();
                      });
                    }
                  })
                  .catch(() => {
                    this.cache[host] = NOIMAGE;
                    this.saveCache();
                  });
              }
            } catch (error) {
              console.log(error);
            }
          });
        }
      })
      .catch(() => {
        this.cache[host] = NOIMAGE;
        this.saveCache();
      });
  }

  private transformBlob(blob: Blob, to: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      const reader = new FileReader();
      reader.addEventListener("loadend", () => {
        if (reader.result) {
          resolve(reader.result);
        } else {
          reject();
        }
      });

      switch (to) {
        case "text":
          reader.readAsText(blob);
          break;

        case "base64":
          reader.readAsDataURL(blob);
          break;
      }
    });
  }

  private download(url: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let file = new FileDownloader({
        url,
        getDataOnly: true,
        timeout: 5000
      });

      file.onCompleted = () => {
        if (file.content) {
          resolve(file.content);
        } else {
          reject();
        }
      };

      file.onError = (e: any) => {
        console.log("Favicon.download.error", e);
        reject(e);
      };

      file.start();
    });
  }
}

if (!(window as any).getFavicon) {
  const _Favicon = new Favicon();
  (window as any).getFavicon = (url: string) => {
    return _Favicon.get(url);
  };
}
