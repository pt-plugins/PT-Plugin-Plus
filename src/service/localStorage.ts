import { EStorageType } from "@/interface/common";
export default class localStorage {
  private isExtensionMode: boolean = false;
  constructor() {
    if (window.chrome && chrome.extension) {
      this.isExtensionMode = true;
    }
  }

  public set(key: any, value?: any, type: EStorageType = EStorageType.json) {
    if (this.isExtensionMode) {
      let data: any = {};
      data[key] = value;
      // console.log("save", data);
      chrome.storage.local.set(data);
    } else {
      // console.log(key);
      if (typeof value !== "string" && type == EStorageType.json) {
        value = JSON.stringify(value);
      }
      window.localStorage.setItem(key, value);
    }
  }

  public get(
    key: string,
    callback?: any,
    type: EStorageType = EStorageType.json
  ) {
    if (this.isExtensionMode) {
      chrome.storage.local.get(key, (result: any) => {
        if (result && result[key]) {
          callback(result[key]);
        } else {
          callback(null);
        }
      });
    } else {
      let result = window.localStorage.getItem(key);
      if (result && type == EStorageType.json) {
        result = JSON.parse(result);
      }
      callback && callback(result);
    }
  }
}
