import {
  IBackupServer,
  EResourceOrderBy,
  EResourceOrderMode
} from "@/interface/common";
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
      password: this.options.loginPwd,
      digest: this.options.digest ? true : undefined
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
          let orderMode: EResourceOrderMode =
            options.orderMode || EResourceOrderMode.desc;
          if (data && data.length > 0) {
            data.forEach((item: any) => {
              result.push({
                name: item.basename,
                size: item.size,
                type: item.type,
                time: new Date(item.lastmod).getTime()
              });
            });
          }
          resolve(
            result.sort((a, b) => {
              let v1, v2;
              switch (options.orderBy) {
                case EResourceOrderBy.name:
                  v1 = a.name;
                  v2 = b.name;
                  break;

                case EResourceOrderBy.size:
                  v1 = a.size;
                  v2 = b.size;
                  break;

                default:
                  v1 = a.time;
                  v2 = b.time;
                  break;
              }

              if (orderMode === EResourceOrderMode.desc) {
                return v1.toString().localeCompare(v2) == 1 ? -1 : 1;
              } else {
                return v1.toString().localeCompare(v2);
              }
            })
          );
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

  /**
   * 验证服务器可用性
   */
  public ping(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.service
        .getDirectoryContents("/")
        .then(() => {
          resolve(true);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }
}
