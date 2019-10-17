import { IBackupServer } from "@/interface/common";
import { createClient as WebDAVClient } from "webdav";

export class WebDAV {
  private service: any;
  constructor(public options: IBackupServer) {
    this.initServer();
  }

  /**
   * 初始化服务器
   */
  private initServer() {
    this.service = WebDAVClient(this.options.address, {
      username: this.options.loginName,
      password: this.options.loginPwd
    });
  }

  /**
   * 获取资源列表
   * @param options
   */
  public list(options: any = {}): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.service
        .getDirectoryContents("/", { glob: "*.zip" })
        .then((data: any[]) => {
          console.log(data);

          let result: any[] = [];
          if (data && data.length > 0) {
            data.forEach((item: any) => {
              result.push({
                name: item.basename,
                size: item.size,
                type: item.type,
                time: new Date(item.lastmod)
              });
            });
          }
          resolve(result);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  /**
   * 获取（下载）一个文件
   * @param path
   * @returns 返回一个 binary 数据
   */
  public get(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.service
        .getFileContents("/" + path)
        .then((result: any) => {
          resolve(result);
        })
        .catch((error: any) => {
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
      this.service
        .putFileContents(formData.get("name"), formData.get("data"))
        .then((result: any) => {
          if (result) {
            resolve(true);
          } else {
            reject(false);
          }
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  /**
   * 删除一个文件
   * @param path
   */
  public delete(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.service
        .deleteFile("/" + path)
        .then((result: any) => {
          if (result) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }
}
