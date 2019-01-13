String.prototype.getQueryString = function (name, split) {
  if (split == undefined) split = "&";
  var reg = new RegExp(
      "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
    ),
    r;
  if ((r = this.match(reg))) return decodeURI(r[2]);
  return null;
};

(function ($, window) {
  class Common {
    constructor() {
      this.defaultPath = PTSevrice.getSiteDefaultPath();
      this.downloadClientType = PTSevrice.downloadClientType;
      this.defaultClientOptions = PTSevrice.getClientOptions();
    }

    /**
     * 初始化当前默认服务器可用空间
     */
    initFreeSpaceButton() {
      if (!this.defaultPath) {
        return;
      }
      PTSevrice.call(
        PTSevrice.action.getFreeSpace, {
          path: this.defaultPath,
          clientId: PTSevrice.site.defaultClientId
        }
      ).then((result) => {
        console.log("命令执行完成", result);
        if (result && result.arguments) {
          // console.log(PTSevrice.filters.formatSize(result.arguments["size-bytes"]));

          PTSevrice.addButton({
            title: "默认服务器剩余空间\n" + this.defaultPath,
            icon: "filter_drama",
            label: PTSevrice.filters.formatSize(result.arguments["size-bytes"])
          })

        }
        // success();
      }).catch(() => {
        // error()
      });
    }

    /**
     * 发送种子到默认下载服务器
     * @param {string} url 
     */
    sendTorrentToDefaultClient(option, showNotice = true) {
      return new Promise((resolve, reject) => {
        if (typeof option === "string") {
          option = {
            url: option,
            title: ""
          }
        }

        let notice = null;
        if (showNotice) {
          notice = PTSevrice.showNotice({
            type: "info",
            msg: "正在发送下载链接到服务器，请稍候……"
          });
        }

        PTSevrice.call(
          PTSevrice.action.sendTorrentToDefaultClient, {
            url: option.url,
            title: option.title,
            savePath: this.defaultPath,
            autoStart: this.defaultClientOptions.autoStart
          }
        ).then(result => {
          notice && notice.hide();
          console.log("命令执行完成", result);
          if (showNotice) {
            PTSevrice.showNotice(result);
          }
          resolve(result);
        }).catch((result) => {
          notice && notice.hide();
          PTSevrice.showNotice({
            msg: result && result.msg || result
          });
          reject(result);
        });
      });
    }

    /**
     * 下载拖放的种子
     * @param {*} url 
     * @param {*} callback 
     */
    downloadFromDroper(data, callback) {
      if (!PTSevrice.site.passkey) {
        PTSevrice.showNotice({
          msg: "请先设置站点密钥（Passkey）。"
        });
        callback();
        return;
      }

      if (typeof data === "string") {
        data = {
          url: data,
          title: ""
        };
      }

      if (!data.url.getQueryString) {
        PTSevrice.showNotice({
          msg: "系统依赖函数（getQueryString）未正确加载，请尝试刷新页面或重新启用插件。"
        });
        callback();
        return;
      }

      let id = data.url.getQueryString("id");
      if (id) {
        // 如果站点没有配置禁用https，则默认添加https链接
        data.url = PTSevrice.site.url + "download.php?id=" + id + "&passkey=" + PTSevrice.site.passkey + (PTSevrice.site.disableHttps ? "" : "&https=1");
      } else {
        data.url = "";
      }

      if (!data.url) {
        PTSevrice.showNotice({
          msg: "无效的链接"
        });
        callback();
        return;
      }

      this.sendTorrentToDefaultClient(data).then((result) => {
        callback(result);
      }).catch((result) => {
        callback(result);
      });
    }


    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      return new Promise((resolve, reject) => {
        switch (action) {
          // 从当前的DOM中获取下载链接地址
          case PTSevrice.action.downloadFromDroper:
            this.downloadFromDroper(data, () => {
              resolve()
            });
            break;
        }
      });
    }
  }

  window.NexusPHPCommon = Common;
})(jQuery, window);