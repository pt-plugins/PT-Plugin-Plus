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
          <td>
            <v-avatar size="18">
              <img :src="props.item.site.icon">
            </v-avatar>
            <span class="ml-2">{{ props.item.site.name }}</span>
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
              @click="download(props.item.url, getTitle(props.item.title))"
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
      getters: this.$store.getters,
      searchMsg: "",
      datas: [] as any,
      selected: [],
      pagination: {
        rowsPerPage: 10
      },
      loading: false,
      headers: [
        { text: "站点", align: "left", value: "site.host" },
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
          if (siteSchema && siteSchema.searchPage) {
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
        }
      });

      if (urls.length === 0) {
        this.errorMsg =
          "您还没有配置允许搜索的站点，请先前往【站点设置】进行配置";
        this.haveError = true;
        return;
      }

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
