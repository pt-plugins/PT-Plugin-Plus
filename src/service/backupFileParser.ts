import JSZip from "jszip";
import md5 from "blueimp-md5";
import * as CryptoJS from "crypto-js";

import {
  Dictionary,
  IManifest,
  IHashData,
  EEncryptMode,
  Options,
  ERestoreError,
  IBackupRawData
} from "@/interface/common";
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
  public createBackupFileBlob(rawData: IBackupRawData): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        const zip = new JSZip();

        if (rawData.options.system) {
          delete rawData.options.system;
        }

        const _options = rawData.options as Options;
        const secretKey = _options.encryptBackupData
          ? _options.encryptSecretKey
          : "";
        if (_options.encryptSecretKey) {
          delete rawData.options.encryptSecretKey;
        }
        const options = this.encryptData(rawData.options, secretKey);
        const userData = this.encryptData(rawData.userData, secretKey);

        // 配置
        zip.file("options.json", options);
        // 用户数据
        zip.file("userdatas.json", userData);

        // 创建检证用的文件
        const manifest = {
          checkInfo: this.createHash(options + userData),
          version: PPF.getVersion(),
          time: new Date().getTime(),
          encryptMode: secretKey ? EEncryptMode.AES : ""
        };
        zip.file("manifest.json", JSON.stringify(manifest));

        // 用户收藏
        if (rawData.collection) {
          zip.file(
            "collection.json",
            this.encryptData(rawData.collection, secretKey)
          );
        }

        // 站点Cookies
        if (rawData.cookies) {
          zip.file(
            "cookies.json",
            this.encryptData(rawData.cookies, secretKey)
          );
        }

        // 搜索结果快照
        if (rawData.searchResultSnapshot) {
          zip.file(
            "searchResultSnapshot.json",
            this.encryptData(rawData.searchResultSnapshot, secretKey)
          );
        }

        // 辅种任务
        if (rawData.keepUploadTask) {
          zip.file(
            "keepUploadTask.json",
            this.encryptData(rawData.keepUploadTask, secretKey)
          );
        }

        // 下载历史
        if (rawData.downloadHistory) {
          zip.file(
            "downloadHistory.json",
            this.encryptData(rawData.downloadHistory, secretKey)
          );
        }

        // 压缩处理
        zip
          .generateAsync({
            type: "blob",
            compression: "DEFLATE",
            // level 范围： 1-9 ，9为最高压缩比
            compressionOptions: {
              level: 9
            }
          })
          .then((blob: any) => {
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
   * @param secretKeyTitle
   * @param secretKey
   */
  public loadZipData(
    data: any,
    secretKeyTitle: string = "请输入密钥：",
    secretKey: string = ""
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      JSZip.loadAsync(data)
        .then(zip => {
          let requests: any[] = [];
          requests.push(zip.file("manifest.json")!.async("text"));
          requests.push(zip.file("options.json")!.async("text"));
          requests.push(zip.file("userdatas.json")!.async("text"));

          if (zip.file("collection.json")) {
            requests.push(zip.file("collection.json")!.async("text"));
          }

          if (zip.file("cookies.json")) {
            requests.push(zip.file("cookies.json")!.async("text"));
          }

          if (zip.file("searchResultSnapshot.json")) {
            requests.push(zip.file("searchResultSnapshot.json")!.async("text"));
          }

          if (zip.file("keepUploadTask.json")) {
            requests.push(zip.file("keepUploadTask.json")!.async("text"));
          }

          if (zip.file("downloadHistory.json")) {
            requests.push(zip.file("downloadHistory.json")!.async("text"));
          }

          return Promise.all(requests);
        })
        .then(results => {
          const manifest: IManifest = JSON.parse(results[0]);

          console.log(manifest);

          if (manifest.encryptMode) {
            // 如果已指定了密钥，则先尝试是否正确
            if (secretKey) {
              if (this.decryptData(results[1], secretKey) === null) {
                secretKey = "";
              }
            }

            if (!secretKey) {
              let tmpSecretKey = window.prompt(secretKeyTitle);
              if (!tmpSecretKey) {
                reject(ERestoreError.needSecretKey);
                return;
              }

              secretKey = tmpSecretKey;

              let test = this.decryptData(results[1], secretKey);
              if (test === null) {
                reject(ERestoreError.errorSecretKey);
                return;
              }
            }
          } else {
            secretKey = "";
          }

          const result: Dictionary<any> = {
            manifest,
            options: this.decryptData(results[1], secretKey),
            datas: this.decryptData(results[2], secretKey)
          };

          if (results.length > 3) {
            result["collection"] = this.decryptData(results[3], secretKey);
          }

          if (results.length > 4 && PPF.checkOptionalPermission("cookies")) {
            result["cookies"] = this.decryptData(results[4], secretKey);
          }

          if (results.length > 5) {
            result["searchResultSnapshot"] = this.decryptData(
              results[5],
              secretKey
            );
          }

          if (results.length > 6) {
            result["keepUploadTask"] = this.decryptData(results[6], secretKey);
          }

          if (results.length > 7) {
            result["downloadHistory"] = this.decryptData(results[7], secretKey);
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

  /**
   * 加密数据
   * @param data 原始数据，JS对象
   * @param secretKey 密钥，如果不指定，则不加密
   */
  public encryptData(data: any, secretKey: string = "") {
    if (!secretKey) {
      return JSON.stringify(data);
    }
    return this.encrypt(JSON.stringify(data), secretKey);
  }

  /**
   * 解密数据
   * @param data 已加密的数据
   * @param secretKey 密钥，如果不指定，则直接使用 JSON.parse 返回
   */
  public decryptData(data: string, secretKey: string = "") {
    if (!secretKey) {
      return JSON.parse(data);
    }
    try {
      return JSON.parse(this.decrypt(data, secretKey));
    } catch (error) {
      return null;
    }
  }

  /**
   * 以 AES 方式加密数据
   * @param data 原数据
   * @param secretKey 密钥
   */
  public encrypt(data: string, secretKey: string = "") {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  }

  /**
   * 以 AES 方式解密数据
   * @param data 已加密的数据
   * @param secretKey 密钥
   */
  public decrypt(data: string, secretKey: string = "") {
    return CryptoJS.AES.decrypt(data, secretKey).toString(CryptoJS.enc.Utf8);
  }
}
