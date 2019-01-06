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
            msg: result
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
      if (typeof data === "string") {
        data = {
          url: data,
          title: ""
        };
      }

      console.log(data)

      if (!data.url) {
        PTSevrice.showNotice({
          msg: "无效的链接"
        });
        callback();
        return;
      }

      let authkey = data.url.getQueryString("authkey");
      let torrent_pass = data.url.getQueryString("torrent_pass");
      // authkey=&torrent_pass
      if (!authkey && !torrent_pass) {
        PTSevrice.showNotice({
          msg: "无效的链接，请拖放下载链接"
        });
        callback();
        return;
      }

      if (data.url.substr(0, 1) === "/") {
        data.url = `${location.origin}${data.url}`;
      } else if (data.url.substr(0, 4) !== "http") {
        data.url = `${location.origin}/${data.url}`;
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

  window.GazelleCommon = Common;
})(jQuery, window);