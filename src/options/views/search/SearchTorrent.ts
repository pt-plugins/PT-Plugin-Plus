import Vue from "vue";
import Extension from "@/service/extension";
import { Route } from "vue-router";
import {
  EAction,
  Site,
  SiteSchema,
  Dictionary,
  DataResult,
  EPaginationKey,
  EModule,
  LogItem,
  SearchResultItem,
  SearchResultItemTag,
  SearchSolution,
  Options,
  SearchSolutionRange,
  SearchEntry,
  DownloadClient,
  DownloadOptions,
  ECommonKey,
  ERequestMethod,
  ISearchPayload,
  EResourceOrderMode,
  ICollectionGroup,
  EViewKey,
  EDataResultType
} from "@/interface/common";
import { filters } from "@/service/filters";
import dayjs from "dayjs";
import { Downloader, downloadFile, FileDownloader } from "@/service/downloader";
import * as basicContext from "basiccontext";
import { PathHandler } from "@/service/pathHandler";
import MovieInfoCard from "@/options/components/MovieInfoCard.vue";
import TorrentProgress from "@/options/components/TorrentProgress.vue";
import AddToCollectionGroup from "./AddToCollectionGroup.vue";
import Actions from "./Actions.vue";
import { PPF } from "@/service/public";
import KeepUpload from "./KeepUpload.vue";

type searchResult = {
  sites: Dictionary<any>;
  tags: Dictionary<any>;
  categories: Dictionary<any>;
  failedSites: any[];
  noResultsSites: any[];
};

const extension = new Extension();

