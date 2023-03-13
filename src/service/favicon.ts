import { Dictionary } from "@/interface/common";
import { filters } from "./filters";
import { FileDownloader } from "./downloader";
const StorageKey = "Favicon-Cache";
// 1 像素透明
const NOIMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export class Favicon {
  private cache: Dictionary<any> = {};

  constructor(public service?: any) {
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

  public clear() {
    this.cache = {};
    this.saveCache();
  }

  public reset(): Promise<any> {
    let _cache = JSON.parse(JSON.stringify(this.cache));
    this.cache = {};
    let urls: string[] = [];
    for (const host in _cache) {
      if (_cache.hasOwnProperty(host)) {
        let item = _cache[host];
        urls.push(item.origin);
      }
    }

    return this.gets(urls);
  }

  public gets(urls: string[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let requests: any[] = [];
      urls.forEach((url: string) => {
        requests.push(this.get(url));
      });
      Promise.all(requests)
        .then((results: any[]) => {
          resolve(results);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  /**
   * 获取指定站点的图标
   * @param url 站点地址
   * @param reset 是否重置
   */
  public get(url: string, reset: boolean = false): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let URL = filters.parseURL(url);
      let cache = this.cache[URL.host];
      if (!cache || reset) {
        this.cacheFavicon(URL.origin, URL.host)
          .then((result: any) => {
            resolve(result);
          })
          .catch(e => {
            reject(e);
          });
        return;
      }
      return resolve(cache);
    });
  }

  /**
   * 缓存图标
   * @param url 站点地址
   * @param host 域名
   */
  private cacheFavicon(url: string, host: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.download(`${url}/favicon.ico`)
        .then(result => {
          if (result && result.size > 0) {
            this.transformBlob(result, "base64")
              .then(base64 => {
                resolve(this.set(url, base64));
              })
              .catch(e => {
                reject(e);
              });
          } else {
            this.cacheFromIndex(url, host)
              .then((result: any) => {
                resolve(result);
              })
              .catch(e => {
                reject(e);
              });
          }
        })
        .catch(() => {
          this.cacheFromIndex(url, host)
            .then((result: any) => {
              resolve(result);
            })
            .catch(e => {
              reject(e);
            });
        });
    });
  }

  public set(url: string, data: string) {
    let URL = filters.parseURL(url);
    let item = {
      origin: URL.origin,
      host: URL.host,
      data
    };
    this.cache[URL.host] = item;
    this.saveCache();
    return item;
  }

  /**
   * 从站点首页内容中获取图标地址并缓存
   * @param url
   * @param host
   */
  private cacheFromIndex(url: string, host: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.download(url)
        .then(result => {
          if (result && /text/gi.test(result.type)) {
            this.transformBlob(result, "text")
              .then(text => {
                try {
                  const doc = new DOMParser().parseFromString(
                    text,
                    "text/html"
                  );
                  // 构造 jQuery 对象
                  const head = $(doc).find("head");
                  let query = head.find("link[rel*=icon]:first");
                  if (query && query.length > 0) {
                    let URL = filters.parseURL(url);
                    let link = query.attr("href") + "";

                    if (link.substr(0, 2) === "//") {
                      link = `${URL.protocol}:${link}`;
                    } else if (link.substr(0, 4) !== "http") {
                      link = link.startsWith('/') ? `${URL.origin}${link}` : `${URL.origin}/${link}`;
                    }

                    this.download(link)
                      .then(result => {
                        if (result && /image/gi.test(result.type)) {
                          this.transformBlob(result, "base64")
                            .then(base64 => {
                              resolve(this.set(url, base64));
                            })
                            .catch(e => {
                              this.debug(e);
                              reject(e);
                            });
                        } else {
                          resolve(this.set(url, NOIMAGE));
                        }
                      })
                      .catch(() => {
                        resolve(this.set(url, NOIMAGE));
                      });
                  } else {
                    resolve(this.set(url, NOIMAGE));
                  }
                } catch (error) {
                  console.log(error);
                  this.debug(error);
                  resolve(this.set(url, NOIMAGE));
                }
              })
              .catch(e => {
                this.debug(e);
                reject(e);
              });
          } else {
            reject();
          }
        })
        .catch(() => {
          resolve(this.set(url, NOIMAGE));
        });
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
        this.debug(e);
        reject(e);
      };

      file.start();
    });
  }

  private debug(...msg: any[]) {
    if (this.service) {
      this.service.debug(...msg);
    }
  }
}
