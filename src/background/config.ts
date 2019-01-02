import { Options, ESizeUnit, EConfigKey } from "../interface/common";
import { API, APP } from "../service/api";
import localStorage from "../service/localStorage";

/**
 * 配置信息类
 */
class Config {
  private name: string = EConfigKey.default;
  private localStorage: localStorage = new localStorage();

  public schemas: any[] = [];
  public sites: any[] = [];
  public clients: any[] = [];

  constructor() {
    this.getSchemas();
    this.getSites();
    this.getClients();
  }

  public options: Options = {
    pluginIconShowPages: ["torrents.php"],
    contextMenuRules: {
      torrentDetailPages: ["*://*/details.php*", "*://*/plugin_details.php*"],
      torrentListPages: ["*://*/torrents.php*"],
      torrentLinks: [
        "*://*/details.php*",
        "*://*/download.php*",
        "*://*/plugin_details.php*"
      ]
    },
    exceedSizeUnit: ESizeUnit.GiB,
    sites: [],
    clients: [],
    system: {},
    allowDropToSend: true,
    allowSelectionTextSearch: true,
    needConfirmWhenExceedSize: true,
    exceedSize: 10,
    search: {
      rows: 10
    }
  };

  /**
   * 保存配置
   * @param options 配置信息
   */
  public save(options?: Options) {
    this.localStorage.set(this.name, options || this.options);
  }

  /**
   * 读取配置信息
   * @return Promise 配置信息
   */
  public read(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.localStorage.get(this.name, (result: any) => {
        if (result) {
          delete result.system;
          let defaultOptions = Object.assign({}, this.options);
          this.options = Object.assign(defaultOptions, result);
        }
        // 覆盖站点架构
        this.options.system = {
          schemas: this.schemas,
          sites: this.sites,
          clients: this.clients
        };
        resolve(this.options);
      });
    });
  }

  /**
   * 获取支持的网站架构
   */
  public getSchemas(): any {
    this.getContentFromApi(`${API.schemas}`).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            this.addSchema(
              API.schemaConfig.replace(/\{\$schema\}/g, item.name)
            );
          }
        });
      }
    });
  }

  public addSchema(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.schemas.push(result);
      }
    });
  }

  public getSites() {
    this.getContentFromApi(API.sites).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            // this.schemas.push(item.name);
            this.addSite(API.siteConfig.replace(/\{\$site\}/g, item.name));
          }
        });
      }
    });
  }

  public addSite(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.sites.push(result);
      }
    });
  }

  public getClients() {
    this.clients = [];
    this.getContentFromApi(API.clients).then((result: any) => {
      if (result.length) {
        result.forEach((item: any) => {
          if (item.type === "dir") {
            this.addClient(
              API.clientConfig.replace(/\{\$client\}/g, item.name)
            );
          }
        });
      }
    });
  }

  public addClient(path: string): void {
    this.getContentFromApi(path).then((result: any) => {
      if (result && result.name) {
        this.clients.push(result);
      }
    });
  }

  public getContentFromApi(api: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let content = APP.cache.get(api);
      if (content) {
        resolve(content);
        return;
      }
      $.getJSON(api).then(result => {
        APP.cache.set(api, result);
        resolve(result);
      });
    });
  }
}
export default Config;
