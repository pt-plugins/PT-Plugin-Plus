import { IMediaServer } from "@/interface/common";
export type Dictionary<T> = { [key: string]: T };

export class Emby {
  public serverURL: string = "";

  private API: any = {
    methods: {
      findFromIMDb: 'Items?Recursive=true&Fields=Path,Size,OfficialRating,MediaSources&AnyProviderIdEquals=imdb.$imdbId$',
      getSystemInfo: 'System/Info'
    }
  }

  constructor(public options: IMediaServer) {
    this.serverURL = this.options.address;
    if (this.serverURL.substr(-1) !== "/") {
      this.serverURL += "/";
    }
  }

  /**
 * 替换指定的字符串列表
 * @param source
 * @param maps
 */
  public replaceKeys(
    source: string,
    maps: Dictionary<any>,
    prefix: string = ""
  ): string {
    if (!source) {
      return source;
    }
    let result: string = source;

    for (const key in maps) {
      if (maps.hasOwnProperty(key)) {
        const value = maps[key];
        let search = "$" + key + "$";
        if (prefix) {
          search = `$${prefix}.${key}$`;
        }
        result = result.replace(search, value);
      }
    }
    return result;
  }

  /**
   * 指定指定的API
   * @param method 
   * @param data 
   * @returns 
   */
  public async execAPI(method = '', data: any = {}) {
    let m: any;
    let methods = method.split(".");

    if (methods.length == 1) {
      m = this.API.methods[method]
    } else {
      m = this.API.methods[methods[0]][methods[1]]
    }

    let url = '';
    let mode = 'GET';
    if (typeof (m) == 'string') {
      url = m;
    } else {
      url = m.url;
      mode = m.mode || 'GET';
    }

    url = this.serverURL + this.replaceKeys(url, data);

    const options = {
      method: mode,
      headers: {
        accept: 'application/json',
        'X-Emby-Token': `${this.options.apiKey}`
      }
    };


    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error(`HTTP 错误！状态码：${response.status}`);
      }
    } catch (error) {

    }

    return false;
  }

  /**
   * 验证服务器可用性
   */
  public async ping() {
    const result = await this.execAPI('getSystemInfo');
    if (result && result.Id) {
      return true;
    }

    return false;
  }

  /**
   * 根据imdbId 获取媒体信息
   * @param imdbId 
   * @returns 
   */
  public async getMediaFromMediaServer(imdbId: string) {
    const result = await this.execAPI('findFromIMDb', {
      imdbId
    });
    if (result && result.Items) {
      return result;
    }

    return false;
  }
}