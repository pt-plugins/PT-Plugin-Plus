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
          path: this.defaultPath
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
        PTSevrice.call(
          PTSevrice.action.sendTorrentToDefaultClient, {
            url: option.url,
            title: option.title,
            savePath: this.defaultPath,
            autoStart: this.defaultClientOptions.autoStart
          }
        ).then(result => {
          console.log("命令执行完成", result);
          let notice = {
            type: "error",
            msg: ""
          };

          switch (this.defaultClientOptions.type) {
            // transmission
            case this.downloadClientType.transmission:
              if (result.id != undefined) {
                notice.msg = result.name + " 已发送至 Transmission，编号：" + result.id;
                notice.type = "success";
                if (!this.defaultPath) {
                  notice.type = "info";
                  notice.msg += "；但站点默认目录未配置，建议配置。";
                }
              } else if (result.status) {
                switch (result.status) {
                  // 重复的种子
                  case "duplicate":
                    notice.msg = result.torrent.name + " 种子已存在！编号：" + result.torrent.id;
                    break;

                  case "error":
                    notice.msg = "链接发送失败，请检查下载服务器是否可用。";
                    break;
                  default:
                    notice.msg = result.msg;
                    break;
                }
              } else {
                notice.msg = result;
              }

              break;

            default:
              notice = {
                type: "success",
                msg: '种子已添加'
              };
              break;
          }

          if (showNotice) {
            PTSevrice.showNotice(notice);
          }
          resolve(result);
        }).catch((result) => {
          PTSevrice.showNotice({
            msg: result
          });
          reject(result);
        });
      });
    }
  }

  window.NexusPHPCommon = Common;
})(jQuery, window);