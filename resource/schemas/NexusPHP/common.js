(function($, window) {
  class Common {
    constructor() {
      this.siteContentMenus = {};
      this.clientContentMenus = [];
      this.defaultPath = PTService.getSiteDefaultPath();
      this.downloadClientType = PTService.downloadClientType;
      this.defaultClientOptions = PTService.getClientOptions();
      this.currentURL = location.href;
    }

    /**
     * 获取指定key的当前语言内容
     * @param {*} key
     * @param {*} options
     */
    t(key, options) {
      return PTService.i18n.t(key, options);
    }

    /**
     * 初始化当前默认服务器可用空间
     */
    initFreeSpaceButton() {
      if (!this.defaultPath) {
        return;
      }
      PTService.call(PTService.action.getFreeSpace, {
        path: this.defaultPath,
        clientId: PTService.site.defaultClientId
      })
        .then(result => {
          console.log("命令执行完成", result);
          if (result && result.arguments) {
            // console.log(PTService.filters.formatSize(result.arguments["size-bytes"]));

            PTService.addButton({
              title: this.t("buttons.freeSpaceTip", {
                path: this.defaultPath,
                interpolation: { escapeValue: false }
              }), // "默认服务器剩余空间\n" + this.defaultPath,
              icon: "filter_drama",
              label: PTService.filters.formatSize(
                result.arguments["size-bytes"]
              )
            });
          }
          // success();
        })
        .catch(() => {
          // error()
        });
    }

    /**
     * 初始化种子详情页面按钮
     */
    initDetailButtons() {
      // 添加下载按钮
      this.addSendTorrentToDefaultClientButton();

      // 添加下载到按钮
      this.addSendTorrentToClientButton();

      // 添加复制下载链接按钮
      this.addCopyTextToClipboardButton();

      // 初始化可用空间按钮
      this.initFreeSpaceButton();

      // 初始化收藏按钮
      this.initCollectionButton();

      // 初始化说谢谢按钮
      this.initSayThanksButton();
      if(document.domain.match("keepfrds.com")){$(".pt-plugin-body").css("z-index","39")}
    }

    /**
     * 初始化种子列表页面按钮
     */
    initListButtons(checkPasskey = false) {
      // 添加下载按钮
      this.defaultClientOptions &&
        PTService.addButton({
          title: this.t("buttons.downloadAllTip", {
            name: this.defaultClientOptions.name
          }), //`将当前页面所有种子下载到[${this.defaultClientOptions.name}]`,
          icon: "get_app",
          label: this.t("buttons.downloadAll"), //"下载所有",
          click: (success, error) => {
            if (checkPasskey && !PTService.site.passkey) {
              error("请先设置站点密钥（Passkey）。");
              return;
            }
            this.startDownloadURLs(success, error);
          }
        });

      // 添加下载到按钮
      PTService.addButton({
        title: this.t("buttons.downloadAllToTip"), //`将当前页面所有种子下载到指定服务器`,
        icon: "save_alt",
        type: PTService.buttonType.popup,
        label: this.t("buttons.downloadAllTo"), //"下载到…",
        /**
         * 单击事件
         * @param success 成功回调事件
         * @param error 失败回调事件
         * @param event 当前按钮事件
         *
         * 两个事件必需执行一个，可以传递一个参数
         */
        click: (success, error, event) => {
          if (checkPasskey && !PTService.site.passkey) {
            // "请先设置站点密钥（Passkey）。"
            error(this.t("needPasskey"));
            return;
          }
          this.showAllContentMenus(event.originalEvent, success, error);
        },
        onDrop: (data, event, success, error) => {
          console.log(data);
          let url = this.getDroperURL(data.url);
          console.log(url);
          this.showContentMenusForUrl(
            {
              url,
              title: data.title,
              link: data.url
            },
            event.originalEvent,
            success,
            error
          );
        }
      });

      // 复制下载链接
      PTService.addButton({
        title: this.t("buttons.copyAllToClipboardTip"), // "复制下载链接到剪切板",
        icon: "file_copy",
        label: this.t("buttons.copyAllToClipboard"), //"复制链接",
        click: (success, error) => {
          if (checkPasskey && !PTService.site.passkey) {
            error(this.t("needPasskey"));
            return;
          }
          let urls = this.getDownloadURLs();

          if (!urls.length || typeof urls == "string") {
            error(urls);
            return;
          }

          PTService.call(PTService.action.copyTextToClipboard, urls.join("\n"))
            .then(result => {
              console.log("命令执行完成", result);
              success();
            })
            .catch(() => {
              error();
            });
        },
        onDrop: (data, event, success, error) => {
          if (checkPasskey && !PTService.site.passkey) {
            error(this.t("needPasskey"));
            return;
          }
          let url = this.getDroperURL(data.url);
          url &&
            PTService.call(PTService.action.copyTextToClipboard, url)
              .then(result => {
                console.log("命令执行完成", result);
                success();
              })
              .catch(() => {
                error();
              });
        }
      });

      // 检查是否有下载管理权限
      this.checkPermissions(["downloads"])
        .then(() => {
          this.addSaveAllTorrentFilesButton(checkPasskey);
        })
        .catch(() => {
          PTService.addButton({
            title: this.t("buttons.needAuthorizationTip"), //"下载所有种子文件功能需要权限，点击前往授权",
            icon: "verified_user",
            key: "requestPermissions",
            label: this.t("buttons.needAuthorization"), //"需要授权",
            click: (success, error) => {
              PTService.call(PTService.action.openOptions, "set-permissions");
              success();
            }
          });
        });
    }

    /**
     * 添加下载所有种子文件按钮
     * @param {*} checkPasskey
     */
    addSaveAllTorrentFilesButton(checkPasskey) {
      // 批量下载当前页种子文件
      PTService.addButton({
        title: this.t("buttons.saveAllTorrentTip"), //"下载所有种子文件",
        icon: "save",
        label: this.t("buttons.saveAllTorrent"), //"所有种子",
        click: (success, error) => {
          if (checkPasskey && !PTService.site.passkey) {
            error(this.t("needPasskey"));
            return;
          }
          let urls = this.getDownloadURLs();

          if (!urls.length || typeof urls == "string") {
            error(urls);
            return;
          }

          let downloads = [];
          urls.forEach(url => {
            downloads.push({
              url,
              method: PTService.site.downloadMethod
            });
          });

          console.log(downloads);

          PTService.call(PTService.action.addBrowserDownloads, downloads)
            .then(result => {
              console.log("命令执行完成", result);
              success();
            })
            .catch(e => {
              console.log(e);
              error(e);
            });
        }
      });
    }

    checkPermissions(permissions) {
      return PTService.call(PTService.action.checkPermissions, permissions);
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
          };
        }

        let savePath = PTService.pathHandler.getSavePath(
          this.defaultPath,
          PTService.site
        );

        if (savePath === false) {
          // "用户取消操作"
          reject(this.t("userCanceled"));
          return;
        }

        let notice = null;
        if (showNotice) {
          notice = PTService.showNotice({
            type: "info",
            timeout: 2,
            indeterminate: true,
            msg: this.t("sendingTorrent") //"正在发送下载链接到服务器，请稍候……"
          });
        }

        PTService.call(PTService.action.sendTorrentToDefaultClient, {
          url: option.url,
          title: option.title,
          savePath: savePath,
          autoStart: this.defaultClientOptions.autoStart,
          tagIMDb: this.defaultClientOptions.tagIMDb,
          link: option.link,
          imdbId: option.imdbId
        })
          .then(result => {
            console.log("命令执行完成", result);
            if (showNotice) {
              PTService.showNotice(result);
            }
            resolve(result);
          })
          .catch(result => {
            // PTService.showNotice({
            //   msg: (result && result.msg) || result
            // });
            reject(result);
          })
          .finally(() => {
            this.hideNotice(notice);
          });
      });
    }

    /**
     * 隐藏指定的 notice
     * @param notice
     */
    hideNotice(notice) {
      if (!notice) return;
      if (notice.id && notice.close) {
        notice.close();
      } else if (notice.hide) {
        notice.hide();
      }
    }

    /**
     * 发送种子到指定下载服务器
     * @param {string} url
     */
    sendTorrentToClient(options, showNotice = true) {
      return new Promise((resolve, reject) => {
        if (typeof options === "string") {
          options = {
            url: options,
            title: ""
          };
        }

        if (!options.clientId) {
          // "无效的下载服务器"
          reject(this.t("invalidDownloadServer"));
          return;
        }

        options.savePath = PTService.pathHandler.getSavePath(
          options.savePath,
          PTService.site
        );
        if (options.savePath === false) {
          // "用户取消操作"
          reject(this.t("userCanceled"));
          return;
        }

        let notice = null;
        if (showNotice) {
          notice = PTService.showNotice({
            type: "info",
            timeout: 2,
            indeterminate: true,
            msg: this.t("sendingTorrent") //"正在发送下载链接到服务器，请稍候……"
          });
        }

        PTService.call(PTService.action.sendTorrentToClient, options)
          .then(result => {
            console.log("命令执行完成", result);
            if (showNotice) {
              PTService.showNotice(result);
            }
            resolve(result);
          })
          .catch(result => {
            // PTService.showNotice({
            //   msg: (result && result.msg) || result
            // });
            reject(result);
          })
          .finally(() => {
            this.hideNotice(notice);
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
          title: "",
          link: data
        };
      }

      data.url = this.getDroperURL(data.url);

      if (!data.url) {
        PTService.showNotice({
          msg: this.t("invalidURL") //"无效的链接"
        });
        callback();
        return;
      }

      this.sendTorrentToDefaultClient(data)
        .then(result => {
          callback(result);
        })
        .catch(result => {
          callback(result);
        });
    }

    isNexusPHP() {
      return PTService.site.schema == "NexusPHP";
    }

    /**
     * 获取有效的拖放地址
     * @param {*} url
     */
    getDroperURL(url) {
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (url && url.substr(0, 2) === "//") {
        url = `${location.protocol}${url}`;
      } else if (url && url.substr(0, 4) !== "http") {
        if (url.substr(0, 1) == "/") {
          url = url.substr(1);
        }
        url = `${siteURL}${url}`;
      }

      return url;
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
          case PTService.action.downloadFromDroper:
            this.downloadFromDroper(data, () => {
              resolve();
            });
            break;
        }
      });
    }

    /**
     * 添加下载到指定下载服务器按钮
     */
    addSendTorrentToClientButton() {
      // 添加下载按钮
      PTService.addButton({
        title: this.t("buttons.downloadToTip"), //`将当前种子下载到指定的服务器`,
        icon: "save_alt",
        type: PTService.buttonType.popup,
        label: this.t("buttons.downloadTo"), //"下载到…",
        /**
         * 单击事件
         * @param success 成功回调事件
         * @param error 失败回调事件
         * @param event 当前按钮事件
         *
         * 两个事件必需执行一个，可以传递一个参数
         */
        click: (success, error, event) => {
          // getDownloadURL 方法有继承者提供
          if (!this.getDownloadURL) {
            // "getDownloadURL 方法未定义"
            error(this.t("getDownloadURLisUndefined"));
            return;
          }

          let url = this.getDownloadURL();

          if (!url) {
            // "获取下载链接失败"
            error(this.t("getDownloadURLFailed"));
            return;
          }

          let title = "";

          if (this.getTitle) {
            title = this.getTitle();
          } else {
            title = document.title;
          }

          this.showContentMenusForUrl(
            {
              url,
              title,
              link: this.currentURL,
              imdbId: this.getIMDbId ? this.getIMDbId() : null
            },
            event.originalEvent,
            success,
            error
          );
        }
      });
    }

    /**
     * 添加一键下载按钮
     */
    addSendTorrentToDefaultClientButton() {
      // 添加下载按钮
      this.defaultClientOptions &&
        PTService.addButton({
          title:
            this.t("buttons.downloadToDefaultTip", {
              name: this.defaultClientOptions.name
            }) + (this.defaultPath ? "\n" + this.defaultPath : ""), //`将当前种子下载到[${this.defaultClientOptions.name}]` +
          icon: "get_app",
          label: this.t("buttons.downloadToDefault"), //"一键下载",
          /**
           * 单击事件
           * @param success 成功回调事件
           * @param error 失败回调事件
           *
           * 两个事件必需执行一个，可以传递一个参数
           */
          click: (success, error) => {
            // getDownloadURL 方法由继承者提供
            if (!this.getDownloadURL) {
              // "getDownloadURL 方法未定义"
              error(this.t("getDownloadURLisUndefined"));
              return;
            }

            let url = this.getDownloadURL();

            if (!url) {
              // "获取下载链接失败"
              error(this.t("getDownloadURLFailed"));
              return;
            }

            let title = "";

            if (this.getTitle) {
              title = this.getTitle();
            } else {
              title = document.title;
            }

            this.sendTorrentToDefaultClient({
              url,
              title,
              link: this.currentURL,
              imdbId: this.getIMDbId ? this.getIMDbId() : null
            })
              .then(() => {
                success();
              })
              .catch(result => {
                error(result);
              });
          }
        });
    }

    /**
     * 添加复制下载链接按钮
     */
    addCopyTextToClipboardButton() {
      // 复制下载链接
      PTService.addButton({
        title: this.t("buttons.copyToClipboardTip"), //"复制下载链接到剪切板",
        icon: "file_copy",
        label: this.t("buttons.copyToClipboard"), //"复制链接",
        click: (success, error) => {
          // getDownloadURL 方法有继承者提供
          if (!this.getDownloadURL) {
            // "getDownloadURL 方法未定义"
            error(this.t("getDownloadURLisUndefined"));
            return;
          }

          console.log(PTService.site, this.defaultPath);
          let url = this.getDownloadURL();

          if (!url) {
            // "获取下载链接失败"
            error(this.t("getDownloadURLFailed"));
            return;
          }

          PTService.call(PTService.action.copyTextToClipboard, url)
            .then(result => {
              console.log("命令执行完成", result);
              success();
            })
            .catch(result => {
              error(result);
            });
        }
      });
    }

    /**
     * 初始化收藏按钮
     */
    initCollectionButton() {
      // 获取收藏情况
      PTService.call(PTService.action.getTorrentCollention, location.href)
        .then(result => {
          this.addRemoveCollectionButton(result);
        })
        .catch(() => {
          this.addToCollectionButton();
        });
    }

    /**
     * 添加收藏按钮
     */
    addToCollectionButton() {
      PTService.removeButton("removeFromCollection");

      PTService.addButton({
        title: this.t("buttons.addToCollection"),
        icon: "favorite_border",
        label: this.t("buttons.addToCollection"),
        key: "addToCollection",
        click: (success, error) => {
          let title = "";

          if (this.getTitle) {
            title = this.getTitle();
          } else {
            title = PTService.getFieldValue("title");
          }

          if (!title) {
            title = $("title:first").text();
          }

          let imdbId = PTService.getFieldValue("imdbId");

          if (!imdbId) {
            const link = $("a[href*='www.imdb.com/title/']:first");
            if (link.length > 0) {
              let match = link.attr("href").match(/(tt\d+)/);

              if (match && match.length >= 2) {
                imdbId = match[1];
              }
            }
          }

          let doubanId = PTService.getFieldValue("doubanId");

          if (!doubanId) {
            const link = $("a[href*='movie.douban.com/subject/']:first");
            if (link.length > 0) {
              let match = link.attr("href").match(/subject\/(\d+)/);

              if (match && match.length >= 2) {
                doubanId = match[1];
              }
            }
          }

          const data = {
            title: title,
            url: this.getDownloadURL(),
            link: location.href,
            host: location.host,
            size: PTService.getFieldValue("size"),
            subTitle: PTService.getFieldValue("subTitle"),
            movieInfo: {
              imdbId: imdbId,
              doubanId: doubanId
            }
          };

          PTService.call(PTService.action.addTorrentToCollection, data)
            .then(result => {
              success();
              setTimeout(() => {
                this.addRemoveCollectionButton(data);
              }, 1000);
            })
            .catch(() => {
              error();
            });
        }
      });
    }

    /**
     * 添加移除收藏按钮
     */
    addRemoveCollectionButton(item) {
      PTService.removeButton("addToCollection");

      PTService.addButton({
        title: this.t("buttons.removeFromCollection"),
        icon: "favorite",
        label: this.t("buttons.removeFromCollection"),
        key: "removeFromCollection",
        click: (success, error) => {
          PTService.call(PTService.action.deleteTorrentFromCollention, item)
            .then(result => {
              success();
              setTimeout(() => {
                this.addToCollectionButton();
              }, 1000);
            })
            .catch(() => {
              error();
            });
        }
      });
    }

    /**
     * 根据指定的URL获取可用的下载目录及客户端信息
     * @param url
     */
    getContentMenusForUrl(url) {
      let urlParser = PTService.filters.parseURL(url);
      if (!urlParser.host) {
        return [];
      }
      let results = [];
      let clients = [];
      let site = PTService.getSiteFromHost(urlParser.host);
      if (!site) {
        return [];
      }
      let host = site.host;

      if (this.siteContentMenus[host]) {
        return this.siteContentMenus[host];
      }

      /**
       * 增加下载目录
       * @param paths
       * @param client
       */
      function pushPath(paths, client) {
        paths.forEach(path => {
          results.push({
            client: client,
            path: path,
            host: host
          });
        });
      }

      PTService.options.clients.forEach(client => {
        clients.push({
          client: client,
          path: "",
          host: host
        });

        if (client.paths) {
          // 根据已定义的路径创建菜单
          for (const _host in client.paths) {
            let paths = client.paths[host];

            if (_host !== host) {
              continue;
            }

            pushPath(paths, client);
          }

          // 最后添加当前客户端适用于所有站点的目录
          let publicPaths = client.paths[PTService.allSiteKey];
          if (publicPaths) {
            if (results.length > 0) {
              results.push({});
            }

            pushPath(publicPaths, client);
          }
        }
      });

      if (results.length > 0) {
        clients.splice(0, 0, {});
      }

      results = results.concat(clients);

      this.siteContentMenus[host] = results;

      return results;
    }

    /**
     * 显示指定链接的下载服务器及目录菜单
     * @param options
     * @param event
     */
    showContentMenusForUrl(options, event, success, error) {
      let items = this.getContentMenusForUrl(options.url);
      let menus = [];

      items.forEach(item => {
        if (item.client && item.client.name) {
          menus.push({
            title:
              this.t("buttons.menuDownloadTo", {
                server: `${item.client.name} -> ${item.client.address}`
              }) + //`下载到：${item.client.name} -> ${item.client.address}` +
              (item.path
                ? ` -> ${PTService.pathHandler.replacePathKey(
                    item.path,
                    PTService.site
                  )}`
                : ""),
            fn: () => {
              if (options.url) {
                // console.log(options, item);
                this.sendTorrentToClient({
                  clientId: item.client.id,
                  url: options.url,
                  title: options.title,
                  savePath: item.path,
                  autoStart: item.client.autoStart,
                  tagIMDb: item.client.tagIMDb,
                  link: options.link,
                  imdbId: options.imdbId
                })
                  .then(result => {
                    success();
                  })
                  .catch(result => {
                    error(result);
                  });
              }
            }
          });
        } else {
          menus.push({});
        }
      });

      console.log(items, menus);

      basicContext.show(menus, event);
      $(".basicContext").css({
        left: "-=20px",
        top: "+=10px"
      });
    }

    /**
     * 验证指定元素的大小信息
     * @param {*} doms
     */
    checkSize(doms) {
      if (!PTService.options.needConfirmWhenExceedSize) {
        return true;
      }
      // 获取所有种子的大小信息
      let size = this.getTotalSize(doms);

      let exceedSize = 0;
      switch (PTService.options.exceedSizeUnit) {
        //
        case PTService.sizeUnit.MiB:
          exceedSize = PTService.options.exceedSize * 1048576;
          break;

        case PTService.sizeUnit.GiB:
          exceedSize = PTService.options.exceedSize * 1073741824;
          break;

        case "T":
        case PTService.sizeUnit.TiB:
          exceedSize = PTService.options.exceedSize * 1099511627776;
          break;
      }

      return size >= exceedSize ? PTService.filters.formatSize(size) : true;
    }

    /**
     *
     * @param {*} source
     */
    getTotalSize(source) {
      let total = 0;

      $.each(source, (index, item) => {
        total += this.getSize($(item).text());
      });

      return total;
    }

    /**
     * @return {number}
     */
    getSize(size) {
      if (typeof size == "number") {
        return size;
      }
      let _size_raw_match = size.match(
        /^(\d*\.?\d+)(.*[^TGMK])?([TGMK](B|iB){0,1})$/i
      );
      if (_size_raw_match) {
        let _size_num = parseFloat(_size_raw_match[1]);
        let _size_type = _size_raw_match[3];
        switch (true) {
          case /Ti?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 40);
          case /Gi?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 30);
          case /Mi?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 20);
          case /Ki?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 10);
          default:
            return _size_num;
        }
      }
      return 0;
    }

    /**
     * 种子大小超限时确认
     */
    confirmSize(doms) {
      let size = this.checkSize(doms);

      if (size !== true) {
        let content = this.t("exceedSizeConfirm", {
          size,
          exceedSize: PTService.options.exceedSize,
          exceedSizeUnit: PTService.options.exceedSizeUnit
        });
        if (!confirm(content)) {
          return false;
        }
      }
      return true;
    }

    /**
     * 准备开始批量下载
     * @param {*} success
     * @param {*} error
     * @param {*} downloadOptions
     */
    startDownloadURLs(success, error, downloadOptions) {
      if (this.confirmWhenExceedSize) {
        if (!this.confirmWhenExceedSize()) {
          // "容量超限，已取消"
          error(this.t("exceedSizeCanceled"));
          return;
        }
      }

      if (!this.getDownloadURLs) {
        // "getDownloadURLs 方法未定义"
        error(this.t("getDownloadURLsisUndefined"));
        return;
      }

      let urls = this.getDownloadURLs();
      if (!urls.length || typeof urls == "string") {
        error(urls);
        return;
      }

      // 是否启用后台下载任务
      if (PTService.options.enableBackgroundDownload) {
        this.downloadURLsInBackground(
          urls,
          msg => {
            success({
              msg
            });
          },
          downloadOptions
        );
      } else {
        this.downloadURLs(
          urls,
          urls.length,
          msg => {
            success({
              msg
            });
          },
          downloadOptions
        );
      }
    }

    downloadURLsInBackground(urls, callback, downloadOptions) {
      const items = [];

      const savePath = downloadOptions
        ? PTService.pathHandler.getSavePath(
            downloadOptions.savePath || downloadOptions.path,
            PTService.site
          )
        : "";

      urls.forEach(url => {
        if (downloadOptions) {
          items.push({
            clientId: downloadOptions.client.id,
            url,
            savePath,
            autoStart: downloadOptions.client.autoStart,
            tagIMDb: downloadOptions.client.tagIMDb
          });
        } else {
          items.push({
            url
          });
        }
      });

      PTService.call(PTService.action.sendTorrentsInBackground, items)
        .then(result => {
          callback(result);
        })
        .catch(result => {
          callback(result);
        });
    }

    /**
     * 批量下载指定的URL
     * @param {*} urls
     * @param {*} count
     * @param {*} callback
     * @param {*} downloadOptions 下载选项，如不指定，则发送至默认下载服务器
     */
    downloadURLs(urls, count, callback, downloadOptions) {
      let index = count - urls.length;
      let url = urls.shift();
      if (!url) {
        $(this.statusBar).remove();
        this.statusBar = null;
        // count + "条链接已发送完成。"
        callback(
          this.t("downloadURLsFinished", {
            count
          })
        );
        return;
      }

      this.showStatusMessage(
        this.t("downloadURLsTip", {
          text:
            url.replace(PTService.site.passkey, "***") +
            "(" +
            (count - index) +
            "/" +
            count +
            ")"
        }),
        0
      );

      if (!downloadOptions) {
        this.sendTorrentToDefaultClient(url, false)
          .then(result => {
            this.downloadURLs(urls, count, callback);
          })
          .catch(result => {
            this.downloadURLs(urls, count, callback);
          });
      } else {
        this.sendTorrentToClient(
          {
            clientId: downloadOptions.client.id,
            url: url,
            title: "",
            savePath: downloadOptions.path,
            autoStart: downloadOptions.client.autoStart,
            tagIMDb: downloadOptions.client.tagIMDb,
            imdbId: downloadOptions.imdbId
          },
          false
        )
          .finally(() => {
            // 是否设置了时间间隔
            if (PTService.options.batchDownloadInterval > 0) {
              setTimeout(() => {
                this.downloadURLs(urls, count, callback, downloadOptions);
              }, PTService.options.batchDownloadInterval * 1000);
            } else {
              this.downloadURLs(urls, count, callback, downloadOptions);
            }
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

    showStatusMessage(msg) {
      if (!this.statusBar) {
        this.statusBar = PTService.showNotice({
          text: msg,
          type: "info",
          width: 600,
          progressBar: false
        });
      } else {
        this.statusBar.find(".noticejs-content").html(msg);
      }
    }

    /**
     * 用JSON对象模拟对象克隆
     * @param source
     */
    clone(source) {
      return JSON.parse(JSON.stringify(source));
    }

    /**
     * 显示批量下载时可用下载服务器菜单
     * @param event
     */
    showAllContentMenus(event, success, error) {
      let clients = [];
      let menus = [];
      let _this = this;

      function addMenu(item) {
        let title = _this.t("buttons.menuDownloadTo", {
          server: `${item.client.name} -> ${item.client.address}`
        }); //`下载到：${item.client.name} -> ${item.client.address}`;
        if (item.path) {
          title += ` -> ${PTService.pathHandler.replacePathKey(
            item.path,
            PTService.site
          )}`;
        }
        menus.push({
          title: title,
          fn: () => {
            // 克隆是为了多次选择时，不覆盖原来的值
            let _item = PPF.clone(item);
            console.log(item);
            let savePath = PTService.pathHandler.getSavePath(
              _item.path,
              PTService.site
            );
            if (savePath === false) {
              // "用户取消操作"
              error(_this.t("userCanceled"));
              return;
            }
            _item.path = savePath;
            _this.startDownloadURLs(success, error, _item);
          }
        });
      }

      if (this.clientContentMenus.length == 0) {
        PTService.options.clients.forEach(client => {
          clients.push({
            client: client,
            path: ""
          });
        });
        clients.forEach(item => {
          if (item.client && item.client.name) {
            addMenu(item);

            if (item.client.paths) {
              // 添加适用于所有站点的目录
              let publicPaths = item.client.paths[PTService.allSiteKey];
              if (publicPaths) {
                publicPaths.forEach(path => {
                  let _item = this.clone(item);
                  _item.path = path;
                  addMenu(_item);
                });
              }
            }
          } else {
            menus.push({});
          }
        });
        this.clientContentMenus = menus;
      } else {
        menus = this.clientContentMenus;
      }

      basicContext.show(menus, event);
      $(".basicContext").css({
        left: "-=20px",
        top: "+=10px"
      });
    }

    /**
     * 获取完整的URL地址
     * @param {string} url
     */
    getFullURL(url) {
      if (!url) {
        return "";
      }
      if (url.substr(0, 2) === "//") {
        url = `${location.protocol}${url}`;
      } else if (url.substr(0, 1) === "/") {
        url = `${location.origin}${url}`;
      } else if (url.substr(0, 4) !== "http") {
        url = `${location.origin}/${url}`;
      }
      return url;
    }

    /**
     * 初始化说谢谢按钮
     */
    initSayThanksButton() {
      let sayThanksButton = PTService.getFieldValue("sayThanksButton");
      console.log("sayThanksButton");
      if (sayThanksButton && sayThanksButton.length) {
        // 说谢谢
        PTService.addButton({
          title: this.t("buttons.sayThanksTip"),
          icon: "thumb_up",
          label: this.t("buttons.sayThanks"),
          key: "sayThanks",
          click: (success, error) => {
            sayThanksButton.click();
            success();
            setTimeout(() => {
              PTService.removeButton("sayThanks");
            }, 1000);
          }
        });
      }
    }
  }

  window.NexusPHPCommon = Common;
})(jQuery, window);
