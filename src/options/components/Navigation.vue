<template>
  <!-- 导航栏 -->
  <v-navigation-drawer clipped fixed v-model="drawer" app>
    <v-list v-for="(group,index) in navs" :key="index" dense>
      <v-subheader v-if="group.title" class="grey--text text--darken-1">{{ $t(group.title) }}</v-subheader>
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
          <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
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
      drawer: this.$store.state.options.navBarIsOpen,
      navs: [
        {
          title: "navigation.dashboard.title",
          key: "group-",
          items: [
            {
              title: "navigation.dashboard.title",
              icon: "dashboard",
              key: "/home"
            },
            {
              title: "navigation.dashboard.searchResults",
              icon: "search",
              key: "/search-torrent"
            },
            {
              title: "navigation.dashboard.history",
              icon: "history",
              key: "/history"
            }
          ]
        },
        {
          title: "navigation.settings.title",
          items: [
            {
              title: "navigation.settings.downloadClients",
              icon: "cloud_download",
              key: "/set-download-clients"
            },
            {
              title: "navigation.settings.base",
              icon: "settings",
              key: "/set-base"
            },
            {
              title: "navigation.settings.sites",
              icon: "public",
              key: "/set-sites"
            },
            {
              title: "navigation.settings.downloadPaths",
              icon: "folder_open",
              key: "/set-download-paths"
            },
            {
              title: "navigation.settings.searchSolution",
              icon: "widgets",
              key: "/set-search-solution"
            },
            {
              title: "navigation.settings.backup",
              icon: "restore",
              key: "/set-backup"
            },
            {
              title: "navigation.settings.permissions",
              icon: "verified_user",
              key: "set-permissions"
            }
          ]
        },
        {
          title: "navigation.thanks.title",
          items: [
            {
              title: "navigation.thanks.reference",
              icon: "developer_board",
              key: "/technology-stack"
            },
            {
              title: "navigation.thanks.specialThanksTo",
              icon: "people",
              key: "/dev-team"
            }
          ]
        },
        {
          title: "navigation.support.title",
          items: [
            {
              title: "navigation.support.bugReport",
              icon: "bug_report",
              key: "",
              url: "https://github.com/ronggang/PT-Plugin-Plus/issues"
            },
            {
              title: "navigation.support.donate",
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
