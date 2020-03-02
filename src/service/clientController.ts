import { APP } from "./api";
import {
  Options,
  DownloadClient,
  EAction,
  DataResult,
  EDataResultType
} from "@/interface/common";

export class ClientController {
  public options: Options = {
    sites: [],
    clients: []
  };

  public clients: any = {};

  /**
   * 类初始化
   */
  constructor() {}

  public init(options: Options) {
    this.options = options;
    this.cleanUpClients();
  }

  /**
   * 清理已缓存的客户端
   */
  public cleanUpClients() {
    this.clients = {};
  }

  /**
   * 根据指定客户端配置初始化客户端
   * @param clientOptions 客户端配置
   */
  public getClient(clientOptions: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (typeof clientOptions === "string") {
        let clientId = clientOptions;
        clientOptions = this.options.clients.find((item: DownloadClient) => {
          return item.id === clientId;
        });
        let client = this.clients[clientId];
        if (client) {
          resolve({ client, options: clientOptions });
          return;
        }
      }
      if ((<any>window)[clientOptions.type] === undefined) {
        // 加载初始化脚本
        APP.execScript({
          type: "file",
          content: `clients/${clientOptions.type}/init.js`
        })
          .then(() => {
            let client: any;
            eval(`client = new ${clientOptions.type}()`);
            client.init({
              loginName: clientOptions.loginName,
              loginPwd: clientOptions.loginPwd,
              address: clientOptions.address,
              name: clientOptions.name
            });
            this.clients[clientOptions.id] = client;
            resolve({ client, options: clientOptions });
          })
          .catch((e: any) => {
            console.log(e);
            reject({
              initFailed: true,
              msg: e
            });
          });
      } else {
        let client: any;
        eval(`client = new ${clientOptions.type}()`);
        client.init({
          loginName: clientOptions.loginName,
          loginPwd: clientOptions.loginPwd,
          address: clientOptions.address,
          name: clientOptions.name
        });
        this.clients[clientOptions.id] = client;
        resolve({ client, options: clientOptions });
      }
    });
  }

  /**
   * 测试客户端是否可连接
   * @param options 参数
   */
  public testClientConnectivity(options: DownloadClient): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let dataResult: DataResult = {
        type: EDataResultType.unknown,
        success: false
      };
      this.getClient(options)
        .then((clientOptions: any) => {
          clientOptions.client
            .call(EAction.testClientConnectivity, options)
            .then((result: boolean) => {
              dataResult.success = result;
              if (result) {
                dataResult.type = EDataResultType.success;
              }
              resolve(dataResult);
            })
            .catch((result: any) => {
              dataResult.data = result;
              dataResult.type = EDataResultType.error;
              reject(dataResult);
            });
        })
        .catch((e: any) => {
          dataResult.data = e;
          dataResult.type = EDataResultType.error;
          reject(dataResult);
        });
    });
  }
}
