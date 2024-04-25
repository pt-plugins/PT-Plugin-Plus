/**
 * Google云端存储类
 */
export class SyncStorage {
  private arrayValues: any = {};
  private isArray(o: any) {
    return Object.prototype.toString.call(o) == "[object Array]";
  }

  /**
   * 清除所有参数
   */
  public clear(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      try {
        chrome.storage.sync.clear();
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 保存一个键值
   * @param key 键名
   * @param value 键值
   * @param count 当参数为数组时，数组的长度
   * @param onSuccess 成功时回调
   * @param onError 失败时回调
   */
  private _set(
    key: string,
    value: any,
    count: number = 0,
    onSuccess?: any,
    onError?: any
  ) {
    let _data = value;
    let _key = key;
    let index = -1;

    // 因Google 限制每项内容不得超出 8K，固将内容拆分后保存
    // 限制说明：https://developer.chrome.com/extensions/storage#type-StorageArea
    // 当内容为数组时，分开保存
    if (this.isArray(value)) {
      if (count == 0) {
        count = value.length;
        // 设置数组长度
        this._set(
          `${key}__count`,
          count,
          0,
          () => {
            this._set(key, value, count, onSuccess, onError);
          },
          onError
        );
        return;
      }
      index = value.length - 1;
      _data = value.pop();
      _key = `${key}_${index}`;
    }

    chrome.storage.sync.set(
      {
        [_key]: _data
      },
      () => {
        if (chrome.runtime.lastError) {
          onError(chrome.runtime.lastError);
        } else {
          // console.log(_key, "SAVED");
          if (index > 0) {
            this._set(key, value, count, onSuccess, onError);
          } else {
            onSuccess(value);
          }
        }
      }
    );
  }

  /**
   * 获取指定的键值
   * @param key 键名
   * @param checkArray 是否检查数组
   * @param index 当前索引
   * @param onSuccess 成功回调
   * @param onError 失败回调
   */
  private _get(
    key: string,
    checkArray: boolean = false,
    index: number = 0,
    onSuccess?: any,
    onError?: any
  ) {
    if (checkArray) {
      this._get(
        `${key}__count`,
        false,
        0,
        (result: any) => {
          if (result > 0) {
            this.arrayValues[key] = [];
            this._get(key, false, result, onSuccess, onError);
          } else {
            this._get(key, false, 0, onSuccess, onError);
          }
        },
        (error: any) => {
          if (error == "参数不存在") {
            this._get(key, false, 0, onSuccess, onError);
          } else {
            onError && onError(error);
          }
        }
      );
      return;
    }

    let _key = key;
    if (index > 0) {
      _key = `${key}_${index - 1}`;
    }

    try {
      chrome.storage.sync.get(_key, result => {
        let value: any = null;
        // console.log(_key, "GETED", result);
        try {
          if (result[_key]) {
            value = result[_key];
          } else {
            onError("参数不存在");
            return;
          }
        } catch (error) {
          onError(error);
          return;
        }

        index--;
        if (index <= 0) {
          if (this.arrayValues[key]) {
            this.arrayValues[key].push(value);
            onSuccess(this.arrayValues[key]);
            delete this.arrayValues[key];
          } else {
            onSuccess(value);
          }
        } else {
          this.arrayValues[key].push(value);
          this._get(key, false, index, onSuccess, onError);
        }
      });
    } catch (error) {
      onError(error);
    }
  }

  /**
   * 保存指定的键值到Google
   * @param key
   * @param value
   */
  public set(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome.storage && chrome.storage.sync) {
        try {
          this._set(
            key,
            value,
            0,
            () => {
              resolve(value);
            },
            (error: any) => {
              reject(error);
            }
          );
        } catch (error) {
          reject(error);
        }
      } else {
        reject("chrome.storage 不存在");
      }
    });
  }

  /**
   * 从Google中获取指定的键值
   * @param key
   */
  public get(key: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (chrome.storage && chrome.storage.sync) {
        try {
          this._get(
            key,
            true,
            0,
            (result: any) => {
              resolve(result);
            },
            (error: any) => {
              reject(error);
            }
          );
        } catch (error) {
          reject(error);
        }
      } else {
        reject("chrome.storage 不存在");
      }
    });
  }
}
