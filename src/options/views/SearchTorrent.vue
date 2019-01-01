<template>
  <div class="search-torrent">
    <v-alert :value="true" type="info">{{ words.title }} [{{ key }}], {{searchMsg}}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn :disabled="selected.length==0" color="success">
          <v-icon class="mr-2">cloud_download</v-icon>
          {{words.download}}
        </v-btn>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="datas"
        :pagination.sync="pagination"
        :loading="loading"
        item-key="name"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="title">
            <a :href="props.item.link" target="_blank" v-html="getTitle(props.item.title)"></a>
            <div class="sub-title" v-html="getSubTitle(props.item.title)"></div>
          </td>
          <td style="text-align:right;">{{ props.item.size | formatSize }}</td>
          <td>{{ getAuthor(props.item.author) }}</td>
          <td>{{ props.item.date }}</td>
          <td>
            <v-icon
              small
              class="mr-2"
              @click="download(props.item.url)"
              :title="words.download"
            >cloud_download</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import { Route } from "vue-router";
import {
  EAction,
  Site,
  SiteSchema,
  Dictionary,
  EDownloadClientType
} from "@/interface/common";
import { filters } from "@/service/filters";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "搜索结果",
        download: "下载"
      },
      key: "",
      options: this.$store.state.options,
      searchMsg: "",
      datas: [
        {
          title:
            "The.Opening.of.Misty.Beethoven.1976.1080p.BluRay.x264.DTS-HDChina[贝多芬小姐的启蒙 *18禁 亮点自寻 感谢原发布者]",
          link: "https://hdcmct.org/details.php?id=61753",
          url: "https://hdcmct.org/download.php?id=61753",
          size: "12686571893",
          date: "2018/3/1 上午9:51:51",
          author: "anonymous@hdcmct.org (anonymous)"
        },
        {
          title:
            "Beethoven.9.Symphonies.2010.Blu-ray.1080i.AVC.DTS-HDMA5.0[贝多芬九大交响曲全集 维也纳爱乐乐团和德国指挥家克里斯蒂安·蒂勒曼在维也纳金色大厅的完美演绎]",
          link: "https://hdcmct.org/details.php?id=57244",
          url: "https://hdcmct.org/download.php?id=57244",
          size: "131263632891",
          date: "2017/11/6 下午2:05:26",
          author: "confessor@hdcmct.org (confessor)"
        },
        {
          title:
            "Ludwig.van.Beethoven.Symphonies.1-9..2015.2-Disc.Edition.Blu-ray.1080i.AVC.DTS-HD.5.0-HDclub[柏林爱乐管弦乐团首席指挥 西蒙拉特 维也纳爱乐 贝多芬9大交响曲]",
          link: "https://hdcmct.org/details.php?id=46239",
          url: "https://hdcmct.org/download.php?id=46239",
          size: "94060751758",
          date: "2016/12/30 下午11:46:14",
          author: "anonymous@hdcmct.org (anonymous)"
        },
        {
          title:
            "The.Opening.of.Misty.Beethoven.1976.1080p.Blu-ray.AVC.DTS-HD.MA.5.1[[贝多芬小姐的启蒙]18禁 | 第一届色情片影展(Erotic Film Festival)的最佳影片]",
          link: "https://hdcmct.org/details.php?id=45178",
          url: "https://hdcmct.org/download.php?id=45178",
          size: "48911243244",
          date: "2016/11/26 上午10:42:21",
          author: "ansonguan@hdcmct.org (ansonguan)"
        },
        {
          title:
            "Beethoven.Symphonies.Nos. 1-9.1080i.Blu-ray.H.264.DTS-HD[贝多芬交响曲1~9[爱乐者不可或缺的经典名盘]]",
          link: "https://hdcmct.org/details.php?id=31913",
          url: "https://hdcmct.org/download.php?id=31913",
          size: "108996089926",
          date: "2015/7/4 上午12:17:42",
          author: "eversf@hdcmct.org (eversf)"
        },
        {
          title:
            "Beethoven.Missa.Solemnis.2010.BluRay.1080p.FLAC.x264-lizhe[贝多芬：D大调庄严弥撒 自压资源]",
          link: "https://hdcmct.org/details.php?id=31460",
          url: "https://hdcmct.org/download.php?id=31460",
          size: "7527413016",
          date: "2015/6/10 下午7:20:11",
          author: "lizhe@hdcmct.org (lizhe)"
        },
        {
          title:
            "Beethoven.Symphonies.Nos.4-6.BluRay.720p.x264.DTS-HDChina[提勒曼 维也纳爱乐 贝多芬9大交响曲4-6]",
          link: "https://hdcmct.org/details.php?id=27972",
          url: "https://hdcmct.org/download.php?id=27972",
          size: "10788295123",
          date: "2014/12/1 下午2:32:46",
          author: "anonymous@hdcmct.org (anonymous)"
        },
        {
          title:
            "Beethoven.-.Missa.Solemnis.in.D.Major.2010.1080i.Blu-ray.AVC.DTS-HD.MA.5.1-why1812[贝多芬：D大调庄严弥撒[原盘DIY官方图形中文字幕]]",
          link: "https://hdcmct.org/details.php?id=26238",
          url: "https://hdcmct.org/download.php?id=26238",
          size: "19582527236",
          date: "2014/9/10 下午6:41:40",
          author: "anonymous@hdcmct.org (anonymous)"
        },
        {
          title:
            "Beethoven.-.Missa.Solemnis.in.D.Major.2010.1080i.Blu-ray.AVC.DTS-HDMA.5.1-why1812[贝多芬：D大调庄严弥撒曲 [原盘DIY繁体中文字幕]]",
          link: "https://hdcmct.org/details.php?id=25465",
          url: "https://hdcmct.org/download.php?id=25465",
          size: "19584488896",
          date: "2014/7/28 下午6:42:23",
          author: "anonymous@hdcmct.org (anonymous)"
        },
        {
          title:
            "Chesky.Records.1988.flac[勒内·莱波维茨 [贝多芬第二、第五交响曲]]",
          link: "https://hdcmct.org/details.php?id=24592",
          url: "https://hdcmct.org/download.php?id=24592",
          size: "401557995",
          date: "2014/5/28 下午1:11:31",
          author: "@hdcmct.org ()"
        }
      ] as any,
      selected: [],
      pagination: {
        rowsPerPage: 10
      },
      loading: false,
      headers: [
        { text: "标题", align: "left", value: "title" },
        { text: "大小", align: "right", value: "size" },
        { text: "发布者", align: "left", value: "author" },
        { text: "发布时间", align: "left", value: "date" },
        { text: "操作", sortable: false }
      ],
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      currentSite: {} as Site
    };
  },
  created() {
    this.key = this.$route.params["key"];
  },
  beforeRouteUpdate(to: Route, from: Route, next: any) {
    if (!to.params.key) {
      return;
    }
    this.key = to.params.key;
    // console.log(to, from, next);
    // this.$route.params
    next();
  },
  watch: {
    key() {
      this.search();
    }
  },
  methods: {
    search() {
      if (window.location.hostname == "localhost") return;
      this.datas = [];
      if (!this.options.sites) {
        this.errorMsg = "请先设置站点";
        this.haveError = true;
        return;
      }
      let rows: number =
        this.options.search && this.options.search.rows
          ? this.options.search.rows
          : 10;

      let urls: string[] = [];
      let scripts: string[] = [];
      let sites: Site[] = [];
      let errors: string[] = [];

      this.options.sites.forEach((item: Site) => {
        if (item.allowSearch) {
          let siteSchema: SiteSchema = this.getSiteSchema(item);
          let url: string = <string>item.url + siteSchema.searchPage;
          let script: string = <string>siteSchema.getSearchResultScript;

          url = this.replaceKeys(url, {
            key: this.key,
            rows: rows,
            passkey: item.passkey ? item.passkey : ""
          });

          urls.push(url);
          scripts.push(script);
          sites.push(item);
        }
      });

      this.doSearchTorrent({
        count: urls.length,
        sites,
        urls,
        scripts,
        errors
      });
    },

    doSearchTorrent(options: any) {
      let index = options.count - options.urls.length;
      let url = options.urls.shift();

      if (!url) {
        this.searchMsg = "搜索完成。";
        this.loading = false;
        return;
      }
      let site = options.sites[index];
      this.searchMsg =
        "正在搜索 [" +
        site.name +
        "]..." +
        (index + 1) +
        "/" +
        options.count +
        ".";
      this.loading = true;
      extension.sendRequest(
        EAction.getSearchResult,
        (result: any) => {
          console.log(result);
          result && this.datas.push(...result);
          this.doSearchTorrent(options);
        },
        {
          key: this.key,
          url: url,
          script: options.scripts[index],
          site: site
        }
      );
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
      } else if (site) {
        let _site = this.options.system.sites.find((item: Site) => {
          return item.host == site.host;
        });
        if (_site && _site.schema) {
          schema = _site.schema;
          schema.siteOnly = true;
        }
      }

      return schema;
    },
    replaceKeys(source: string, keys: Dictionary<any>): string {
      let result: string = source;

      for (const key in keys) {
        if (keys.hasOwnProperty(key)) {
          const value = keys[key];
          result = result.replace("$" + key + "$", value);
        }
      }
      return result;
    },
    formatTitle(title: string): string {
      if (title.indexOf("[") !== -1) {
        return title.split("[").join("<br/>");
      }
      return title;
    },
    getTitle(title: string): string {
      if (title.indexOf("[") !== -1) {
        return title.split("[")[0].replace(/]/g, "");
      }
      return title;
    },
    getSubTitle(title: string): string {
      if (title.indexOf("[") !== -1) {
        return title.split("[")[1].replace(/]/g, "");
      }
      return title;
    },
    getAuthor(author: string): string {
      if (author.indexOf("(") !== -1) {
        return author.split("(")[1].replace(/\)/g, "");
      }
      return author;
    },
    download(url: string) {
      console.log(url);
      let host = filters.parseURL(url).host;
      let site = this.options.sites.find((site: Site) => {
        return site.host === host;
      });
      let defaultClientOptions = this.getClientOptions(site);
      let defaultPath = this.getSiteDefaultPath(site);

      this.haveSuccess = true;
      this.successMsg = "正在发送种子到下载服务器……";

      extension.sendRequest(
        EAction.sendTorrentToDefaultClient,
        (result: any) => {
          console.log("命令执行完成", result);
          let notice = {
            type: "error",
            msg: ""
          };

          switch (defaultClientOptions.type) {
            // transmission
            case EDownloadClientType.transmission:
              if (result.id != undefined) {
                notice.msg =
                  result.name + " 已发送至 Transmission，编号：" + result.id;
                notice.type = "success";
                if (!defaultPath) {
                  notice.type = "info";
                  notice.msg += "；但站点默认目录未配置，建议配置。";
                }
              } else if (result.status) {
                switch (result.status) {
                  // 重复的种子
                  case "duplicate":
                    notice.msg =
                      result.torrent.name +
                      " 种子已存在！编号：" +
                      result.torrent.id;
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
                msg: "种子已添加"
              };
              break;
          }

          if (notice.type == "success") {
            this.haveSuccess = true;
            this.successMsg = notice.msg;
          } else {
            this.haveError = true;
            this.errorMsg = notice.msg;
          }
        },
        {
          url: url,
          savePath: defaultPath,
          autoStart: defaultClientOptions.autoStart
        }
      );
    },

    /**
     * 获取指定客户端配置
     * @param clientId
     */
    getClientOptions(site: Site, clientId: string = "") {
      if (!clientId) {
        clientId = site.defaultClientId || <string>this.options.defaultClientId;
      }

      let client = this.options.clients.find((item: any) => {
        return item.id === clientId;
      });

      return client;
    },

    /**
     * 获取当前站点的默认下载目录
     * @param string clientId 指定客户端ID，不指定表示使用默认下载客户端
     * @return string 目录信息，如果没有定义，则返回空字符串
     */
    getSiteDefaultPath(site: Site, clientId: string = ""): string {
      if (!clientId) {
        clientId = site.defaultClientId || <string>this.options.defaultClientId;
      }

      let client = this.options.clients.find((item: any) => {
        return item.id === clientId;
      });
      let path = "";
      if (client && client.paths) {
        for (const host in client.paths) {
          if (site.host === host) {
            path = client.paths[host][0];
            break;
          }
        }
      }

      return path;
    }
  }
});
</script>

<style lang="scss" scoped>
.search-torrent {
  .title {
    max-width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 10px 0 5px 15px;
  }
  .title a {
    color: #111;
    text-decoration: none;
    font-size: 16px;
  }
  .title a:hover {
    color: #008c00;
  }

  .sub-title {
    font-size: 12px;
    word-break: break-all;
    margin: 5px 0;
    color: #aaaaaa;
  }
}
</style>
