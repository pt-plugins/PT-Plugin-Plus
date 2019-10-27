import { EAction, EDataResultType } from "@/interface/common";
import { APP } from "./api";

export default class Extension {
  public isExtensionMode: boolean = APP.isExtensionMode;

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
              if (chrome.runtime.lastError) {
                let message = chrome.runtime.lastError.message || "";
                console.log(
                  "Extension.sendRequest.runtime",
                  action,
                  data,
                  chrome.runtime.lastError.message
                );
                if (/Could not establish connection/.test(message)) {
                  APP.showNotifications({
                    message: "插件状态未知，当前操作可能失败，请刷新页面后再试"
                  });
                  reject(chrome.runtime.lastError);
                  return;
                }

                if (
                  !/The message port closed before a response was received/.test(
                    message
                  )
                ) {
                  reject(chrome.runtime.lastError);
                  return;
                }
              }

              callback && callback(result.resolve || result.reject);

              if (result.reject) {
                reject(result.reject);
              } else if (
                result.resolve &&
                (result.resolve.status === "error" ||
                  result.resolve.success === false)
              ) {
                reject(result.resolve);
              } else {
                resolve(result.resolve);
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

      /**
       * 仅对调试界面时使用
       */
      if (process.env.NODE_ENV === "test") {
        // 使用 import() 方法是为了在打包时减少不必要的代码依赖
        import("@/background/service")
          .then((result: any) => {
            console.log(result);
            const PTService = new result.default(true);
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
          })
          .catch(error => {
            console.log("sendRequest.error", error);
          });
      }
    });
  }
}
