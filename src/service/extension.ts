/**
 * 导入这个是为了本地测试，对于 Chrome 插件实际运行时不起作用
 */
import PTPlugin from "@/background/service";
import { EAction, EDataResultType } from "@/interface/common";

export default class Extension {
  public isExtensionMode: boolean = false;
  constructor() {
    if (window["chrome"] && window.chrome.extension) {
      this.isExtensionMode = true;
    }
  }

  /**
   * 向背景页发送指令
   * @param action 需要执行的命令
   * @param callback 回调函数
   * @param data 附加数据
   */
  public sendRequest(
    action: EAction,
    callback?: any,
    data?: any
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (this.isExtensionMode) {
        try {
          chrome.runtime.sendMessage(
            {
              action,
              data
            },
            (result: any) => {
              callback && callback(result);
              if (
                result &&
                (result.status === "error" || result.success === false)
              ) {
                reject(result);
              } else {
                resolve(result);
              }
            }
          );
        } catch (error) {
          // @see https://groups.google.com/a/chromium.org/forum/#!topic/chromium-extensions/QLC4gNlYjbA
          if (
            /Invocation of form runtime\.connect|doesn't match definition runtime\.connect|Extension context invalidated/.test(
              error.message
            )
          ) {
            // console.error(
            //   "Chrome extension, Actson has been reloaded. Please refresh the page"
            // );
            reject({
              type: EDataResultType.error,
              msg: "插件状态未知，当前操作可能失败，请刷新页面后再试",
              success: false
            });
          } else {
            reject(error);
          }
        }

        return;
      }

      const PTService = new PTPlugin(true);
      PTService.requestMessage({
        action,
        data
      })
        .then((result: any) => {
          callback && callback.call(this, result);
          resolve(result);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }
}
