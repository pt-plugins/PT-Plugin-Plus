import Vue from "vue";
import Extension from "@/service/extension";
import { Route } from "vue-router";
import {
  EAction,
  Site,
  SiteSchema,
  Dictionary,
  EDownloadClientType,
  DataResult,
  EPaginationKey,
  EModule,
  LogItem,
  SearchResultItem,
  SearchResultItemTag
} from "@/interface/common";
import { filters } from "@/service/filters";
import moment from "moment";
import { Downloader, downloadFile } from "@/service/downloader";

type searchResult = {
  sites: Dictionary<any>;
  tags: Dictionary<any>;
};

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "搜索结果",
        download: "下载",
        sendToClient: "发送到下载服务器",
        save: "下载种子文件到本地",
        searching: "正在搜索中，请稍候……",
        cancelSearch: "取消搜索",
        showCheckbox: "开启多选模式",
        noTag: "无标签",
        allSites: "全部站点",
        multiDownloadConfirm:
          "当前下载的种子数量超过一个，浏览器可能会多次提示保存，是否继续？"
      },
      key: "",
      // 指定站点搜索
      host: "",
      options: this.$store.state.options,
      getters: this.$store.getters,
      searchMsg: "",
      datas: [] as any,
      selected: [],
      pagination: {
        rowsPerPage: 100
      },
      loading: false,
      headers: [
        { text: "站点", align: "center", value: "site.host" },
        { text: "标题", align: "left", value: "title" },
        { text: "大小", align: "right", value: "size" },
        // { text: "评论", align: "center", value: "comments" },
        { text: "上传", align: "center", value: "seeders" },
        { text: "下载", align: "center", value: "leechers" },
        { text: "完成", align: "center", value: "completed" },
        // { text: "发布者", align: "left", value: "author" },
        { text: "发布时间", align: "left", value: "time" },
        { text: "操作", sortable: false }
      ],
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      currentSite: {} as Site,
      skipSites: "",
      beginTime: null as any,
      reloadCount: 0,
      searchQueue: [] as any[],
      searchTimer: 0,
      // 搜索结果
      searchResult: {
        sites: {},
        tags: {}
      } as searchResult,
      checkBox: false,
      // 正在下载的种子文件进度信息
      downloading: {
        count: 0,
        completed: 0,
        speed: 0,
        progress: 0
      },
      latestTorrentsKey: "__LatestTorrents__",
      latestTorrentsOnly: false,
      searchSiteCount: 0
    };
  },
  created() {
    if (!this.options.system) {
      this.writeLog({
        event: `SearchTorrent.init`,
        msg: "系统参数丢失"
      });
    }
    this.pagination = this.$store.getters.pagination(
      EPaginationKey.searchTorrent,
      {
        rowsPerPage: 100
      }
    );
  },
  beforeRouteUpdate(to: Route, from: Route, next: any) {
    if (!to.params.key) {
      return;
    }
    this.key = to.params.key;
    this.host = to.params.host;
    // this.$route.params
    next();
  },
  /**
   * 当前组件激活时触发
   * 因为启用了搜索结果缓存，所以需要在这里处理关键字
   */
  activated() {
    if (this.$route.params["key"]) {
      this.key = this.$route.params["key"];
    }

    this.host = this.$route.params["host"];
  },
  watch: {
    key() {
      this.doSearch();
    },
    host() {
      this.doSearch();
    },
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  methods: {
    /**
     * 记录日志
     * @param options
     */
    writeLog(options: LogItem) {
      extension.sendRequest(EAction.writeLog, null, {
        module: EModule.options,
        event: options.event,
        msg: options.msg,
        data: options.data
      });
    },
    /**
     * 延迟执行搜索
     */
    doSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.search();
      }, 100);
    },
    /**
     * 开始搜索
     */
    search() {
      this.selected = [];
      if (window.location.hostname == "localhost") {
        $.getJSON("http://localhost:8001/testSearchData.json").done(
          (result: any) => {
            if (result) {
              this.addSearchResult(result);
              // this.datas = result;
            }
            // console.log(result);
          }
        );
        return;
      }

      if (this.loading || !this.key) return;

      if (!this.options.system) {
        if (this.reloadCount >= 10) {
          this.errorMsg =
            "系统参数丢失，多次尝试等待后无效，请重新打开配置页再试";
          this.writeLog({
            event: `SearchTorrent.init`,
            msg: this.errorMsg
          });
          return;
        }
        setTimeout(() => {
          this.search();
        }, 200);
        this.reloadCount++;
        return;
      }
      this.haveError = false;
      this.haveSuccess = false;
      this.datas = [];
      if (!this.options.sites) {
        this.errorMsg = "请先设置站点";
        return;
      }

      let sites: Site[] = [];
      let skipSites: string[] = [];
      this.skipSites = "";

      if (this.key === this.latestTorrentsKey) {
        this.latestTorrentsOnly = true;
      } else {
        this.latestTorrentsOnly = false;
      }

      // 是否指定了站点
      if (this.host) {
        let site = this.options.sites.find((item: Site) => {
          return item.host === this.host;
        });
        if (site) {
          sites.push(site);
        }
      } else {
        this.options.sites.forEach((item: Site) => {
          if (item.allowSearch) {
            let siteSchema: SiteSchema = this.getSiteSchema(item);
            if (
              siteSchema &&
              siteSchema.searchEntry &&
              siteSchema.searchEntry.length > 0
            ) {
              sites.push(item);
            } else if (item.searchEntry && item.searchEntry.length > 0) {
              sites.push(item);
            } else {
              skipSites.push(item.name);
            }
          }
        });
      }

      if (skipSites.length > 0) {
        this.skipSites = " 暂不支持搜索的站点：" + skipSites.join(",");
      }

      if (sites.length === 0) {
        this.errorMsg =
          "您还没有配置允许搜索的站点，请先前往【站点设置】进行配置";
        return;
      }

      this.searchSiteCount = sites.length;
      this.beginTime = moment();
      this.writeLog({
        event: `SearchTorrent.Search.Start`,
        msg: `准备开始搜索，共需搜索 ${sites.length} 个站点`,
        data: {
          key: this.key
        }
      });
      this.searchResult = {
        sites: {},
        tags: {}
      } as searchResult;

      this.doSearchTorrentWithQueue(sites);
    },

    /**
     * 执行搜索队列
     */
    doSearchTorrentWithQueue(sites: Site[]) {
      this.loading = true;
      sites.forEach((site: Site, index: number) => {
        this.searchQueue.push({
          site,
          key: this.key
        });

        this.writeLog({
          event: `SearchTorrent.Search.Processing`,
          msg: "正在搜索 [" + site.name + "]",
          data: {
            host: site.host,
            name: site.name,
            key: this.key
          }
        });

        extension
          .sendRequest(EAction.getSearchResult, null, {
            key: this.latestTorrentsOnly ? "" : this.key,
            site: site
          })
          .then((result: any) => {
            if (result && result.length) {
              this.writeLog({
                event: `SearchTorrent.Search.Done[${site.name}]`,
                msg: `[${site.name}] 搜索完成，共有 ${result.length} 条结果`,
                data: {
                  host: site.host,
                  name: site.name,
                  key: this.key
                }
              });
              // this.datas.push(...result);
              this.addSearchResult(result);
            } else if (result && result.msg) {
              this.writeLog({
                event: `SearchTorrent.Search.Error`,
                msg: result.msg,
                data: {
                  host: site.host,
                  name: site.name,
                  key: this.key
                }
              });
              this.errorMsg = result.msg;
            } else {
              if (result && result.statusText === "abort") {
                this.errorMsg = `${site.host} 搜索请求已取消`;
              } else {
                this.errorMsg = `${site.host} 发生网络或其他错误`;
                this.writeLog({
                  event: `SearchTorrent.Search.Error`,
                  msg: this.errorMsg,
                  data: {
                    host: site.host,
                    name: site.name,
                    key: this.key,
                    result
                  }
                });
              }
            }
          })
          .catch((result: DataResult) => {
            if (result.msg) {
              this.errorMsg = result.msg;
            }
            this.writeLog({
              event: `SearchTorrent.Search.Error`,
              msg: result.msg,
              data: result
            });
          })
          .finally(() => {
            this.removeQueue(site);
          });
      });
    },

    /**
     * 取消一个搜索队列
     */
    abortSearch(site: Site) {
      extension
        .sendRequest(EAction.abortSearch, null, {
          key: this.key,
          site: site
        })
        .then(() => {
          this.writeLog({
            event: `SearchTorrent.Search.Abort`,
            msg: `${site.name} 搜索已取消`
          });
        })
        .catch(() => {
          this.writeLog({
            event: `SearchTorrent.Search.Abort.Error`,
            msg: `${site.name} 搜索取消失败`
          });
          this.removeQueue(site);
        });
    },

    /**
     * 移除搜索队列
     */
    removeQueue(site: Site) {
      let index = this.searchQueue.findIndex((item: any) => {
        return item.site.host === site.host;
      });
      if (index !== -1) {
        this.searchQueue.splice(index, 1);
        if (this.searchQueue.length == 0) {
          this.searchMsg = `搜索完成，共找到 ${
            this.datas.length
          } 条结果，耗时：${moment().diff(
            this.beginTime,
            "seconds",
            true
          )} 秒。`;
          this.loading = false;
          this.writeLog({
            event: `SearchTorrent.Search.Finished`,
            msg: this.searchMsg,
            data: {
              key: this.key
            }
          });
        }
      }
    },
    /**
     * 添加搜索结果，并组织字段格式
     */
    addSearchResult(result: any[]) {
      let allSites = this.words.allSites;

      if (!this.searchResult.sites[allSites]) {
        this.searchResult.sites[allSites] = [];
      }

      result.forEach((item: SearchResultItem) => {
        item.time = moment(item.time).valueOf();
        if (!item.titleHTML) {
          item.titleHTML = item.title;
        }
        item.title = $("<span/>")
          .html(item.titleHTML)
          .text()
          .trim();
        if (item.size) {
          item.size = this.fileSizetoLength(item.size as string);
        }

        if (item.seeders) {
          item.seeders = parseInt((item.seeders as string).replace(",", ""));
        }

        if (item.leechers) {
          item.leechers = parseInt((item.leechers as string).replace(",", ""));
        }

        if (item.completed) {
          item.completed = parseInt(
            (item.completed as string).replace(",", "")
          );
        }
        item.uid = this.getRandomString();
        this.datas.push(item);
        this.searchMsg = `已接收 ${this.datas.length} 条结果，搜索仍在进行……`;

        let siteName = item.site.name;
        if (!this.searchResult.sites[siteName]) {
          this.searchResult.sites[siteName] = [];
        }
        this.searchResult.sites[siteName].push(item);
        this.addTagResult(item);
      });

      this.searchResult.sites[allSites] = this.datas;
    },

    /**
     * 添加搜索结果标签
     * @param item
     */
    addTagResult(item: SearchResultItem) {
      let noTag = this.words.noTag;

      if (!this.searchResult.tags[noTag]) {
        this.searchResult.tags[noTag] = {
          tag: {
            name: noTag,
            color: "blue-grey darken-2"
          },
          items: []
        };
      }

      if (item.tags == undefined || !item.tags.length) {
        this.searchResult.tags[noTag].items.push(item);
        return;
      }

      item.tags.forEach((tag: SearchResultItemTag) => {
        let name = tag.name as string;
        if (!name) return;
        if (!this.searchResult.tags[name]) {
          this.searchResult.tags[name] = {
            tag,
            items: []
          };
        }
        this.searchResult.tags[name].items.push(item);
      });
    },
    /**
     * @return {number}
     */
    fileSizetoLength(size: string): number {
      let _size_raw_match = size.match(
        /^(\d*\.?\d+)(.*[^TGMK])?([TGMK](B|iB))$/i
      );
      if (_size_raw_match) {
        let _size_num = parseFloat(_size_raw_match[1]);
        let _size_type = _size_raw_match[3];
        switch (true) {
          case /Ti?B/i.test(_size_type):
            return _size_num * Math.pow(2, 40);
          case /Gi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 30);
          case /Mi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 20);
          case /Ki?B/i.test(_size_type):
            return _size_num * Math.pow(2, 10);
          default:
            return _size_num;
        }
      }
      return 0;
    },

    /**
     * 根据指定的站点获取站点的架构信息
     * @param site 站点信息
     */
    getSiteSchema(site: Site): SiteSchema {
      let schema: SiteSchema = {};
      if (typeof site.schema === "string") {
        schema = this.options.system.schemas.find((item: SiteSchema) => {
          return item.name == site.schema;
        });
      }

      return schema;
    },
    /**
     * 发送下载链接到服务器
     * @param url
     * @param title
     */
    sendToClient(url: string, title: string) {
      console.log(url);
      let host = filters.parseURL(url).host;
      let site = this.options.sites.find((site: Site) => {
        return site.host === host;
      });
      let defaultClientOptions = this.getters.clientOptions(site);
      let defaultPath = this.getters.siteDefaultPath(site);

      this.haveSuccess = true;
      this.successMsg = "正在发送种子到下载服务器……";

      let data = {
        url,
        title,
        savePath: defaultPath,
        autoStart: defaultClientOptions.autoStart
      };
      this.writeLog({
        event: "SearchTorrent.sendTorrentToDefaultClient",
        msg: "发送种子到下载服务器",
        data
      });
      extension
        .sendRequest(EAction.sendTorrentToDefaultClient, null, data)
        .then((result: any) => {
          console.log("命令执行完成", result);

          if (result.type == "success") {
            this.successMsg = result.msg;
            this.writeLog({
              event: "SearchTorrent.sendTorrentToDefaultClient.Success",
              msg: "发送种子到下载服务器成功",
              data: result
            });
          } else {
            this.errorMsg = result.msg;
            this.writeLog({
              event: "SearchTorrent.sendTorrentToDefaultClient.Error",
              msg: "发送种子到下载服务器失败",
              data: result
            });
          }
        })
        .catch((result: any) => {
          this.writeLog({
            event: "SearchTorrent.sendTorrentToDefaultClient.Error",
            msg: "发送种子到下载服务器失败",
            data: result
          });
        });
    },
    /**
     * 更新分页信息
     * @param value
     */
    updatePagination(value: any) {
      console.log(value);
      this.$store.dispatch("updatePagination", {
        key: EPaginationKey.searchTorrent,
        options: value
      });
    },
    /**
     * 获取随机字符串
     * @param  {number} length    [长度，默认为16]
     * @param  {boolean} noSimilar [是否包含容易混淆的字符，默认为包含]
     * @return {string}           [返回的内容]
     */
    getRandomString(length: number = 16, noSimilar: boolean = true): string {
      // 是否包含容易混淆的字符[oO,Ll,9gq,Vv,Uu,I1]，默认为包含
      let chars = noSimilar
        ? "abcdefhijkmnprstwxyz2345678ABCDEFGHJKMNPQRSTWXYZ"
        : "abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKMNOPQRSTUVWXYZ";
      let maxLength = chars.length;
      let result = [];
      for (let i = 0; i < length; i++) {
        result.push(chars.charAt(Math.floor(Math.random() * maxLength)));
      }

      return result.join("");
    },
    /**
     * 重设当前列表数据
     * @param datas
     */
    resetDatas(datas: any) {
      this.datas = datas;
      this.selected = [];
    },
    /**
     * 下载已选中的种子文件
     */
    downloadSelected() {
      let files: downloadFile[] = [];
      this.selected.forEach((item: SearchResultItem) => {
        item.url &&
          files.push({
            url: item.url,
            fileName: `[${item.site.name}][${item.title}].torrent`
          });
      });
      console.log(files);
      if (files.length) {
        if (files.length > 1) {
          if (!confirm(this.words.multiDownloadConfirm)) {
            return;
          }
        }
        this.downloading.count = files.length;
        this.downloading.completed = 0;
        this.downloading.speed = 0;
        this.downloading.progress = 0;
        new Downloader({
          files: files,
          autoStart: true,
          onCompleted: () => {
            this.downloading.completed++;
            this.downloading.progress =
              (this.downloading.completed / this.downloading.count) * 100;

            // 是否已完成
            if (this.downloading.completed >= this.downloading.count) {
              this.downloading.count = 0;
              this.selected = [];
            }
          }
        });
      }
    }
  }
});
