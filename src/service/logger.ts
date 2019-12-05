import { EConfigKey, LogItem } from "@/interface/common";
import localStorage from "@/service/localStorage";
import { PPF } from "./public";

export class Logger {
  public maxLength: number = 1000;
  public items: any[] = [];
  public storage: localStorage = new localStorage();
  public configKey: string = EConfigKey.systemLogs;

  constructor() {
    this.load();
  }

  /**
   * 获取记录
   */
  public load(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(this.configKey, (result: any) => {
        this.items = result || [];
        resolve(this.items);
      });
    });
  }

  /**
   * 添加日志
   * @param data 日志信息
   */
  public add(data: LogItem): string {
    let time: number = new Date().getTime();
    let saveData: LogItem = Object.assign(
      {
        module: "",
        time,
        id: PPF.getNewId()
      },
      data
    );
    if (!this.items) {
      this.load().then(() => {
        this.items.push(saveData);
        this.storage.set(this.configKey, this.items);
      });
    } else {
      // 如果超出了最大值，则删除最早的记录
      if (this.items.length >= this.maxLength) {
        this.items.splice(0, 1);
      }
      this.items.push(saveData);
      this.storage.set(this.configKey, this.items);
    }
    return saveData.id as string;
  }

  /**
   * 删除历史记录
   * @param items 需要删除的列表
   */
  public remove(items: any[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        for (let index = this.items.length - 1; index >= 0; index--) {
          let item = this.items[index];
          let findIndex = items.findIndex((data: any) => {
            return data.id === item.id;
          });
          if (findIndex >= 0) {
            this.items.splice(index, 1);
          }
        }
        this.storage.set(this.configKey, this.items);
        resolve(this.items);
      });
    });
  }

  /**
   * 清除记录
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = [];
      this.storage.set(this.configKey, this.items);
      resolve(this.items);
    });
  }
}
