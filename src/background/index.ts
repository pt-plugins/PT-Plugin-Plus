import PTPlugin from "./service";

const PTService = new PTPlugin();

// 监听由活动页面发来的消息事件
// chrome.runtime.onMessage.addListener
chrome.extension.onRequest.addListener(function(request, sender, callback) {
  PTService.requestMessage(request, sender)
    .then((result: any) => {
      callback && callback(result);
    })
    .catch((result: any) => {
      callback && callback(result);
    });
  return true;
});
