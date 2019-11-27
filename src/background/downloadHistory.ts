import { EConfigKey } from "@/interface/common";
import localStorage from "@/service/localStorage";

/**
 * 下载历史记录操作类
 */
export class DownloadHistory {
  public items: any[] = [];
  public storage: localStorage = new localStorage();

  constructor() {
    this.load();
  }

  /**
   * 获取下载历史记录
   */
  public load(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(EConfigKey.downloadHistory, (result: any) => {
        this.items = result || [];
        resolve(this.items);
      });
    });
  }

  /**
   * 保存下载记录
   * @param data 下载链接信息
   * @param host 站点域名
   * @param clientId 下载客户端ID
   */
  public add(
    data: any,
    host: string = "",
    clientId: string = "",
    success: boolean = true
  ) {
    let saveData = {
      data,
      clientId,
      host,
      success,
      time: new Date().getTime()
    };
    if (!this.items) {
      this.load().then(() => {
        this.items.push(saveData);
        this.updateData();
      });
    } else {
      let index = this.items.findIndex((item: any) => {
        return item.data.url === data.url;
      });
      if (index === -1) {
        this.items.push(saveData);
        this.updateData();
      }
    }
  }

  /**
   * 删除下载历史记录
   * @param items 需要删除的列表
   */
  public remove(items: any[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        for (let index = this.items.length - 1; index >= 0; index--) {
          let item = this.items[index];
          let findIndex = items.findIndex((_data: any) => {
            return _data.data.url === item.data.url;
          });
          if (findIndex >= 0) {
            this.items.splice(index, 1);
          }
        }
        this.updateData();
        resolve(this.items);
      });
    });
  }

  /**
   * 清除下载记录
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = [];
      this.updateData();
      resolve(this.items);
    });
  }

  /**
   * 重置
   * @param datas
   */
  public reset(datas: any[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!datas) {
        reject(false);
        return;
      }
      if (!Array.isArray(datas)) {
        reject(false);
        return;
      }

      this.items = datas;
      this.updateData();

      resolve(this.items);
    });
  }

  private updateData() {
    this.storage.set(EConfigKey.downloadHistory, this.items);
  }
}
