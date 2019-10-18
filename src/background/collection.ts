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
          time: new Date().getTime(),
          site: null
        },
        newItem
      );

      let movieInfo = Object.assign({}, saveData.movieInfo);

      // 清理站点配置信息
      if (saveData.site) {
        delete saveData.site;
      }

      saveData.link = PPF.getCleaningURL(saveData.link);

      if (movieInfo.imdbId || movieInfo.doubanId) {
        // 获取影片信息
        this.getMoviceInfo(movieInfo.imdbId, movieInfo.doubanId)
          .then(result => {
            saveData.movieInfo = result;
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

  private getMoviceInfo(
    imdbId: string = "",
    doubanId: string = ""
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let movieId = imdbId;
      let fn = this.movieInfoService.getInfoFromIMDb;
      if (doubanId) {
        movieId = doubanId;
        fn = this.movieInfoService.getInfoFromDoubanId;
      }

      // 获取影片信息
      fn.call(this.movieInfoService, movieId)
        .then(result => {
          // 保留数字ID
          let movieInfo = {
            imdbId,
            doubanId: result.id.toString().replace(/(\D)/g, ""),
            image:
              result.image || (result.images ? result.images.small : undefined),
            title: result.title,
            link: result.mobile_link || result.share_url,
            alt_title: result.alt_title || result.original_title,
            year: result.year
          };
          if (!result.year && result.attrs) {
            movieInfo.year = result.attrs.year[0];
          }

          resolve(movieInfo);
        })
        .catch(error => {
          reject();
        });
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
        item.link = PPF.getCleaningURL(item.link);
        let index = this.items.findIndex((data: ICollection) => {
          return data.link === item.link;
        });
        if (index >= 0) {
          this.items[index] = item;
          let movieInfo = Object.assign({}, item.movieInfo);

          // 清理站点配置信息
          if (item.site) {
            delete item.site;
          }

          if (movieInfo.imdbId || movieInfo.doubanId) {
            // 获取影片信息
            this.getMoviceInfo(movieInfo.imdbId, movieInfo.doubanId)
              .then(result => {
                item.movieInfo = result;
                this.items[index] = item;
                this.updateData();
                resolve(this.items);
              })
              .catch(error => {
                console.log(error);
                this.updateData();
                resolve(this.items);
              });
            return;
          }
        }

        this.updateData();
        resolve(this.items);
      });
    });
  }

  private updateData() {
    this.updateGroupCount();
    this.storage.set(this.configKey, {
      groups: this.groups,
      items: this.items
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
      link = PPF.getCleaningURL(link);
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
   * @param datas
   */
  public reset(datas: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!datas) {
        reject(false);
        return;
      }
      if (Array.isArray(datas)) {
        this.items = datas;
      } else {
        this.groups = datas.groups || this.groups;
        this.items = datas.items || this.items;
      }

      this.storage.set(this.configKey, {
        groups: this.groups,
        items: this.items
      });
      resolve({
        groups: this.groups,
        items: this.items
      });
    });
  }

  /**
   * 添加分组
   * @param newItem
   */
  public addGroup(newItem: ICollectionGroup): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let saveData = Object.assign(
        {
          id: PPF.getNewId().substr(0, 8),
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
   * 删除分组信息
   * @param items 需要删除的列表
   */
  public removeGroup(
    datas: ICollectionGroup | ICollectionGroup[]
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let items: ICollectionGroup[] = [];
      if (Array.isArray(datas)) {
        items = datas;
      } else {
        items.push(datas);
      }
      this.load().then(() => {
        for (let index = this.groups.length - 1; index >= 0; index--) {
          let group: ICollectionGroup = this.groups[index];
          let findIndex = items.findIndex((data: ICollectionGroup) => {
            return data.id === group.id;
          });
          if (findIndex >= 0) {
            // 清除收藏中已引用该分组的项
            this.items.forEach((item: ICollection) => {
              if (!item.groups) {
                return;
              }
              let index = item.groups.findIndex((id: string) => {
                return id === group.id;
              });

              if (index !== -1) {
                item.groups.splice(index, 1);
              }
            });

            this.groups.splice(index, 1);
          }
        }

        this.updateGroupCount();
        this.storage.set(this.configKey, {
          groups: this.groups,
          items: this.items
        });
        resolve(this.groups);
      });
    });
  }

  /**
   * 更新指定的分组信息
   * @param item
   */
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

  /**
   * 获取分组列表
   */
  public getGroups(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.load().then(() => {
        resolve(this.groups);
      });
    });
  }

  /**
   * 将收藏添加到指定的分组
   * @param item
   * @param groupId
   */
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

  /**
   * 将指定的收藏从分组中删除
   * @param item
   * @param groupId
   */
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

  public getAllLinks() {
    let links: string[] = [];

    this.items.forEach((item: ICollection) => {
      links.push(PPF.getCleaningURL(item.link));
    });

    return links;
  }
}