export default Vue.extend({
  components: {
    MovieInfoCard,
    TorrentProgress,
    Actions,
    AddToCollectionGroup,
    KeepUpload
  },
  data() {
    return {
      allSitesKey: "allSites",
      key: "",
      // 指定站点搜索
      host: "",
      options: this.$store.state.options as Options,
      getters: this.$store.getters,
      searchMsg: "",
      datas: [] as any,
      getLinks: [] as any,
      selected: [] as any,
      pagination: {
        page: 1,
        rowsPerPage: 100,
        descending: false,
        sortBy: ""
      },
      loading: false,
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
        tags: {},
        categories: {},
        failedSites: [],
        noResultsSites: []
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
      searchSiteCount: 0,
      sending: {
        count: 0,
        completed: 0,
        speed: 0,
        progress: 0
      },
      showCategory: false,
      fixedTable: false,
      siteContentMenus: {} as any,
      clientContentMenus: [] as any,
      filterKey: "",
      // 已过滤的数据
      filteredDatas: [] as any,
      showFailedSites: false,
      showNoResultsSites: false,
      pathHandler: new PathHandler(),
      IMDbId: "",
      // 下载失败的种子列表
      downloadFailedTorrents: [] as FileDownloader[],
      // 最后操作的checkbox索引
      lastCheckedIndex: -1,
      shiftKey: false,
      searchPayload: {} as ISearchPayload,
      torrentCollectionLinks: [] as string[],
      headerOrderClickCount: 0,

      currentOrderMode: EResourceOrderMode.asc,
      rawDatas: [] as any[],
      toolbarClass: "mt-3",
      toolbarIsFixed: false
    };
  },
  created() {
    if (!this.options.system) {
      this.writeLog({
        event: `SearchTorrent.init`,
        msg: this.$t("searchTorrent.optionsIsMissing").toString()
      });
    }
    this.pagination = this.$store.getters.pagination(
      EPaginationKey.searchTorrent,
      {
        rowsPerPage: 100
      }
    );

    let viewOptions = this.$store.getters.viewsOptions(EViewKey.searchTorrent, {
      checkBox: false,
      showCategory: false
    });
    Object.assign(this, viewOptions);

    this.loadTorrentCollections();
  },
  mounted() {
    // 初始化鼠标点击事件，用于按shift键多选操作
    const downEvent = "mousedown.torrentSearch";
    const upEvent = "mouseUp.torrentSearch";
    $(".search-torrent").off(downEvent);
    $(".search-torrent").off(upEvent);
    $(".search-torrent").on(downEvent, (e) => {
      this.shiftKey = e.shiftKey || false;
    });

    $(".search-torrent").on(upEvent, (e) => {
      this.shiftKey = false;
    });
    window.addEventListener("scroll", this.handleScroll);

    // 生成辅种任务后清除选择
    this.$root.$on("KeepUploadTaskCreateSuccess",() => {
      this.toggleAll();
    });
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
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
    this.loadTorrentCollections();
    this.handleScroll();
  },
  watch: {
    key(newValue, oldValue) {
      if (newValue && newValue != oldValue) {
        this.doSearch();
      }
    },
    host(newValue, oldValue) {
      if (newValue && newValue != oldValue) {
        this.doSearch();
      }
    },
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    },
    "$store.state.options.defaultSearchSolutionId"(newValue, oldValue) {
      // 设置为<默认>时，newValue 为空，故与 key, host 处理方式不同
      if (newValue != oldValue) {
        this.doSearch();
      }
    },
    loading() {
      this.$store.commit("updateSearchStatus", this.loading);
    },
    pagination: {
      handler() {
        if (this.pagination.descending) {
          this.currentOrderMode = EResourceOrderMode.desc;
        } else {
          this.currentOrderMode = EResourceOrderMode.asc;
        }
        this.updatePagination(this.pagination);
      },
      deep: true
    },
    currentOrderMode() {
      this.pagination.descending =
        this.currentOrderMode === EResourceOrderMode.desc;
    },
    checkBox() {
      if (this.checkBox === false) {
        this.selected = [];
      }
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
    doSearch(searchPayload?: ISearchPayload) {
      clearTimeout(this.searchTimer);
      let _searchPayload: ISearchPayload;
      if (searchPayload) {
        _searchPayload = this.clone(searchPayload);
      }
      this.searchTimer = window.setTimeout(() => {
        this.search(_searchPayload);
      }, 220);
    },
    reset() {
      this.selected = [];
      this.clearMessage();
      this.datas = [];
      this.rawDatas = [];
      this.getLinks = [];
      this.searchResult = {
        sites: {},
        tags: {},
        categories: {},
        failedSites: [],
        noResultsSites: []
      } as searchResult;
      this.filterKey = "";
      this.searchPayload = {};
    },
    /**
     * 开始搜索
     */
    search(searchPayload?: ISearchPayload) {
      if (this.loading || !this.key) return;

      this.reset();
      if (window.location.protocol === "http:") {
        $.getJSON(
          `http://${window.location.hostname}:8001/test/searchData.json`
        ).done((result: any) => {
          if (result) {
            this.addSearchResult(result);
            // this.datas = result;
          }
          // console.log(result);
        });
        return;
      }

      if (!this.options.system) {
        if (this.reloadCount >= 10) {
          this.errorMsg = this.$t(
            "searchTorrent.optionsIsMissingErrorMsg"
          ).toString();
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

      if (!this.options.sites) {
        this.errorMsg = this.$t("searchTorrent.sitesIsMissing").toString();
        return;
      }

      // 显示搜索快照
      if (/(show-snapshot)-([a-z0-9]{32})/.test(this.key)) {
        let match = this.key.match(/(show-snapshot)-([a-z0-9]{32})/);
        if (match) {
          this.loadSearchResultSnapshot(match[2]);
          return;
        }
      }

      if (searchPayload) {
        this.searchPayload = searchPayload;
      }

      let searchKeys = {
        id: "",
        cn: "",
        en: "",
        key: this.key
      };

      // 当搜索关键字包含|时表示指定了多个内容，格式如下
      // doubanid|中文名|英文名|原始搜索关键字
      // imdbid|中文名|英文名|原始搜索关键字
      if (this.key.indexOf("|") !== -1) {
        let tmp = (this.key + "||").split("|");
        searchKeys.id = tmp[0];
        searchKeys.cn = tmp[1];
        searchKeys.en = tmp[2];
        searchKeys.key = tmp[3];

        if (/(douban\d+)/.test(searchKeys.id)) {
          this.searchPayload.doubanId = (searchKeys.id as any).match(
            /douban(\d+)/
          )[1];
        } else {
          this.searchPayload.imdbId = searchKeys.id;
        }

        this.searchPayload.cn = searchKeys.cn;
        this.searchPayload.en = searchKeys.en;
        this.searchPayload.key = searchKeys.key;
      }

      // 豆瓣ID
      if (/(douban\d+)/.test(this.key)) {
        this.searchPayload.doubanId = (this.key as any).match(
          /douban(\d+)/
        )[1];
        this.getIMDbIdFromDouban(this.key)
          .then((result) => {
            if (typeof result == "string") {
              this.searchPayload.imdbId = result;
              this.key = result;
              this.search(this.searchPayload);
            } else {
              if (searchKeys.cn) {
                this.key = searchKeys.cn;
                this.search(this.searchPayload);
              } else {
                this.errorMsg = this.$t(
                  "searchTorrent.doubanIdConversionFailed"
                ).toString();
                this.searchMsg = this.errorMsg;
                this.loading = false;
              }
            }
          })
          .catch((error) => {
            if (searchKeys.cn) {
              this.key = searchKeys.cn;
              this.search(this.searchPayload);
            } else {
              this.errorMsg =
                error ||
                this.$t("searchTorrent.doubanIdConversionFailed").toString();
              this.searchMsg = this.errorMsg;
              this.loading = false;
            }
          });
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

      this.options = this.$store.state.options;
      let searchSolutionId = this.options.defaultSearchSolutionId;

      // 指定搜索方案id
      if (/^[a-z0-9]{32}$/.test(this.host)) {
        searchSolutionId = this.host;
        this.host = "";
      } else if (this.host === "all") {
        searchSolutionId = "all";
        this.host = "";
      }

      // 是否指定了站点
      if (this.host) {
        let site = this.options.sites.find((item: Site) => {
          return item.host === this.host && !item.offline;
        });
        if (site) {
          sites.push(this.clone(site));
        }
      } else if (
        // 指定了搜索方案
        searchSolutionId &&
        this.options.searchSolutions &&
        searchSolutionId != "all"
      ) {
        let _sites: Site[] = [];
        this.options.sites.forEach((item: Site) => {
          if (item.offline) return false;
          _sites.push(this.clone(item));
        });

        let searchSolution:
          | SearchSolution
          | undefined = this.options.searchSolutions.find(
            (solution: SearchSolution) => {
              return solution.id === searchSolutionId;
            }
          );

        if (searchSolution) {
          searchSolution.range.forEach((range: SearchSolutionRange) => {
            let index = _sites.findIndex((item: any) => {
              return item.host === range.host;
            });

            if (index > -1) {
              let site: any = _sites[index];
              let siteEntry: SearchEntry[] = site.searchEntry;
              if (siteEntry) {
                siteEntry.forEach((v, index) => {
                  siteEntry[index].enabled = false;
                });
                range.entry &&
                  range.entry.forEach((key: string) => {
                    let index: number = siteEntry.findIndex(
                      (entry: SearchEntry) => {
                        return entry.id == key || entry.name == key;
                      }
                    );
                    if (siteEntry[index] && siteEntry[index].name) {
                      siteEntry[index].enabled = true;
                    }
                  });
              }

              sites.push(site);
            }
          });
        }
      } else {
        this.options.sites.forEach((item: Site) => {
          if (item.offline) return false;

          if (item.allowSearch || searchSolutionId == "all") {
            let siteSchema: SiteSchema = this.getSiteSchema(item);
            if (
              siteSchema &&
              siteSchema.searchEntry &&
              siteSchema.searchEntry.length > 0
            ) {
              sites.push(this.clone(item));
            } else if (item.searchEntry && item.searchEntry.length > 0) {
              sites.push(this.clone(item));
            } else {
              skipSites.push(item.name);
            }
          }
        });
      }

      if (skipSites.length > 0) {
        this.skipSites =
          this.$t("searchTorrent.skipSites").toString() + skipSites.join(",");
      }

      if (sites.length === 0) {
        this.errorMsg = this.$t("searchTorrent.noAllowSearchSites").toString();
        return;
      }

      this.searchSiteCount = sites.length;
      this.beginTime = dayjs();
      this.writeLog({
        event: `SearchTorrent.Search.Start`,
        msg: this.$t("searchTorrent.searchStartMsg", {
          count: sites.length
        }).toString(),
        data: {
          key: this.key
        }
      });

      // 保存搜索关键字
      this.$store.dispatch("saveConfig", {
        lastSearchKey: this.searchPayload.key || this.key
      });

      this.pagination.page = 1;
      if (/(tt\d+)/.test(this.key)) {
        // 提取 IMDb 编号，如果带整个网址，则只取编号部分
        let imdb = this.key.match(/(tt\d+)/);
        if (imdb && imdb.length >= 2) {
          this.key = imdb[1];
        }
        this.IMDbId = this.key;
      } else {
        this.IMDbId = "";
      }
      this.doSearchTorrentWithQueue(sites);
    },

    /**
     * 执行搜索队列
     */
    doSearchTorrentWithQueue(sites: Site[]) {
      this.loading = true;
      this.searchMsg = this.$t("searchTorrent.searching").toString();
      sites.forEach((site: Site, index: number) => {
        // 站点是否跳过IMDbId搜索
        if (
          this.IMDbId &&
          site.searchEntryConfig &&
          site.searchEntryConfig.skipIMDbId
        ) {
          return;
        }
        this.searchQueue.push({
          site,
          key: this.key
        });

        this.writeLog({
          event: `SearchTorrent.Search.Processing`,
          msg: this.$t("searchTorrent.siteIsSearching", {
            siteName: site.name
          }).toString(),
          data: {
            host: site.host,
            name: site.name,
            key: this.key
          }
        });

        this.sendSearchRequest(PPF.clone(site));
      });
    },

    /**
     * 发送搜索请求
     * @param site
     */
    sendSearchRequest(site: Site) {
      extension
        .sendRequest(EAction.getSearchResult, null, {
          key: this.latestTorrentsOnly ? "" : this.key,
          site: site,
          payload: this.searchPayload
        })
        .then((result: any) => {
          if (result && result.length) {
            this.writeLog({
              event: `SearchTorrent.Search.Done[${site.name}]`,
              msg: this.$t("searchTorrent.siteIsSearchDone", {
                siteName: site.name,
                count: result.length
              }).toString(),
              data: {
                host: site.host,
                name: site.name,
                key: this.key
              }
            });
            this.addSearchResult(result);
            return;
          } else if (result && result.msg) {
            this.writeLog({
              event: `SearchTorrent.Search.Error1`,
              msg: result.msg,
              data: {
                host: site.host,
                name: site.name,
                key: this.key
              }
            });
            this.errorMsg = result.msg;
          } else {
            if (result && result.statusText == "abort") {
              this.errorMsg = this.$t("searchTorrent.siteSearchAbort", {
                host: site.host
              }).toString();
            } else {
              if (result && result.statusText == "timeout") {
                this.errorMsg = this.$t("searchTorrent.siteSearchTimeout", {
                  host: site.host
                }).toString();
              } else {
                this.errorMsg = this.$t("searchTorrent.siteSearchError", {
                  host: site.host
                }).toString();
              }

              this.writeLog({
                event: `SearchTorrent.Search.Error2`,
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
          this.searchResult.failedSites.push({
            site: site,
            msg: this.errorMsg,
            color: "orange darken-1"
          });
        })
        .catch((result: DataResult) => {
          console.log(result);
          if (result.msg) {
            this.errorMsg = result.msg;
          }
          this.writeLog({
            event: `SearchTorrent.Search.Error3`,
            msg: result.msg,
            data: result
          });

          if (result.data && result.data.isLogged == false) {
            this.searchResult.failedSites.push({
              site: site,
              url: site.url,
              msg: this.$t("searchTorrent.notLogged").toString(),
              color: "grey"
            });
          } else {
            if (result.type === EDataResultType.error) {
              this.searchResult.failedSites.push({
                site: site,
                url: site.url,
                msg: result.msg || result.data || result,
                color: "grey"
              });
            } else {
              this.searchResult.noResultsSites.push({
                site: site,
                msg: result.msg || result.data || result,
                color: "light-blue darken-2"
              });
            }
          }
        })
        .finally(() => {
          this.removeQueue(site);
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
            msg: this.$t("searchTorrent.siteSearchAbort", {
              host: site.name
            }).toString()
          });
        })
        .catch(() => {
          this.writeLog({
            event: `SearchTorrent.Search.Abort.Error`,
            msg: this.$t("searchTorrent.siteSearchAbortError", {
              host: site.name
            }).toString()
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
          this.searchMsg = this.$t("searchTorrent.searchFinished", {
            count: this.datas.length,
            second: dayjs().diff(this.beginTime, "second", true)
          }).toString();
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
     * 创建搜索结果快照
     */
    createSearchResultSnapshot() {
      extension
        .sendRequest(EAction.createSearchResultSnapshot, null, {
          key: this.key,
          searchPayload: this.searchPayload,
          result: this.rawDatas
        })
        .then((result) => {
          this.successMsg = this.$t(
            "searchResultSnapshot.createSuccess"
          ).toString();
          console.log("createSearchResultSnapshot", result);
        })
        .catch(() => {
          this.errorMsg = this.$t(
            "searchResultSnapshot.createError"
          ).toString();
        });
    },
    /**
     * 加载搜索结果快照
     * @param id 快照ID
     */
    loadSearchResultSnapshot(id: string) {
      this.loading = true;
      extension
        .sendRequest(EAction.getSearchResultSnapshot, null, id)
        .then((data) => {
          console.log("loadSearchResultSnapshot", data);
          this.key = data.key;
          this.searchPayload = data.searchPayload;
          if (this.searchPayload && this.searchPayload.imdbId) {
            this.IMDbId = this.searchPayload.imdbId;
          } else if (/^(tt\d+)$/.test(this.key)) {
            this.IMDbId = this.key;
          } else {
            this.IMDbId = "";
          }
          this.addSearchResult(PPF.clone(data.result));
          this.searchMsg = this.$t("searchResultSnapshot.snapshotTime", {
            time: dayjs(data.time).format("YYYY-MM-DD hh:mm:ss")
          }).toString();
          setTimeout(() => {
            this.loading = false;
          }, 300);
        });
    },
    /**
     * 添加搜索结果，并组织字段格式
     */
    addSearchResult(result: any[]) {
      let allSites = this.allSitesKey;

      if (!this.searchResult.sites[allSites]) {
        this.searchResult.sites[allSites] = [];
      }

      result.forEach((item: SearchResultItem) => {
        let _item = PPF.clone(item);
        if (_item.site) {
          _item.host = _item.site.host;
          delete _item.site;
        }
        this.rawDatas.push(_item);

        // 将 // 替换为 /
        item.link = (item.link as string)
          .replace("://", "****")
          .replace(/\/\//g, "/")
          .replace("****", "://");

        // 忽略重复的搜索结果
        if (this.getLinks.includes(item.link)) {
          // 跳过本次循环进行下一个元素
          return;
        }

        if (!item.site) {
          let host = item.host || "";
          item.site = PPF.getSiteFromHost(host, this.options);
          if (!item.site) {
            return;
          }
        }

        if (!item.progress && !item.status) {
          // 对比用户信息的seedingList修改做种状态信息
          if (item.site && item.site.user && item.site.user.seedingList) {
            let seedingList = item.site.user.seedingList;
            let seeding = seedingList.some(id => item.id && item.id == id);
            if (seeding) {
              item.progress = 100;
              item.status = 2;
            }
          }
        }

        if (dayjs(item.time).isValid()) {
          let val: number | string = item.time + "";
          // 标准时间戳需要 * 1000
          if (/^(\d){10}$/.test(val + "")) {
            item.time = parseInt(val) * 1000;
          } else {
            // 转成整数是为了排序
            item.time = dayjs(val).valueOf();
          }

          // 尝试转换本地时间
          item.time = PPF.transformTime(item.time, item.site.timezoneOffset);
        } else if (typeof item.time == "string") {
          let time = filters.timeAgoToNumber(item.time);
          if (time > 0) {
            item.time = time;
          }
        }

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

        if (item.seeders && typeof item.seeders == "string") {
          item.seeders = parseInt((item.seeders as string).replace(",", ""));
          if (isNaN(item.seeders)) {
            item.seeders = 0;
          }
        }

        if (item.leechers && typeof item.leechers == "string") {
          item.leechers = parseInt((item.leechers as string).replace(",", ""));
          if (isNaN(item.leechers)) {
            item.leechers = 0;
          }
        }

        if (item.completed && typeof item.completed == "string") {
          item.completed = parseInt(
            (item.completed as string).replace(",", "")
          );
          if (isNaN(item.completed)) {
            item.completed = 0;
          }
        }

        if (item.url) {
          item.url = item.url
            .replace("://", "****")
            .replace(/\/\//g, "/")
            .replace("****", "://");
        }

        this.datas.push(item);
        this.getLinks.push(item.link);

        this.searchMsg = this.$t("searchTorrent.searchProgress", {
          count: this.datas.length
        }).toString();

        let siteName = item.site.name;
        if (!this.searchResult.sites[siteName]) {
          this.searchResult.sites[siteName] = [];
        }
        this.searchResult.sites[siteName].push(item);
        this.addTagResult(item);
        this.addCategoryResult(item);
      });

      this.searchResult.sites[allSites] = this.datas;
    },

    /**
     * 添加搜索结果标签
     * @param item
     */
    addTagResult(item: SearchResultItem) {
      let noTag = this.$t("searchTorrent.noTag").toString();

      if (!this.searchResult.tags[noTag]) {
        this.searchResult.tags[noTag] = {
          tag: {
            name: noTag,
            color: "blue-grey darken-2"
          },
          items: []
        };
      }

      if (item.tags == undefined || item.tags == null || !item.tags.length) {
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
     * 添加搜索结果分类
     * @param item
     */
    addCategoryResult(item: SearchResultItem) {
      if (!item.category) {
        return;
      }

      let name = "";
      if (typeof item.category == "string") {
        name = item.category;
        item.category = {
          name: name
        };
      } else {
        name = item.category.name as string;
      }

      if (!name) return;

      if (!this.searchResult.categories[name]) {
        this.searchResult.categories[name] = {
          name,
          items: []
        };
      }
      this.searchResult.categories[name].items.push(item);
    },
    /**
     * @return {number}
     */
    fileSizetoLength(size: string | number): number {
      if (typeof size == "number") {
        return size;
      }
      let _size_raw_match = size
        .replace(/,/g, "")
        .trim()
        .match(/^(\d*\.?\d+)(.*[^ZEPTGMK])?([ZEPTGMK](B|iB))$/i);
      if (_size_raw_match) {
        let _size_num = parseFloat(_size_raw_match[1]);
        let _size_type = _size_raw_match[3];
        switch (true) {
          case /Zi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 70);
          case /Ei?B/i.test(_size_type):
            return _size_num * Math.pow(2, 60);
          case /Pi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 50);
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
        schema =
          this.options.system &&
          this.options.system.schemas &&
          this.options.system.schemas.find((item: SiteSchema) => {
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
    sendToClient(
      url: string,
      title?: string,
      options?: any,
      callback?: any,
      link: string = "",
      imdbId?: string
    ) {
      console.log(url);
      this.clearMessage();
      let host = filters.parseURL(url).host;
      let site = this.options.sites.find((site: Site) => {
        // 当定义了CDN列表时，匹配其中之一即可
        if (site.cdn) {
          let index = site.cdn.findIndex((cdn) => {
            return cdn.indexOf(host) > -1;
          });
          if (index > -1) {
            return true;
          }
        }
        return site.host === host;
      });
      let defaultClientOptions: any = {};
      let defaultPath: string = "";

      if (options) {
        defaultClientOptions = options.client;
        defaultPath = options.path;
      } else {
        defaultClientOptions = this.getters.clientOptions(site);
        defaultPath = this.getters.siteDefaultPath(site);
      }

      let savePath = this.pathHandler.getSavePath(defaultPath, site);
      // 取消
      if (savePath === false) {
        this.errorMsg = this.$t("searchTorrent.userCanceled").toString();
        return;
      }

      this.haveSuccess = true;
      this.successMsg = this.$t("searchTorrent.seedingTorrent").toString();

      let data: DownloadOptions = {
        url,
        title,
        savePath: savePath,
        autoStart: defaultClientOptions.autoStart,
        tagIMDb: defaultClientOptions.tagIMDb,
        clientId: defaultClientOptions.id,
        link,
        imdbId
      };
      this.writeLog({
        event: "SearchTorrent.sendTorrentToClient",
        msg: this.$t("searchTorrent.sendTorrentToClient").toString(),
        data
      });
      extension
        .sendRequest(EAction.sendTorrentToClient, null, data)
        .then((result: any) => {
          console.log("命令执行完成", result);

          if (result.type == "success") {
            this.successMsg = result.msg;
            this.writeLog({
              event: "SearchTorrent.sendTorrentToClient.Success",
              msg: this.$t(
                "searchTorrent.sendTorrentToClientSuccess"
              ).toString(),
              data: result
            });
          } else {
            this.errorMsg = result.msg;
            this.writeLog({
              event: "SearchTorrent.sendTorrentToClient.Error",
              msg: this.$t("searchTorrent.sendTorrentToClientError").toString(),
              data: result
            });
          }
          callback && callback();
        })
        .catch((result: any) => {
          this.writeLog({
            event: "SearchTorrent.sendTorrentToClient.Error",
            msg: this.$t("searchTorrent.sendTorrentToClientError").toString(),
            data: result
          });
          this.errorMsg = result.msg;
          callback && callback();
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
      if (this.loading) return;
      if (datas.length) {
        this.pagination.page = 1;
        this.datas = datas;
        this.selected = [];
      }
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
            fileName: `[${item.site.name}][${item.title}].torrent`,
            method: item.site.downloadMethod,
            timeout: this.options.connectClientTimeout
          });
      });
      console.log(files);
      if (files.length) {
        if (files.length > 1) {
          if (
            !confirm(this.$t("searchTorrent.multiDownloadConfirm").toString())
          ) {
            return;
          }
        }

        this.downloadTorrentFiles(files);
      }
    },
    /**
     * 批量下载指定的种子文件
     * @param files 需要下载的文件列表
     */
    downloadTorrentFiles(files: downloadFile[]) {
      this.downloading.count = files.length;
      this.downloading.completed = 0;
      this.downloading.speed = 0;
      this.downloading.progress = 0;
      new Downloader({
        files: files,
        autoStart: true,
        tagIMDb: true,
        onCompleted: (file: FileDownloader) => {
          this.downloadTorrentFilesCompleted(file);
        },
        onError: (file: FileDownloader, e: any) => {
          this.downloadTorrentFilesCompleted();
          this.writeLog({
            event: "SearchTorrent.downloadSelected.Error",
            msg: this.$t("searchTorrent.downloadSelectedError", {
              name: file.fileName
            }).toString(),
            data: e
          });
          let index = this.downloadFailedTorrents.findIndex(
            (item: FileDownloader) => {
              return item.url == file.url;
            }
          );
          if (index == -1) {
            this.downloadFailedTorrents.push(file);
          }
        }
      });
    },

    /**
     * 批量下载指定的种子文件完成
     * @param file
     */
    downloadTorrentFilesCompleted(file?: FileDownloader) {
      this.downloading.completed++;
      this.downloading.progress =
        (this.downloading.completed / this.downloading.count) * 100;

      // 是否已完成
      if (this.downloading.completed >= this.downloading.count) {
        this.downloading.count = 0;
        this.selected = [];
      }

      if (file) {
        // 从失败列表中删除已完成的种子
        for (
          let index = 0;
          index < this.downloadFailedTorrents.length;
          index++
        ) {
          const element = this.downloadFailedTorrents[index];
          if (element.url == file.url) {
            this.downloadFailedTorrents.splice(index, 1);
            break;
          }
        }
      }
    },

    /**
     * 保存当前行的种子文件
     * @param item
     */
    saveTorrentFile(item: SearchResultItem) {
      let requestMethod = ERequestMethod.GET;
      if (item.site) {
        requestMethod = item.site.downloadMethod || ERequestMethod.GET;
      }
      let url = item.url + "";
      let file = new FileDownloader({
        url,
        timeout: this.options.connectClientTimeout,
        fileName: `[${item.site.name}][${item.title}].torrent`
      });

      file.requestMethod = requestMethod;
      file.onError = (error: any) => { };
      file.start();
    },
    /**
     * 发送已选择的种子到下载服务器
     * @param datas
     * @param count
     */
    sendSelectedToClient(
      datas?: SearchResultItem[],
      count: number = 0,
      downloadOptions?: any
    ) {
      if (datas === undefined) {
        datas = [...this.selected];
        count = datas.length;
        this.sending.count = count;
        this.sending.completed = 0;
        this.sending.speed = 0;
        this.sending.progress = 0;
      }
      if (datas.length === 0) {
        this.sending.count = 0;
        return;
      }
      let data: SearchResultItem = datas.shift() as SearchResultItem;
      console.log(data.imdbId)
      this.sendToClient(
        data.url as string,
        data.title,
        downloadOptions,
        () => {
          this.sending.completed++;
          this.sending.progress =
            (this.sending.completed / this.sending.count) * 100;

          // 是否已完成
          if (this.sending.completed >= this.sending.count) {
            this.sending.count = 0;
            this.selected = [];
            return;
          }
          this.sendSelectedToClient(datas, count, downloadOptions);
        },
        data.link,
        data.imdbId
      );
    },
    /**
     * 复制当前链接到剪切板
     * @param url
     */
    copyLinkToClipboard(url: string) {
      this.successMsg = "";
      this.errorMsg = "";
      extension
        .sendRequest(EAction.copyTextToClipboard, null, url)
        .then((result) => {
          this.successMsg = this.$t(
            "searchTorrent.copyLinkToClipboardSuccess"
          ).toString();
        })
        .catch(() => {
          this.errorMsg = this.$t(
            "searchTorrent.copyLinkToClipboardError"
          ).toString();
        });
    },
    getSelectedURLs() {
      let urls: string[] = [];
      this.selected.forEach((item: SearchResultItem) => {
        item.url && urls.push(item.url);
      });
      return urls;
    },
    /**
     * 复制下载链接到剪切板
     */
    copySelectedToClipboard() {
      let urls: string[] = this.getSelectedURLs();
      this.clearMessage();
      extension
        .sendRequest(EAction.copyTextToClipboard, null, urls.join("\n"))
        .then((result) => {
          this.successMsg = this.$t(
            "searchTorrent.copySelectedToClipboardSuccess",
            {
              count: urls.length
            }
          ).toString();
          this.selected = [];
        })
        .catch(() => {
          this.errorMsg = this.$t(
            "searchTorrent.copyLinkToClipboardError"
          ).toString();
        });
    },
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
      this.haveSuccess = false;
      this.haveError = false;
    },

    /**
     * 根据指定的站点获取可用的下载目录及客户端信息
     * @param site
     */
    getSiteContentMenus(site: Site): any[] {
      let results: any[] = [];
      let clients: any[] = [];
      let host = site.host;
      if (!host) {
        return [];
      }

      if (this.siteContentMenus[host]) {
        return this.siteContentMenus[host];
      }

      /**
       * 增加下载目录
       * @param paths
       * @param client
       */
      function pushPath(paths: string[], client: any) {
        paths.forEach((path: string) => {
          results.push({
            client: client,
            path: path,
            host: site.host
          });
        });
      }

      this.options.clients.forEach((client: DownloadClient) => {
        clients.push({
          client: client,
          path: "",
          host: site.host
        });

        if (client.paths) {
          // 根据已定义的路径创建菜单
          for (const host in client.paths) {
            let paths = client.paths[host];

            if (host !== site.host) {
              continue;
            }

            pushPath(paths, client);
          }

          // 最后添加当前客户端适用于所有站点的目录
          let publicPaths = client.paths[ECommonKey.allSite];
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
    },

    /**
     * 显示指定链接的下载服务器及目录菜单
     * @param options
     * @param event
     */
    showSiteContentMenus(options: SearchResultItem, event?: any) {
      let items = this.getSiteContentMenus(options.site);
      let menus: any[] = [];

      items.forEach((item: any) => {
        if (item.client && item.client.name) {
          menus.push({
            title: this.$t("searchTorrent.downloadTo", {
              path:
                `${item.client.name} -> ${item.client.address}` +
                (item.path
                  ? ` -> ${this.pathHandler.replacePathKey(
                    item.path,
                    options.site
                  )}`
                  : ""),
            }).toString(),
            fn: () => {
              if (options.url) {
                // console.log(options, item);
                this.sendToClient(
                  options.url,
                  options.title,
                  item,
                  null,
                  options.link,
                  options.imdbId
                );
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
    },

    /**
     * 显示批量下载时可用下载服务器菜单
     * @param event
     */
    showAllContentMenus(event: any) {
      let clients: any[] = [];
      let menus: any[] = [];
      let _this = this;

      function addMenu(item: any) {
        let title = _this.$vuetify.breakpoint.xs
          ? item.client.name
          : _this
            .$t("searchTorrent.downloadTo", {
              path: `${item.client.name} -> ${item.client.address}`
            })
            .toString();

        if (item.path) {
          title += ` -> ${item.path}`;
        }
        menus.push({
          title: title,
          fn: () => {
            _this.sendSelectedToClient(undefined, 0, item);
          }
        });
      }

      if (this.clientContentMenus.length == 0) {
        this.options.clients.forEach((client: DownloadClient) => {
          clients.push({
            client: client,
            path: ""
          });
        });
        clients.forEach((item: any) => {
          if (item.client && item.client.name) {
            addMenu(item);

            if (item.client.paths) {
              // 添加适用于所有站点的目录
              let publicPaths = item.client.paths[ECommonKey.allSite];
              if (publicPaths) {
                publicPaths.forEach((path: string) => {
                  // 去除带关键字的目录
                  if (
                    path.indexOf("$site.name$") == -1 &&
                    path.indexOf("$site.host$") == -1 &&
                    path.indexOf("<...>") == -1
                  ) {
                    let _item = this.clone(item);
                    _item.path = path;
                    addMenu(_item);
                  }
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
    },

    /**
     * 重新搜索指定的站点
     * @param host
     */
    reSearchWithSite(host: string) {
      // 重新获取站点信息
      const site = this.options.sites.find((item: Site) => {
        return item.host === host;
      });

      if (!site) {
        return;
      }

      let index = this.searchResult.failedSites.findIndex((item: any) => {
        return item.site.host === host;
      });

      if (index !== -1) {
        this.searchResult.failedSites.splice(index, 1);
      }

      index = this.searchResult.noResultsSites.findIndex((item: any) => {
        return item.site.host === host;
      });

      if (index !== -1) {
        this.searchResult.noResultsSites.splice(index, 1);
      }

      this.doSearchTorrentWithQueue([site]);
    },

    /**
     * 重新搜索失败的站点
     */
    reSearchFailedSites() {
      if (this.searchResult.failedSites.length == 0) {
        return false;
      }

      let sites: Site[] = [];
      this.searchResult.failedSites.forEach((item: any) => {
        sites.push(item.site);
      });

      if (sites.length === 0) {
        this.errorMsg = this.$t("searchTorrent.noReSearchSites").toString();
        return;
      }

      this.searchResult.failedSites = [];

      this.beginTime = dayjs();
      this.writeLog({
        event: `SearchTorrent.Search.Start`,
        msg: this.$t("searchTorrent.searchStartMsg", {
          count: sites.length
        }).toString(),
        data: {
          key: this.key
        }
      });

      this.doSearchTorrentWithQueue(sites);
    },

    /**
     * 用JSON对象模拟对象克隆
     * @param source
     */
    clone(source: any) {
      return JSON.parse(JSON.stringify(source));
    },

    /**
     * 搜索结果过滤器，用于用户二次过滤
     * @param items
     * @param search
     */
    searchResultFilter(items: any[], search: string) {
      search = search.toString().toLowerCase();
      this.filteredDatas = [];
      if (search.trim() === "") return items;

      // 以空格分隔要过滤的关键字
      let searchs = search.split(" ");

      this.filteredDatas = items.filter((item: SearchResultItem) => {
        // 过滤标题和副标题
        let source = (item.title + (item.subTitle || "")).toLowerCase();
        let result = true;
        searchs.forEach((key) => {
          if (key.trim() != "") {
            result = result && source.indexOf(key) > -1;
          }
        });
        return result;
      });
      return this.filteredDatas;
    },

    getIMDbIdFromDouban(doubanId: string) {
      let match = doubanId.match(/douban(\d+)/);
      if (match && match.length >= 2) {
        this.searchMsg = this.$t("searchTorrent.doubanIdConverting").toString();
        return extension.sendRequest(
          EAction.getIMDbIdFromDouban,
          null,
          match[1]
        );
      } else {
        return new Promise<any>((resolve?: any, reject?: any) => {
          reject(this.$t("searchTorrent.invalidDoubanId").toString());
        });
      }
    },

    /**
     * 重新下载失败的种子文件
     */
    reDownloadFailedTorrents() {
      this.downloadTorrentFiles(this.downloadFailedTorrents);
    },

    /**
     * shift键多选操作
     * @param selected 是否被选中
     * @param index 当前索引
     */
    shiftCheck(selected: boolean, index: number) {
      if (this.lastCheckedIndex === -1) {
        this.lastCheckedIndex = index;
        return;
      }
      if (this.shiftKey) {
        let start = index;
        let end = this.lastCheckedIndex;
        let startIndex = Math.min(start, end);
        let endIndex = Math.max(start, end) + 1;
        let datas = this.clone(this.filteredDatas.length > 0 ? this.filteredDatas : this.datas);

        datas = datas.sort(
          this.arrayObjectSort(
            this.pagination.sortBy,
            this.pagination.descending
              ? EResourceOrderMode.desc
              : EResourceOrderMode.asc
          )
        );

        for (let i = startIndex; i < endIndex; i++) {
          let data = datas[i];
          let _index = this.selected.findIndex((_item: any) => {
            return _item.link === data.link;
          });

          if (selected) {
            if (_index === -1) {
              this.selected.push(data);
            }
          } else {
            if (_index !== -1) {
              this.selected.splice(_index, 1);
            }
          }
        }
      }
      this.lastCheckedIndex = index;
    },
    /**
     * 对指定的对象进行排序
     * @param field 字段
     * @param sortOrder 排序方式
     */
    arrayObjectSort(
      field: string,
      sortOrder: EResourceOrderMode = EResourceOrderMode.asc
    ) {
      // 深层获取对象指定的属性值
      function getObjectValue(obj: any, path: string) {
        return new Function("o", "return o." + path)(obj);
      }
      return function (object1: any, object2: any) {
        var value1 = getObjectValue(object1, field);
        var value2 = getObjectValue(object2, field);
        if (value1 < value2) {
          if (sortOrder == EResourceOrderMode.desc) {
            return 1;
          } else return -1;
        } else if (value1 > value2) {
          if (sortOrder == EResourceOrderMode.desc) {
            return -1;
          } else return 1;
        } else {
          return 0;
        }
      };
    },
    addSelectedToCollection(group: ICollectionGroup) {
      this.selected.forEach((item: SearchResultItem) => {
        if (item.url) {
          this.addToCollection(item, group);
        }
      });
    },
    /**
     * 添加到收藏
     * @param item 当前种子相关信息
     * @param group 收藏分组信息
     */
    addToCollection(item: any, group?: ICollectionGroup) {
      let options: any = {
        title: item.title,
        url: item.url,
        link: item.link,
        host: item.site.host,
        size: item.size,
        subTitle: item.subTitle,
        movieInfo: {
          imdbId: this.IMDbId || this.searchPayload.imdbId,
          doubanId: this.searchPayload.doubanId
        }
      };

      if (group && group.id) {
        options.groups = [group.id];
      }

      extension
        .sendRequest(EAction.addTorrentToCollection, null, options)
        .then((result) => {
          this.loadTorrentCollections();
          console.log(result);
        });
    },
    deleteCollection(item: any) {
      extension
        .sendRequest(EAction.deleteTorrentFromCollention, null, {
          link: PPF.getCleaningURL(item.link)
        })
        .then((result) => {
          this.loadTorrentCollections();
        });
    },
    loadTorrentCollections() {
      extension
        .sendRequest(EAction.getAllTorrentCollectionLinks)
        .then((result) => {
          this.torrentCollectionLinks = result;
        });
    },
    isCollectioned(link: string): boolean {
      return this.torrentCollectionLinks.includes(PPF.getCleaningURL(link));
    },
    /**
     * 全选/反选
     */
    toggleAll() {
      // 当有内容被选中时，取消选择
      if (this.selected.length > 0) {
        this.selected = [];

        // 当有过滤数据时，返回已过滤的数据
      } else if (this.filteredDatas.length > 0) {
        this.selected = this.filteredDatas.slice();
      } else {
        this.selected = this.datas.slice();
      }
    },
    changeSort(column: string) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending;
        this.headerOrderClickCount++;
        if (this.headerOrderClickCount == 2) {
          this.pagination.sortBy = "";
        }
      } else {
        this.headerOrderClickCount = 0;
        this.pagination.sortBy = column;
        this.pagination.descending = false;
      }
    },
    getHeaderClass(header: any) {
      let result: string[] = [];
      result.push("column");

      if (header.sortable !== false) {
        result.push("sortable");

        result.push(this.pagination.descending ? "desc" : "asc");
        if (header.value === this.pagination.sortBy) {
          result.push("active");
        }
      }

      if (header.align) {
        result.push(`text-xs-${header.align}`);
      }

      return result;
    },

    downloadSuccess(msg: string) {
      this.successMsg = msg;
    },

    downloadError(msg: string) {
      this.errorMsg = msg;
    },

    updateViewOptions() {
      this.$store.dispatch("updateViewOptions", {
        key: EViewKey.searchTorrent,
        options: {
          checkBox: this.checkBox,
          showCategory: this.showCategory
        }
      });
    },
    handleScroll() {
      const divToolbar: any = $("#divToolbar");
      if (!divToolbar || !divToolbar.offset()) {
        return;
      }
      const sysTopBar: any = $("#system-topbar");
      const top = sysTopBar.height();
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      const offsetTop = divToolbar.offset().top;
      if (scrollTop + top > offsetTop) {
        this.toolbarClass = "isFixedToolbar";
        this.toolbarIsFixed = true;
        const height = $("#divToobarInner").height() || 0;
        $("#divToobarHeight").height(height);
        $("#divToobarInner").css({
          top: top
        });
      } else {
        this.toolbarIsFixed = false;
        this.toolbarClass = "mt-3";
      }
    }
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("searchTorrent.headers.site"),
          align: "center",
          value: this.$store.state.options.searchResultOrderBySitePriority
            ? "site.priority"
            : "site.host",
          visible: this.$vuetify.breakpoint.mdAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.title"),
          align: "left",
          value: "title",
          visible: true,
        },
        {
          text: this.$t("searchTorrent.headers.category"),
          align: "center",
          value: "category.name",
          width: "150px",
          visible: this.$vuetify.breakpoint.width > 1200,
        },
        {
          text: this.$t("searchTorrent.headers.size"),
          align: "right",
          value: "size",
          width: "100px",
          visible: this.$vuetify.breakpoint.smAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.seeders"),
          align: "right",
          value: "seeders",
          width: "60px",
          visible: this.$vuetify.breakpoint.smAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.leechers"),
          align: "right",
          value: "leechers",
          width: "60px",
          visible: this.$vuetify.breakpoint.mdAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.completed"),
          align: "right",
          value: "completed",
          width: "60px",
          visible: this.$vuetify.breakpoint.mdAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.comments"),
          align: "right",
          value: "comments",
          width: "60px",
          visible: this.$vuetify.breakpoint.smAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.time"),
          align: "left",
          value: "time",
          width: "130px",
          visible: this.$vuetify.breakpoint.mdAndUp,
        },
        {
          text: this.$t("searchTorrent.headers.action"),
          sortable: false,
          width: this.$vuetify.breakpoint.mdAndUp ? "130px" : "80px",
          align: "center",
          visible: this.$vuetify.breakpoint.smAndUp,
        },
      ];
    },
    orderHeaders(): Array<any> {
      return this.headers.filter((item) => {
        return item.sortable !== false;
      });
    },
    orderMode(): Array<any> {
      return [
        {
          text: this.$t("common.orderMode.asc"),
          value: EResourceOrderMode.asc
        },
        {
          text: this.$t("common.orderMode.desc"),
          value: EResourceOrderMode.desc
        }
      ];
    },
    indeterminate(): boolean {
      if (
        this.selected.length > 0 &&
        this.selected.length < this.datas.length
      ) {
        return true;
      }
      return false;
    },
    // 已选中的种子大小
    selectedSize(): number {
      if (this.selected.length > 0) {
        let totalSize = 0;
        this.selected.forEach((item: SearchResultItem) => {
          const size: any = item.size;
          if (size > 0) {
            totalSize += size;
          }
        });

        return totalSize;
      }
      return 0;
    }
  }
});
