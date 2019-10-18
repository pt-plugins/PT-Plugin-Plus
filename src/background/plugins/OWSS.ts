import { IBackupServer, ERequestMethod } from "@/interface/common";
import { FileDownloader } from "@/service/downloader";

/**
 * OWSS 客户端实现
 * @see https://github.com/ronggang/OWSS
 */
export class OWSS {
  public serverURL: string = "";
  constructor(public options: IBackupServer) {
    this.serverURL = this.options.address;
    if (this.serverURL.substr(-1) !== "/") {
      this.serverURL += "/";
    }
  }

  /**
   * 发送指定的请求
   * @param action 指令
   * @param method 请求方法（GET，POST）
   * @param data 请求数据
   */
  private request(
    action: string,
    method: ERequestMethod = ERequestMethod.GET,
    data?: any
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let options: JQuery.AjaxSettings = {
        url: this.serverURL + `${action}`,
        method: method,
        dataType: "json",
        data
      };

      if (method === ERequestMethod.POST) {
        options.processData = false;
        options.contentType = false;
      }

      $.ajax(options)
        .done(result => {
          resolve(result);
        })
        .fail(error => {
          reject(error);
        });
    });
  }

  /**
   * 申请资源ID
   */
  public create(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request("create")
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject();
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 添加文件
   * @param formData
   */
  public add(formData: FormData): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(
        `${this.options.authCode}/add`,
        ERequestMethod.POST,
        formData
      )
        .then(result => {
          if (result && result.data === true) {
            resolve(true);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 获取（下载）一个文件
   * @param path
   * @returns 返回一个 blob 对象
   */
  public get(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let url = `${this.serverURL}${this.options.authCode}/get/${path}`;
      let file = new FileDownloader({
        url,
        getDataOnly: true
      });

      file.onCompleted = () => {
        resolve(file.content);
      };

      file.onError = (e: any) => {
        console.log(e);
        reject(e);
      };

      file.start();
    });
  }

  /**
   * 删除一个文件
   * @param path
   */
  public delete(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(
        `${this.options.authCode}/delete/${path}`,
        ERequestMethod.POST
      )
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 获取资源列表
   * @param options
   */
  public list(options: any = {}): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(`${this.options.authCode}/list`, ERequestMethod.GET, options)
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * 验证服务器可用性
   */
  public ping(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(`${this.options.authCode}/list`, ERequestMethod.GET, {
        pageSize: 1
      })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
