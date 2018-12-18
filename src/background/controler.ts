import { Options, EAction } from "../interface/common";
import { API } from "../service/api";
import { filters as Filters } from "../service/filters";
export default class Controler {
  public options: Options = {
    sites: [],
    clients: []
  };

  public defaultClient: any;
  public siteDefaultClients: any = {};

  constructor(options: Options) {
    this.options = options;
    this.initDefaultClient();
  }

  public searchTorrent(key: string = "") {
    console.log(key);
  }

  /**
   * 发送下载链接地址到默认服务器（客户端）
   * @param data 链接地址
   */
  public sendTorrentToDefaultClient(data: any, sender?: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (sender) {
        let URL = Filters.parseURL(sender.url);
        let hostname = URL.host;
        let client = this.siteDefaultClients[hostname];
        if (!client) {
          this.initSiteDefaultClient(hostname).then((client: any) => {
            client
              .call(EAction.addTorrentFromURL, {
                url: data.url,
                savePath: data.savePath,
                autoStart: data.autoStart
              })
              .then((result: any) => {
                resolve(result);
              });
          });
        }
        return;
      }
      this.defaultClient
        .call(EAction.addTorrentFromURL, {
          url: data.url,
          savePath: data.savePath,
          autoStart: data.autoStart
        })
        .then((result: any) => {
          resolve(result);
        });
    });
  }

  /**
   * 根据指定客户端配置初始化客户端
   * @param clientOptions 客户端配置
   */
  private initClient(clientOptions: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if ((<any>window)[clientOptions.type] === undefined) {
        // 加载初始化脚本
        API.execScript(`clients/${clientOptions.type}/init.js`).then(() => {
          let client: any;
          eval(`client = new ${clientOptions.type}()`);
          client.init({
            loginName: clientOptions.loginName,
            loginPwd: clientOptions.loginPwd,
            address: clientOptions.address
          });
          resolve(client);
        });
      } else {
        let client: any;
        eval(`client = new ${clientOptions.type}()`);
        client.init({
          loginName: clientOptions.loginName,
          loginPwd: clientOptions.loginPwd,
          address: clientOptions.address
        });
        resolve(client);
      }
    });
  }

  private initDefaultClient() {
    let clientOptions: any = this.options.clients.find((item: any) => {
      return item.id === this.options.defaultClientId;
    });

    if (clientOptions) {
      this.initClient(clientOptions).then((client: any) => {
        this.defaultClient = client;
      });
    }
  }

  private initSiteDefaultClient(hostname: string): Promise<any> {
    let site: any = this.options.sites.find((item: any) => {
      return item.host == hostname;
    });

    let clientOptions: any = this.options.clients.find((item: any) => {
      return item.id === site.defaultClientId;
    });

    if (clientOptions) {
      return this.initClient(clientOptions);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      resolve(this.defaultClient);
    });
  }

  public copyTextToClipboard(text: string = "") {
    if (!text) {
      return false;
    }
    var copyFrom = $("<textarea/>");
    copyFrom.text(text);
    $("body").append(copyFrom);
    copyFrom.select();
    document.execCommand("copy");
    copyFrom.remove();
    return true;
  }

  public getFreeSpace(data: any): Promise<any> {
    if (!data.clientId) {
      return this.getDefaultClientFreeSpace(data);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      let clientOptions: any = this.options.clients.find((item: any) => {
        return item.id === data.clientId;
      });

      if (clientOptions) {
        this.initClient(clientOptions).then((client: any) => {
          client.call(EAction.getFreeSpace, data).then((result: any) => {
            resolve(result);
          });
        });
      }
    });
  }

  public getDefaultClientFreeSpace(data: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.defaultClient
        .call(EAction.getFreeSpace, data)
        .then((result: any) => {
          resolve(result);
        });
    });
  }
}
