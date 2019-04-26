import { Dictionary } from "@/interface/common";

export type MovieInfoCache = {
  base: Dictionary<any>;
  ratings: Dictionary<any>;
  doubanToIMDb: Dictionary<any>;
};

/**
 * 电影信息
 */
export class MovieInfoService {
  // 豆瓣
  public doubanApiURL = "https://api.douban.com/v2";
  // 用于加载评分信息
  public omdbApiURL = "https://www.omdbapi.com";
  // 用于获取IMDbID
  public omitApiURL = "https://omit.mkrobot.org";
  // omdbapi 申请的Key列表
  // 每个 key 一天有1000次请求限制
  public omdbApiKeys = ["e0d3039d", "a67d9bce"];

  // 信息缓存
  public cache: MovieInfoCache = {
    base: {},
    ratings: {},
    doubanToIMDb: {}
  };

  public getInfos(key: string): Promise<any> {
    if (/^(tt\d+)$/.test(key)) {
      return this.getInfoFromIMDb(key);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      reject("暂未实现");
    });
  }

  /**
   * 判断是否为 IMDbId
   * @param IMDbId
   */
  public isIMDbId(IMDbId: string): boolean {
    return /^(tt\d+)$/.test(IMDbId);
  }

  /**
   * 根据指定的 IMDbId 获取电影信息
   * @param IMDbId
   */
  public getInfoFromIMDb(IMDbId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (this.isIMDbId(IMDbId)) {
        let cache = this.cache.base[IMDbId];
        if (cache) {
          resolve(cache);
          return;
        }
        let url = `${this.doubanApiURL}/movie/imdb/${IMDbId}`;
        fetch(url)
          .then(result => {
            result
              .json()
              .then(json => {
                this.cache.base[IMDbId] = json;
                resolve(json);
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            reject(error);
          });
      } else {
        reject("error IMDbId");
      }
    });
  }

  /**
   * 获取评分信息
   * @param IMDbId
   */
  public getRatings(IMDbId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (this.isIMDbId(IMDbId)) {
        let cache = this.cache.ratings[IMDbId];
        if (cache) {
          resolve(cache);
          return;
        }

        // 每个Key 1000 一天的限制
        let apikey = this.omdbApiKeys[
          Math.floor(Math.random() * this.omdbApiKeys.length)
        ];
        let url = `${
          this.omdbApiURL
        }/?i=${IMDbId}&apikey=${apikey}&tomatoes=true`;
        fetch(url)
          .then(result => {
            result
              .json()
              .then(json => {
                this.cache.ratings[IMDbId] = json;
                resolve(json);
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            reject(error);
          });
      } else {
        reject("error IMDbId");
      }
    });
  }

  /**
   * 根据指定的 doubanId 获取 IMDbId
   * @param doubanId
   */
  public getIMDbIdFromDouban(doubanId: number): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let cache = this.cache.doubanToIMDb[doubanId];
      if (cache) {
        resolve(cache);
        return;
      }
      let url = `${this.omitApiURL}/movie/${doubanId}/douban/imdb`;
      fetch(url)
        .then(result => {
          result
            .json()
            .then(json => {
              console.log("getIMDbIdFromDouban", json);
              if (json.data) {
                this.cache.doubanToIMDb[doubanId] = json.data;
                resolve(json.data);
              } else {
                reject(json);
              }
            })
            .catch(error => {
              reject(error);
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
