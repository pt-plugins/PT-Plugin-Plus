<template>
  <div class="home">
    <v-alert :value="true" type="info">{{ $t("home.title") }}</v-alert>
    <v-card>
      <v-card-title v-if="sites && sites.length > 0">
        <v-btn color="success" @click="getInfos" :loading="loading" :title="$t('home.getInfos')">
          <v-icon class="mr-2">cached</v-icon>
          {{ $t("home.getInfos") }}
        </v-btn>
        <v-btn to="/user-data-timeline" color="success" :title="$t('home.timeline')">
          <v-icon>timeline</v-icon>
        </v-btn>

        <v-btn to="/statistic" color="success" :title="$t('home.statistic')">
          <v-icon>equalizer</v-icon>
        </v-btn>

        <v-menu :close-on-content-click="false" offset-y>
          <template v-slot:activator="{ on }">
            <v-btn color="blue" dark v-on="on" :title="$t('home.settings')">
              <v-icon>settings</v-icon>
            </v-btn>
          </template>

          <v-card>
            <v-container grid-list-xs>
              <v-switch
                color="success"
                v-model="showSiteName"
                :label="$t('home.siteName')"
                @change="updateViewOptions"
              ></v-switch>
              <v-switch
                color="success"
                v-model="showUserName"
                :label="$t('home.userName')"
                @change="updateViewOptions"
              ></v-switch>
              <v-switch
                color="success"
                v-model="showUserLevel"
                :label="$t('home.userLevel')"
                @change="updateViewOptions"
              ></v-switch>

              <v-switch
                color="success"
                v-model="showWeek"
                :label="$t('home.week')"
                @change="updateViewOptions"
              ></v-switch>
            </v-container>
          </v-card>
        </v-menu>

        <!-- <AutoSignWarning /> -->
        <v-spacer></v-spacer>

        <v-text-field
          class="search"
          v-model="filterKey"
          append-icon="search"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :search="filterKey"
        :headers="headers"
        :items="sites"
        :pagination.sync="pagination"
        item-key="host"
        class="elevation-1"
        ref="userDataTable"
        :no-data-text="$t('home.nodata')"
      >
        <template slot="items" slot-scope="props">
          <!-- 站点 -->
          <td class="center">
            <v-badge color="red messageCount" overlap>
              <template
                v-slot:badge
                v-if="props.item.user.messageCount > 0"
                :title="$t('home.newMessage')"
              >
                {{
                props.item.user.messageCount > 10
                ? ""
                : props.item.user.messageCount
                }}
              </template>
              <v-btn
                flat
                icon
                class="siteIcon"
                :title="$t('home.getInfos')"
                @click.stop="getSiteUserInfo(props.item)"
              >
                <v-avatar :size="showSiteName ? 18 : 24">
                  <img :src="props.item.icon" />
                </v-avatar>
              </v-btn>
            </v-badge>

            <br />
            <a
              :href="props.item.activeURL"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="nodecoration"
              v-if="showSiteName"
            >
              <span class="caption">{{ props.item.name }}</span>
            </a>
          </td>
          <td>{{ showUserName ? props.item.user.name : "****" }}</td>
          <td>{{ showUserLevel ? props.item.user.levelName : "****" }}</td>
          <td class="number">
            <div>
              {{ props.item.user.uploaded | formatSize }}
              <v-icon small color="green darken-4">expand_less</v-icon>
            </div>
            <div>
              {{ props.item.user.downloaded | formatSize }}
              <v-icon small color="red darken-4">expand_more</v-icon>
            </div>
          </td>
          <td class="number">{{ props.item.user.ratio | formatRatio }}</td>
          <td class="number">{{ props.item.user.seeding }}</td>
          <td class="number">{{ props.item.user.seedingSize | formatSize }}</td>
          <td class="number">{{ props.item.user.bonus | formatNumber }}</td>
          <td
            class="number"
            :title="props.item.user.joinDateTime"
          >{{ props.item.user.joinTime | timeAgo(showWeek) }}</td>
          <td class="number">
            <v-btn
              depressed
              small
              :to="`statistic/${props.item.host}`"
              :title="$t('home.statistic')"
            >{{ props.item.user.lastUpdateTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</v-btn>
          </td>
          <td class="center">
            <v-progress-circular
              indeterminate
              :width="3"
              size="30"
              color="green"
              v-if="props.item.user.isLoading"
            >
              <v-icon
                v-if="props.item.user.isLoading"
                @click="abortRequest(props.item)"
                color="red"
                small
                :title="$t('home.cancelRequest')"
              >cancel</v-icon>
            </v-progress-circular>
            <span v-else>
              <a
                :href="props.item.activeURL"
                v-if="!props.item.user.isLogged"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="nodecoration"
              >{{ props.item.user.lastErrorMsg }}</a>
              <span v-else>{{ props.item.user.lastErrorMsg }}</span>
            </span>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-alert :value="true" color="grey">
      <div v-html="$t('home.tip')"></div>
    </v-alert>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import {
  EAction,
  Site,
  LogItem,
  EModule,
  EUserDataRequestStatus,
  Options,
  UserInfo,
  EViewKey
} from "@/interface/common";
import dayjs from "dayjs";

import AutoSignWarning from "./AutoSignWarning.vue";
import { PPF } from "@/service/public";

interface UserInfoEx extends UserInfo {
  joinDateTime?: string;
}

const extension = new Extension();
export default Vue.extend({
  components: {
    AutoSignWarning
  },
  data() {
    return {
      loading: false,
      items: [] as any[],
      pagination: {
        rowsPerPage: -1
      },
      options: this.$store.state.options,
      beginTime: null as any,
      reloadCount: 0,
      requestQueue: [] as any[],
      requestTimer: 0,
      requestMsg: "",
      sites: [] as Site[],
      filterKey: "",
      isSecret: false,
      showUserName: true,
      showSiteName: true,
      showUserLevel: true,
      showWeek: false
    };
  },
  created() {
    this.init();
  },

  /**
   * 当前组件激活时触发
   * 因为启用了缓存，所以需要重新加载数据
   */
  activated() {
    if (!this.loading) {
      this.init();
    }
  },

  methods: {
    resetSites() {
      this.sites = [];
      this.options.sites.forEach((site: Site) => {
        let _site: Site = this.clone(site);
        if (_site.allowGetUserInfo) {
          if (!_site.user) {
            _site.user = {
              id: "",
              name: "",
              isLogged: false,
              isLoading: false
            };
          } else {
            if (_site.user.isLoading === undefined) {
              _site.user.isLoading = false;
            }

            if (_site.user.isLogged === undefined) {
              _site.user.isLogged = false;
            }
            this.formatUserInfo(_site.user, _site);
          }
          this.sites.push(_site);
        }
      });
    },

    init() {
      extension
        .sendRequest(EAction.readConfig)
        .then((options: Options) => {
          this.options = this.clone(options);
          this.resetSites();
        })
        .catch();

      let viewOptions = this.$store.getters.viewsOptions(EViewKey.home, {
        showUserName: true,
        showSiteName: true,
        showUserLevel: true,
        showWeek: false
      });
      Object.assign(this, viewOptions);
    },
    getInfos() {
      this.loading = true;
      this.beginTime = dayjs();
      this.writeLog({
        event: `Home.getUserInfo.Start`,
        msg: this.$t("home.startGetting").toString()
      });

      this.sites.forEach((site: Site, index: number) => {
        this.writeLog({
          event: `Home.getUserInfo.Processing`,
          msg: this.$t("home.gettingForSite", {
            siteName: site.name
          }).toString(),
          data: {
            host: site.host,
            name: site.name
          }
        });

        this.getSiteUserInfo(site);
      });
    },
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
     * 移除搜索队列
     */
    removeQueue(site: Site) {
      let index = this.requestQueue.findIndex((item: any) => {
        return item.host === site.host;
      });
      (site.user as any).isLoading = false;
      if (index !== -1) {
        this.requestQueue.splice(index, 1);
        if (this.requestQueue.length == 0) {
          this.requestMsg = this.$t("home.requestCompleted", {
            second: dayjs().diff(this.beginTime, "second", true)
          }).toString();
          this.loading = false;
          this.writeLog({
            event: `Home.getUserInfo.Finished`,
            msg: this.requestMsg
          });
          // 重置站点信息，因为有时候加载完成后，某些行还显示正在加载，暂时未明是哪里问题
          this.sites = this.clone(this.sites);
        }
      }
    },
    /**
     * 格式化一些用户信息
     */
    formatUserInfo(user: UserInfoEx, site: Site) {
      let downloaded = user.downloaded as number;
      let uploaded = user.uploaded as number;
      // 没有下载量时设置分享率为无限
      if (downloaded == 0 && uploaded > 0) {
        user.ratio = -1;
      }
      // 重新以 上传量 / 下载量计算分享率
      else if (downloaded > 0) {
        user.ratio = uploaded / downloaded;
      }

      // 如果设置了时区，则进行转换
      user.joinTime = PPF.transformTime(user.joinTime, site.timezoneOffset);

      user.joinDateTime = dayjs(user.joinTime).format("YYYY-MM-DD HH:mm:ss");
    },
    /**
     * 获取站点用户信息
     */
    getSiteUserInfo(site: Site) {
      if (!site.user) {
        return;
      }

      let user = site.user;
      user.isLoading = true;
      user.isLogged = false;
      user.lastErrorMsg = "";

      this.requestQueue.push(Object.assign({}, site));
      extension
        .sendRequest(EAction.getUserInfo, null, site)
        .then((result: any) => {
          console.log(result);
          if (result && result.name) {
            user = Object.assign(user, result);
            this.formatUserInfo(user, site);
          }
        })
        .catch(result => {
          console.log("error", result);
          if (result.msg && result.msg.status) {
            user.lastErrorMsg = result.msg.msg;
          } else {
            user.lastErrorMsg = this.$t("home.getUserInfoError").toString();
          }
        })
        .finally(() => {
          this.removeQueue(site);
          // 重新加载配置信息
          this.$store.commit("readConfig");
        });
    },

    abortRequest(site: Site) {
      extension
        .sendRequest(EAction.abortGetUserInfo, null, site)
        .then(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort`,
            msg: this.$t("home.getUserInfoAbort", {
              siteName: site.name
            }).toString()
          });
        })
        .catch(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort.Error`,
            msg: this.$t("home.getUserInfoAbortError", {
              siteName: site.name
            }).toString()
          });
          this.removeQueue(site);
        });
    },

    /**
     * 用JSON对象模拟对象克隆
     * @param source
     */
    clone(source: any) {
      return JSON.parse(JSON.stringify(source));
    },

    updateViewOptions() {
      this.$store.dispatch("updateViewOptions", {
        key: EViewKey.home,
        options: {
          showUserName: this.showUserName,
          showSiteName: this.showSiteName,
          showUserLevel: this.showUserLevel,
          showWeek: this.showWeek
        }
      });
    }
  },

  filters: {
    formatRatio(v: any) {
      if (v > 10000 || v == -1) {
        return "∞";
      }
      let number = parseFloat(v);
      if (isNaN(number)) {
        return "";
      }
      return number.toFixed(2);
    }
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("home.headers.site"),
          align: "center",
          value: "name",
          width: "110px"
        },
        {
          text: this.$t("home.headers.userName"),
          align: "left",
          value: "user.name"
        },
        {
          text: this.$t("home.headers.levelName"),
          align: "left",
          value: "user.levelName"
        },
        {
          text: this.$t("home.headers.activitiyData"),
          align: "right",
          value: "user.uploaded",
          width: "120px"
        },
        {
          text: this.$t("home.headers.ratio"),
          align: "right",
          value: "user.ratio"
        },
        {
          text: this.$t("home.headers.seeding"),
          align: "right",
          value: "user.seeding"
        },
        {
          text: this.$t("home.headers.seedingSize"),
          align: "right",
          value: "user.seedingSize"
        },
        {
          text: this.$t("home.headers.bonus"),
          align: "right",
          value: "user.bonus"
        },
        {
          text: this.$t("home.headers.joinTime"),
          align: "right",
          value: "user.joinTime"
        },
        {
          text: this.$t("home.headers.lastUpdateTime"),
          align: "right",
          value: "user.lastUpdateTime"
        },
        { text: this.$t("home.headers.status"), align: "center", value: "" }
      ];
    }
  }
});
</script>

<style lang="scss">
.home {
  table.v-table thead tr:not(.v-datatable__progress) th,
  table.v-table tbody tr td {
    padding: 5px !important;
    font-size: 12px;
  }

  .center {
    text-align: center;
  }
  .number {
    text-align: right;
  }

  .nodecoration {
    text-decoration: none;
  }

  .messageCount {
    font-size: 9px;
    height: 16px;
    width: 16px;
    top: -2px;
    right: -8px;
  }

  .siteIcon {
    margin: 0;
    height: 30px;
    width: 30px;
  }
}
</style>
