import { ICollection, EConfigKey } from "@/interface/common";
import localStorage from "@/service/localStorage";
import { MovieInfoService } from "@/service/movieInfoService";

/**
 * 收藏
 */
export default class Collection {
  public items: any[] = [];
  public storage: localStorage = new localStorage();
  public movieInfoService = new MovieInfoService();

  private configKey = EConfigKey.collection;

  constructor() {
    this.load();
  }

  /**
   * 获取收藏历史记录
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
      this.storage.set(this.configKey, this.items);
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
        this.storage.set(this.configKey, this.items);
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
        this.storage.set(this.configKey, this.items);
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
      this.storage.set(this.configKey, this.items);
      resolve(this.items);
    });
  }
}
