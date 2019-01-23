<template>
  <!-- 导航栏 -->
  <v-navigation-drawer clipped fixed v-model="drawer" app>
    <v-list v-for="(group,index) in navs" :key="index" dense>
      <v-subheader v-if="group.title" class="grey--text text--darken-1">{{group.title}}</v-subheader>
      <v-list-tile
        :to="item.key"
        v-for="(item, index) in group.items"
        :key="index"
        :href="item.url"
        :target="item.url?'_blank':''"
        rel="noopener noreferrer nofollow"
      >
        <v-list-tile-action class="ml-3">
          <v-icon>{{item.icon}}</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>{{item.title}}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    value: Boolean
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    drawer() {
      this.$emit("change", this.drawer);
    },
    value() {
      this.drawer = this.value;
    }
  },
  data() {
    return {
      drawer: true,
      navs: [
        {
          title: "概览",
          key: "group-",
          items: [
            {
              title: "概览",
              icon: "dashboard",
              key: "/home"
            },
            {
              title: "搜索结果",
              icon: "search",
              key: "/search-torrent"
            },
            {
              title: "下载历史",
              icon: "history",
              key: "/history"
            }
          ]
        },
        {
          title: "参数设置",
          items: [
            {
              title: "基本设置",
              icon: "settings",
              key: "/set-base"
            },
            // {
            //   title: "已支持的站点架构",
            //   icon: "ballot",
            //   key: "set-support-schema"
            // },
            {
              title: "站点设置",
              icon: "public",
              key: "/set-sites"
            },
            {
              title: "下载服务器",
              icon: "cloud_download",
              key: "/set-download-clients"
            },
            {
              title: "下载目录设置",
              icon: "folder_open",
              key: "/set-download-paths"
            },
            {
              title: "搜索方案",
              icon: "widgets",
              key: "/set-search-solution"
            },
            {
              title: "参数备份与恢复",
              icon: "restore",
              key: "/set-backup"
            }
            // {
            //   title: "语言",
            //   icon: "language",
            //   key: "/set-language"
            // }
          ]
        },
        {
          title: "鸣谢",
          items: [
            {
              title: "特别感谢",
              icon: "developer_board",
              key: "/technology-stack"
            },
            {
              title: "项目参与人员",
              icon: "people",
              key: "/dev-team"
            }
          ]
        },
        {
          title: "支持本项目",
          items: [
            {
              title: "Bug反馈",
              icon: "bug_report",
              key: "",
              url: "https://github.com/ronggang/PT-Plugin-Plus/issues"
            },
            {
              title: "捐助",
              icon: "favorite",
              key: "/donate"
            }
          ]
        }
      ]
    };
  }
});
</script>
