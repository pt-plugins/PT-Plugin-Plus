import { ICollection, EConfigKey, ICollectionGroup } from "@/interface/common";
import localStorage from "@/service/localStorage";
import { MovieInfoService } from "@/service/movieInfoService";
import { PPF } from "@/service/public";

/**
 * 收藏
 */
export default class Collection {
  public items: ICollection[] = [];
  public groups: ICollectionGroup[] = [];
  public storage: localStorage = new localStorage();
  public movieInfoService = new MovieInfoService();

  private configKey = EConfigKey.collection;

  constructor() {
    this.load();
  }

  /**
   * 获取收藏历史记录
   */
  public load(groupId?: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.storage.get(this.configKey, (result: any) => {
        let data = {
          groups: [] as ICollectionGroup[],
          items: [] as ICollection[]
        };

        if (Array.isArray(result)) {
          data.items = result;
        } else if (result) {
          data = Object.assign(data, result);
        }

        this.groups = data.groups || [];
        this.items = data.items || [];

        let _result: ICollection[] = [];

        if (groupId) {
          this.items.forEach((item: ICollection) => {
            if (item.groups && item.groups.includes(groupId)) {
              _result.push(item);
            }
          });
        } else {
          _result = this.items;
        }

        this.updateGroupCount();

        resolve(_result);
      });
    });
  }

  public updateGroupCount() {
    this.groups.forEach((group: ICollectionGroup) => {
      group.count = 0;
      this.items.forEach((item: ICollection) => {
        if (item.groups && group.id && item.groups.includes(group.id)) {
          if (!group.count) {
            group.count = 0;
          }
          group.count++;
        }
      });
    });
  }

  /**
   * 添加新记录
   * @param newItem
   */
  public add(newItem: ICollection): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let saveData = Object.assign(
        {
          time: new Date().getTime()
        },
        newItem
      );

      let movieInfo = Object.assign({}, saveData.movieInfo);

      if (movieInfo.imdbId) {
        // 获取影片信息
        this.movieInfoService
          .getInfoFromIMDb(movieInfo.imdbId)
          .then(result => {
            // 保留数字ID
            movieInfo.doubanId = result.id.toString().replace(/(\D)/g, "");
            movieInfo.image = result.image;
            movieInfo.title = result.title;
            movieInfo.link = result.mobile_link;
            movieInfo.alt_title = result.alt_title;
            if (result.attrs) {
              movieInfo.year = result.attrs.year[0];
            }

            saveData.movieInfo = movieInfo;
            this.push(saveData);
            resolve(this.items);
          })
          .catch(error => {
            console.log(error);
            this.push(saveData);
            resolve(this.items);
          });
      } else {
        this.push(saveData);
        resolve(this.items);
      }
    });
  }

  private push(newItem: ICollection) {
    let index = this.items.findIndex((item: ICollection) => {
      return item.link === newItem.link;
    });
    if (index === -1) {
      this.items.push(newItem);
      this.updateGroupCount();
      this.storage.set(this.configKey, {
        groups: this.groups,
        items: this.items
      });
    }
  }

  /**
   * 更新指定的记录
   * @param item
   */
  public update(item: ICollection): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        let index = this.items.findIndex((data: ICollection) => {
          return data.link === item.link;
        });
        if (index >= 0) {
          this.items[index] = item;
        }
        this.updateGroupCount();
        this.storage.set(this.configKey, {
          groups: this.groups,
          items: this.items
        });
        resolve(this.items);
      });
    });
  }

  /**
   * 删除单个记录
   * @param item
   */
  public delete(item: ICollection): Promise<any> {
    return this.remove([item]);
  }

  /**
   * 删除历史记录
   * @param items 需要删除的列表
   */
  public remove(items: ICollection[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        for (let index = this.items.length - 1; index >= 0; index--) {
          let item: ICollection = this.items[index];
          let findIndex = items.findIndex((data: ICollection) => {
            return data.link === item.link;
          });
          if (findIndex >= 0) {
            this.items.splice(index, 1);
          }
        }
        this.updateGroupCount();
        this.storage.set(this.configKey, {
          groups: this.groups,
          items: this.items
        });
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
      this.groups = [];
      this.storage.set(this.configKey, {});
      resolve({});
    });
  }

  /**
   * 获取指定链接的收藏
   * @param link
   */
  public get(link: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        let item = this.items.find((data: ICollection) => {
          return data.link === link;
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
   * 重置
   * @param items
   */
  public reset(items: ICollection[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.items = items;
      this.storage.set(this.configKey, {
        groups: this.groups,
        items: this.items
      });
      resolve(this.items);
    });
  }

  public addGroup(newItem: ICollectionGroup): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let saveData = Object.assign(
        {
          id: PPF.getNewId().substr(8),
          update: new Date().getTime()
        },
        newItem
      );

      this.groups.push(saveData);
      this.storage.set(this.configKey, {
        groups: this.groups,
        items: this.items
      });
      resolve(this.groups);
    });
  }

  /**
   * 删除历史记录
   * @param items 需要删除的列表
   */
  public removeGroup(items: ICollectionGroup[]): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        for (let index = this.groups.length - 1; index >= 0; index--) {
          let item: ICollectionGroup = this.groups[index];
          let findIndex = items.findIndex((data: ICollectionGroup) => {
            return data.id === item.id;
          });
          if (findIndex >= 0) {
            this.groups.splice(index, 1);
          }
        }
        this.storage.set(this.configKey, {
          groups: this.groups,
          items: this.items
        });
        resolve(this.groups);
      });
    });
  }

  public updateGroup(item: ICollectionGroup): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        let index = this.groups.findIndex((data: ICollectionGroup) => {
          return data.id === item.id;
        });
        if (index >= 0) {
          this.groups[index] = item;
        }
        this.storage.set(this.configKey, {
          groups: this.groups,
          items: this.items
        });
        resolve(this.groups);
      });
    });
  }

  public getGroups(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        resolve(this.groups);
      });
    });
  }

  public addToGroup(item: ICollection, groupId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!item.groups) {
        item.groups = [];
      }

      let index = item.groups.findIndex((id: string) => {
        return id === groupId;
      });

      if (index === -1) {
        item.groups.push(groupId);
        this.update(item).then(() => {
          resolve(true);
        });
      } else {
        reject(false);
      }
    });
  }

  public removeFromGroup(item: ICollection, groupId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (item.groups) {
        let index = item.groups.findIndex((id: string) => {
          return id === groupId;
        });

        if (index !== -1) {
          item.groups.splice(index, 1);
          this.update(item).then(() => {
            resolve(true);
          });
        } else {
          reject(false);
        }
      }
    });
  }
}
