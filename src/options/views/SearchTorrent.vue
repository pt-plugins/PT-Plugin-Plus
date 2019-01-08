<template>
  <div class="search-torrent">
    <v-alert :value="true" type="info">{{ words.title }} [{{ key }}], {{searchMsg}} {{skipSites}}</v-alert>
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
        :rows-per-page-items="options.rowsPerPageItems"
        @update:pagination="updatePagination"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="center">
            <v-avatar size="18">
              <img :src="props.item.site.icon">
            </v-avatar>
            <br>
            <span>{{ props.item.site.name }}</span>
          </td>
          <td class="title">
            <a
              :href="props.item.link"
              target="_blank"
              v-html="props.item.title"
              rel="noopener noreferrer nofollow"
            ></a>
            <div class="sub-title">{{props.item.subTitle}}</div>
          </td>
          <td class="center" v-html="props.item.size"></td>
          <td class="center">{{ props.item.comments }}</td>
          <td class="center">{{ props.item.seeders }}</td>
          <td class="center">{{ props.item.leechers }}</td>
          <td class="center">{{ props.item.completed }}</td>
          <td>{{ props.item.author }}</td>
          <td>{{ props.item.time }}</td>
          <td>
            <v-icon
              small
              class="mr-2"
              @click="download(props.item.url, props.item.title)"
              :title="words.sendToClient"
            >cloud_download</v-icon>

            <a :href="props.item.url" target="_blank" rel="noopener noreferrer nofollow">
              <v-icon small class="mr-2" :title="words.save">get_app</v-icon>
            </a>
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
  EDownloadClientType,
  DataResult,
  EPaginationKey
} from "@/interface/common";
import { filters } from "@/service/filters";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "搜索结果",
        download: "下载",
        sendToClient: "发送到下载服务器",
        save: "下载种子文件到本地"
      },
      key: "",
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
        { text: "大小", align: "center", value: "size" },
        { text: "评论", align: "center", value: "comments" },
        { text: "上传", align: "center", value: "seeders" },
        { text: "下载", align: "center", value: "leechers" },
        { text: "完成", align: "center", value: "completed" },
        { text: "发布者", align: "left", value: "author" },
        { text: "发布时间", align: "left", value: "time" },
        { text: "操作", sortable: false }
      ],
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      currentSite: {} as Site,
      skipSites: ""
    };
  },
  created() {
    this.key = this.$route.params["key"];
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
    // console.log(to, from, next);
    // this.$route.params
    next();
  },
  watch: {
    key() {
      this.search();
    },
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  methods: {
    search() {
      if (window.location.hostname == "localhost") return;
      this.haveError = false;
      this.haveSuccess = false;
      this.datas = [];
      if (!this.options.sites) {
        this.errorMsg = "请先设置站点";
        return;
      }
      let rows: number =
        this.options.search && this.options.search.rows
          ? this.options.search.rows
          : 10;

      let sites: Site[] = [];
      let skipSites: string[] = [];
      this.skipSites = "";

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

      if (skipSites.length > 0) {
        this.skipSites = " 暂不支持搜索的站点：" + skipSites.join(",");
      }

      if (sites.length === 0) {
        this.errorMsg =
          "您还没有配置允许搜索的站点，请先前往【站点设置】进行配置";
        return;
      }

      this.doSearchTorrent({
        count: sites.length,
        sites
      });
    },

    doSearchTorrent(options: any) {
      let index = options.count - options.sites.length;
      let site = options.sites.shift();

      if (!site) {
        this.searchMsg = "搜索完成。";
        this.loading = false;
        return;
      }

      this.searchMsg =
        "正在搜索 [" +
        site.name +
        "]..." +
        (index + 1) +
        "/" +
        options.count +
        ".";
      this.loading = true;
      extension
        .sendRequest(EAction.getSearchResult, null, {
          key: this.key,
          site: site
        })
        .then((result: any) => {
          if (result && result.length) {
            this.datas.push(...result);
          } else if (result && result.msg) {
            this.errorMsg = result.msg;
          }

          this.doSearchTorrent(options);
        })
        .catch((result: DataResult) => {
          if (result.msg) {
            this.errorMsg = result.msg;
          }
        });
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
    download(url: string, title: string) {
      console.log(url);
      let host = filters.parseURL(url).host;
      let site = this.options.sites.find((site: Site) => {
        return site.host === host;
      });
      let defaultClientOptions = this.getters.clientOptions(site);
      let defaultPath = this.getters.siteDefaultPath(site);

      this.haveSuccess = true;
      this.successMsg = "正在发送种子到下载服务器……";

      extension
        .sendRequest(EAction.sendTorrentToDefaultClient, null, {
          url,
          title,
          savePath: defaultPath,
          autoStart: defaultClientOptions.autoStart
        })
        .then((result: any) => {
          console.log("命令执行完成", result);

          if (result.type == "success") {
            this.haveSuccess = true;
            this.successMsg = result.msg;
          } else {
            this.haveError = true;
            this.errorMsg = result.msg;
          }
        });
    },
    updatePagination(value: any) {
      console.log(value);
      this.$store.dispatch("updatePagination", {
        key: EPaginationKey.searchTorrent,
        options: value
      });
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
  a {
    color: #111;
    text-decoration: none;
    font-size: 16px;
  }
  a:hover {
    color: #008c00;
  }

  .sub-title {
    font-size: 12px;
    word-break: break-all;
    margin: 5px 0;
    color: #aaaaaa;
  }

  .center {
    text-align: center;
  }
}
</style>
