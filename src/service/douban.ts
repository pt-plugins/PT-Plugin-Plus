export class DoubanService {
  public apiHost = "https://api.douban.com/v2";

  public getInfos(key: string): Promise<any> {
    if (/^(tt\d+)$/.test(key)) {
      return this.getInfoFromIMDb(key);
    }

    return new Promise<any>((resolve?: any, reject?: any) => {
      reject("暂未实现");
    });
  }

  /**
   * 根据指定的 IMDbId 获取电影信息
   * @param IMDbId
   */
  public getInfoFromIMDb(IMDbId: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (/^(tt\d+)$/.test(IMDbId)) {
        let url = `${this.apiHost}/movie/imdb/${IMDbId}`;
        fetch(url)
          .then(result => {
            result
              .json()
              .then(json => {
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
}
