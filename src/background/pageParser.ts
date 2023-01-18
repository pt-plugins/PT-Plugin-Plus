import {
  IPageSelector,
  Dictionary,
  Site,
  ERequestResultType,
  ERequestMethod
} from "@/interface/common";
import { PPF } from "@/service/public";
import { APP } from "@/service/api";
import { InfoParser } from "./infoParser";
import md5 from "blueimp-md5";

/**
 * 通用页面数据解析类
 */
export class PageParser {
  private infoParserCache: Dictionary<any> = {};
  private cacheKey = "";
  private url = "";
  private requestData: any;
  private resultData: any;

  /**
   * 初始化
   * @param options 解析配置
   * @param site 站点
   * @param timeout
   * @param commonDatas 指定的通用数据
   */
  constructor(
    public options: IPageSelector,
    public site: Site,
    public timeout: number = 30000,
    public commonDatas?: Dictionary<any>
  ) {
    let url: string = site.url + "";

    // 如果有自定义地址，则使用自定义地址
    if (site.cdn && site.cdn.length > 0) {
      url = site.cdn[0];
    }

    if ((url + "").substr(-1) != "/") {
      url += "/";
    }

    let page = this.options.page;
    if ((page + "").substr(0, 1) == "/") {
      page = (page + "").substr(1);
    }

    this.url = (url + page)
      .replace("://", "****")
      .replace(/\/\//g, "/")
      .replace("****", "://");

    this.requestData = this.options.requestData;
    if (this.requestData && this.commonDatas) {
      try {
        for (const key in this.requestData) {
          if (this.requestData.hasOwnProperty(key)) {
            const value = this.requestData[key];
            for (const commonKey in this.commonDatas) {
              if (this.commonDatas.hasOwnProperty(commonKey)) {
                this.requestData[key] = PPF.replaceKeys(
                  value,
                  this.commonDatas[commonKey],
                  commonKey
                );
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    this.cacheKey = md5(this.url + JSON.stringify(this.requestData || {}));
  }

  /**
   * 获取缓存
   */
  private getCache() {
    let result = window.localStorage.getItem(this.cacheKey);
    if (result) {
      let json = JSON.parse(result);
      if (json.data && json.time) {
        let time = new Date().getTime();

        if (json.time < time) {
          window.localStorage.removeItem(this.cacheKey);
          return null;
        }

        return json.data;
      }
    }
    return null;
  }

  /**
   * 设置缓存
   */
  private setCache() {
    if (this.options.dataCacheTime && this.options.dataCacheTime > 0) {
      let cache = {
        data: this.resultData,
        time: new Date().getTime() + this.options.dataCacheTime * 1000
      };
      window.localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    }
  }

  /**
   * 获取数据
   */
  public getInfos(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let cache = this.getCache();
      if (cache) {
        resolve(cache);
        return;
      }

      /**
       * 是否有脚本解析器
       */
      if (this.options.parser && this.site) {
        if (this.runParser(resolve, reject)) {
          return;
        }
      }

      let request = $.ajax({
        url: this.url,
        method: this.options.requestMethod || ERequestMethod.GET,
        dataType: "text",
        headers: this.options.headers,
        data: this.requestData,
        timeout: this.timeout
      })
        .done(result => {
          let content: any;
          try {
            if (this.options.dataType !== ERequestResultType.JSON) {
              let doc = new DOMParser().parseFromString(result, "text/html");
              // 构造 jQuery 对象
              let topElement = this.options.topElement || "body";
              content = $(doc).find(topElement);
            } else {
              content = JSON.parse(result);
            }
          } catch (error) {
            reject(error);
            return;
          }

          if (content && this.options) {
            try {
              let results = new InfoParser().getResult(content, this.options);
              this.resultData = results;
              this.setCache();
              resolve(results);
            } catch (error) {
              reject(error);
            }
          }
        })
        .fail(error => {
          reject(error);
        });
    });
  }

  /**
   * 执行脚本解析器
   * @param rule
   * @param site
   * @param userInfo
   * @param resolve
   * @param reject
   */
  public runParser(resolve?: any, reject?: any): boolean {
    if (!this.site || !this.options.parser) {
      return false;
    }
    let siteConfigPath =
      this.site.schema == "publicSite" ? "publicSites" : "sites";

    if (this.site.path) {
      siteConfigPath += `/${this.site.path}`;
    } else {
      siteConfigPath += `/${this.site.host}`;
    }

    let path = this.options.parser;
    // 判断是否为相对路径
    if (path.substr(0, 1) !== "/" && path.substr(0, 4) !== "http") {
      path = `${siteConfigPath}/${path}`;
    }

    // 传递给解析解析的参数
    let _options = {
      site: this.site,
      rule: this.options,
      commonDatas: this.commonDatas,
      resolve,
      reject
    };

    // 当前对象
    let _self = this;

    let script = this.infoParserCache[path];
    if (script) {
      eval(script);
    } else {
      APP.getScriptContent(path).done(script => {
        this.infoParserCache[path] = script;
        eval(script);
      });
    }

    return true;
  }
}
