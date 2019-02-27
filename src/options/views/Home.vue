<template>
  <div class="home">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>

    <!-- 请求队列-->
    <v-list small v-if="requestQueue && requestQueue.length">
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
    </v-list>

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
        :items="items"
        :pagination.sync="pagination"
        item-key="site.host"
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <!-- 站点 -->
          <td class="center">
            <v-avatar size="18">
              <img :src="props.item.site.icon">
            </v-avatar>
            <span class="ml-2">{{ props.item.site.name }}</span>
          </td>
          <td>{{ props.item.user.base.name }}</td>
          <td>{{ props.item.user.extend.levelName }}</td>
          <td class="number">{{ props.item.user.extend.uploaded | formatSize }}</td>
          <td class="number">{{ props.item.user.extend.downloaded | formatSize }}</td>
          <td class="number">{{ props.item.user.extend.ratio }}</td>
          <td class="number">{{ props.item.user.extend.bonus }}</td>
          <td class>{{ props.item.user.extend.joinTime | formatDate }}</td>
          <td class>{{ props.item.user.extend.activeTime | formatDate }}</td>
          <td class="number">{{ props.item.user.extend.invites }}</td>
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
/**
 * export interface UserExtendInfo {
  // 上传量
  uploaded?: number;
  // 下载量
  downloaded?: number;
  // 分享率
  ratio?: number;
  // 当前做种数量
  seeding?: number;
  // 当前下载数量
  leeching?: number;
  // 等级名称
  levelName?: string;
  // 魔力值/积分
  bonus?: number;
  // 入站时间
  joinTime?: number;
  // 最近活动时间
  activeTime?: number;
  // 邀请数量
  invites?: number;
  // 头像
  avatar?: string;
}
 */
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
        { text: "站点", align: "left", value: "site.name" },
        { text: "用户名", align: "left", value: "user.base.name" },
        { text: "等级", align: "left", value: "user.extend.levelName" },
        { text: "上传量", align: "right", value: "user.extend.uploaded" },
        { text: "下载量", align: "right", value: "user.extend.downloaded" },
        { text: "分享率", align: "right", value: "user.extend.ratio" },
        { text: "魔力值/积分", align: "right", value: "user.extend.bonus" },
        { text: "入站时间", align: "center", value: "user.extend.joinTime" },
        { text: "最近活动", align: "center", value: "user.extend.activeTime" },
        { text: "邀请数量", align: "right", value: "user.extend.invites" }
      ],
      options: this.$store.state.options,
      beginTime: null as any,
      reloadCount: 0,
      requestQueue: [] as any[],
      requestTimer: 0,
      requestMsg: ""
    };
  },

  methods: {
    getInfos() {
      this.loading = true;

      this.beginTime = moment();
      this.writeLog({
        event: `Home.getUserInfo.Start`,
        msg: `准备开始获取个人数据`
      });

      this.options.sites.forEach((site: Site) => {
        if (site.allowGetUserInfo) {
          this.requestQueue.push({
            site
          });

          this.writeLog({
            event: `Home.getUserInfo.Processing`,
            msg: "正在获取 [" + site.name + "] 个人数据",
            data: {
              host: site.host,
              name: site.name
            }
          });

          this.getSiteUserInfo(site);
        }
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
        return item.site.host === site.host;
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

    getSiteUserInfo(site: Site) {
      extension
        .sendRequest(EAction.getUserInfo, null, site)
        .then((result: any) => {
          console.log(result);
          if (result) {
            this.items.push({
              site,
              user: result
            });
          }
        })
        .finally(() => {
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
