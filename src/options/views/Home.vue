<template>
  <div class="home">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>

    <!-- 请求队列-->
    <!-- <v-list small v-if="requestQueue && requestQueue.length">
      <template v-for="(item, index) in requestQueue">
        <v-list-tile :key="item.site.host">
          <v-list-tile-action>
            <v-progress-circular :size="18" :width="2" indeterminate color="primary"></v-progress-circular>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>
              <v-avatar size="18" class="mr-2">
                <img :src="item.site.icon">
              </v-avatar>
              {{item.site.name}} {{ words.requesting }}
            </v-list-tile-title>
          </v-list-tile-content>

          <v-list-tile-action class="mr-5">
            <v-icon @click="abortRequest(item.site)" color="red" :title="words.cancelRequest">cancel</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider v-if="index + 1 < requestQueue.length" :key="'line'+item.site.host+index"></v-divider>
      </template>
    </v-list>-->
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="getInfos" :loading="loading">
          <v-icon class="mr-2">cached</v-icon>
          {{words.getInfos}}
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="sites"
        :pagination.sync="pagination"
        item-key="host"
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <!-- 站点 -->
          <td class="center">
            <v-avatar size="18">
              <img :src="props.item.icon">
            </v-avatar>
            <span class="ml-2">{{ props.item.name }}</span>
          </td>
          <td>{{ props.item.user.name }}</td>
          <td>{{ props.item.user.levelName }}</td>
          <td class="number">{{ props.item.user.uploaded | formatSize }}</td>
          <td class="number">{{ props.item.user.downloaded | formatSize }}</td>
          <td class="number">{{ props.item.user.ratio }}</td>
          <td class="number">{{ props.item.user.seeding }}</td>
          <td class="number">{{ props.item.user.seedingSize | formatSize }}</td>
          <td class="number">{{ props.item.user.bonus | formatNumber }}</td>
          <td class="number">{{ props.item.user.joinTime | timeAgo }}</td>
          <td
            class="number"
          >{{ props.item.user.lastUpdateTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</td>
          <td class="number">
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
                :title="words.cancelRequest"
              >cancel</v-icon>
            </v-progress-circular>
            <span v-else>{{ props.item.user.lastErrorMsg }}</span>
          </td>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import { EAction, Site, LogItem, EModule } from "@/interface/common";
import moment from "moment";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "概览",
        getInfos: "获取用户信息",
        cancelRequest: "取消请求",
        requesting: "正在请求"
      },
      loading: false,
      items: [] as any[],
      pagination: {
        rowsPerPage: 50
      },
      headers: [
        { text: "站点", align: "left", value: "name" },
        { text: "用户名", align: "left", value: "user.name" },
        { text: "等级", align: "left", value: "user.levelName" },
        { text: "上传量", align: "right", value: "user.uploaded" },
        { text: "下载量", align: "right", value: "user.downloaded" },
        { text: "分享率", align: "right", value: "user.ratio" },
        { text: "做种数量", align: "right", value: "user.seeding" },
        { text: "做种体积", align: "right", value: "user.seedingSize" },
        { text: "魔力值/积分", align: "right", value: "user.bonus" },
        { text: "入站时间", align: "right", value: "user.joinTime" },
        { text: "数据更新于", align: "right", value: "user.lastUpdateTime" },
        { text: "状态", align: "center", value: "" }
      ],
      options: this.$store.state.options,
      beginTime: null as any,
      reloadCount: 0,
      requestQueue: [] as any[],
      requestTimer: 0,
      requestMsg: "",
      sites: [] as any[]
    };
  },
  created() {
    this.init();
  },

  methods: {
    init() {
      this.options.sites.forEach((site: Site) => {
        if (site.allowGetUserInfo) {
          if (!site.user) {
            site.user = {
              id: "",
              name: "",
              isLogged: false,
              isLoading: false
            };
          }
          this.sites.push(Object.assign({}, site));
        }
      });
    },
    getInfos() {
      this.loading = true;
      this.beginTime = moment();
      this.writeLog({
        event: `Home.getUserInfo.Start`,
        msg: `准备开始获取个人数据`
      });

      this.sites.forEach((site: Site, index: number) => {
        this.writeLog({
          event: `Home.getUserInfo.Processing`,
          msg: "正在获取 [" + site.name + "] 个人数据",
          data: {
            host: site.host,
            name: site.name
          }
        });

        this.getSiteUserInfo(site, index);
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
      if (index !== -1) {
        this.requestQueue.splice(index, 1);
        if (this.requestQueue.length == 0) {
          this.requestMsg = `请求完成，耗时：${moment().diff(
            this.beginTime,
            "seconds",
            true
          )} 秒。`;
          this.loading = false;
          this.writeLog({
            event: `Home.getUserInfo.Finished`,
            msg: this.requestMsg
          });
        }
      }
    },

    /**
     * 获取站点用户信息
     */
    getSiteUserInfo(site: Site, index: number) {
      if (!site.user) {
        return;
      }

      let user = site.user;
      user.isLoading = true;
      user.lastErrorMsg = "";

      this.requestQueue.push(Object.assign({}, site));
      extension
        .sendRequest(EAction.getUserInfo, null, site)
        .then((result: any) => {
          console.log(result);
          if (result) {
            user = Object.assign(user, result);
            user.lastUpdateTime = new Date().getTime();
          }
        })
        .catch(result => {
          console.log("error", result);
          if (result.msg && result.msg.isLogged === false) {
            user.lastErrorMsg = "未登录";
          } else {
            user.lastErrorMsg = "发生错误";
          }
        })
        .finally(() => {
          user.isLoading = false;
          this.removeQueue(site);
        });
    },

    abortRequest(site: Site) {
      extension
        .sendRequest(EAction.abortSearch, null, site)
        .then(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort`,
            msg: `${site.name} 获取用户资料请求已取消`
          });
        })
        .catch(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort.Error`,
            msg: `${site.name} 获取用户资料请求取消失败`
          });
          this.removeQueue(site);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.home {
  .number {
    text-align: right;
  }
}
</style>
