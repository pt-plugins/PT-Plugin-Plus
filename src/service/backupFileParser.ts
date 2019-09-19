import JSZip from "jszip";
import md5 from "blueimp-md5";

import { Dictionary, IManifest, IHashData } from "@/interface/common";
import { PPF } from "./public";

export class BackupFileParser {
  /**
   * 创建用于验证数据对象
   */
  public createHash(data: string): IHashData {
    const length = data.length;

    const keys: any[] = [];

    let result: IHashData = {
      hash: "",
      keyMap: [],
      length
    };

    for (let n = 0; n < 32; n++) {
      let index = Math.round(length * Math.random());
      keys.push(data.substr(index, 1));
      result.keyMap.push(index);
    }

    result.hash = md5(keys.join(""));

    return result;
  }

  /**
   * 获取备份数据
   */
  public createBackupFileBlob(rawData: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        const zip = new JSZip();

        if (rawData.options.system) {
          delete rawData.options.system;
        }

        const options = JSON.stringify(rawData.options);
        const userData = JSON.stringify(rawData.userData);

        // 配置
        zip.file("options.json", options);
        // 用户数据
        zip.file("userdatas.json", userData);

        // 创建检证用的文件
        const manifest = {
          checkInfo: this.createHash(options + userData),
          version: PPF.getVersion(),
          time: new Date().getTime()
        };
        zip.file("manifest.json", JSON.stringify(manifest));

        // 用户收藏
        if (rawData.collection) {
          zip.file("collection.json", JSON.stringify(rawData.collection));
        }

        // 站点Cookies
        if (rawData.cookies) {
          zip.file("cookies.json", JSON.stringify(rawData.cookies));
        }

        zip.generateAsync({ type: "blob" }).then((blob: any) => {
          resolve(blob);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 加载备份数据
   * @param data
   */
  public loadZipData(data: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      JSZip.loadAsync(data)
        .then(zip => {
          let requests: any[] = [];
          requests.push(zip.file("manifest.json").async("text"));
          requests.push(zip.file("options.json").async("text"));
          requests.push(zip.file("userdatas.json").async("text"));

          if (zip.file("collection.json")) {
            requests.push(zip.file("collection.json").async("text"));
          }

          if (zip.file("cookies.json")) {
            requests.push(zip.file("cookies.json").async("text"));
          }
          return Promise.all(requests);
        })
        .then(results => {
          const result: Dictionary<any> = {
            manifest: JSON.parse(results[0]),
            options: JSON.parse(results[1]),
            datas: JSON.parse(results[2])
          };

          if (results.length > 3) {
            result["collection"] = JSON.parse(results[3]);
          }

          if (results.length > 4) {
            result["cookies"] = JSON.parse(results[4]);
          }

          if (this.checkData(result.manifest, results[1] + results[2])) {
            resolve(result);
          } else {
            reject("error");
          }
        })
        .catch(error => {
          console.log(error);
          reject(error);
        });
    });
  }

  /**
   * 简单验证数据，仅防止格式错误的数据
   */
  public checkData(manifest: IManifest, data: string): boolean {
    if (!manifest) {
      return false;
    }

    if (!manifest.checkInfo) {
      return false;
    }

    const checkInfo = manifest.checkInfo;
    const length = data.length;

    if (length !== checkInfo.length) {
      return false;
    }

    const keys: any[] = [];

    try {
      if (checkInfo.keyMap.length !== 32) {
        return false;
      }
      for (let n = 0; n < 32; n++) {
        let index = checkInfo.keyMap[n];
        keys.push(data.substr(index, 1));
      }

      if (md5(keys.join("")) === checkInfo.hash) {
        return true;
      }
    } catch (error) {}

    return false;
  }
}
