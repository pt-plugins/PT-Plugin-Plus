import { IKeepUploadTask, EConfigKey } from "@/interface/common";
import localStorage from "@/service/localStorage";
import { PPF } from "@/service/public";

interface IDetail extends IKeepUploadTask {}
/**
 * 辅种任务
 */
export default class KeepUploadTask {
  public items: IDetail[] = [];
  public storage: localStorage = new localStorage();

  private configKey = EConfigKey.keepUploadTask;

  constructor() {
    this.load();
  }

  /**
   * 获取历史记录
   */
  public load(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(this.configKey, (result: any) => {
        let data = {
          items: [] as IDetail[]
        };

        if (Array.isArray(result)) {
          data.items = result;
        } else if (result) {
          data = Object.assign(data, result);
        }

        this.items = data.items || [];

        console.log(result);

        resolve(this.items);
      });
    });
  }

  /**
   * 添加新记录
   * @param newItem
   */
  public add(newItem: IDetail): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let saveData = Object.assign(
        {
          time: new Date().getTime(),
          id: PPF.getNewId()
        },
        newItem
      );

      this.items.push(saveData);
      this.updateData();
      resolve(this.items);
    });
  }

  /**
   * 更新指定的记录
   * @param item
   */
  public update(item: IDetail): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        let index = this.items.findIndex((data: IDetail) => {
          return data.id === item.id;
        });
        if (index >= 0) {
          this.items[index] = item;
        }

        this.updateData();
        resolve(this.items);
      });
    });
  }

  private updateData() {
    this.storage.set(this.configKey, {
      items: this.items
    });
  }

  /**
   * 获取指定的内容
   * @param id
   */
  public get(id: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        let item = this.items.find((data: IDetail) => {
          return data.id === id;
        });
        if (item) {
          resolve(item);
        } else {
          reject(false);
        }
      });
    });
  }

  /**
   * 删除单个记录
   * @param item
   */
  public delete(item: IDetail): Promise<any> {
    return this.remove([item]);
  }

  /**
   * 删除历史记录
   * @param items 需要删除的列表
   */
  public remove(items: IDetail[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        for (let index = this.items.length - 1; index >= 0; index--) {
          let item: IDetail = this.items[index];
          let findIndex = items.findIndex((data: IDetail) => {
            return data.id === item.id;
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
   * 清除历史记录
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = [];
      this.updateData();
      resolve([]);
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
}
