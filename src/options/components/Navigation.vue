<template>
  <!-- 导航栏 -->
  <v-navigation-drawer clipped fixed v-model="drawer" app width="220">
    <v-list v-for="(group, index) in navs" :key="index" dense>
      <v-subheader v-if="group.title" class="grey--text text--darken-1">{{
        $t(group.title)
      }}</v-subheader>
      <template v-for="(item, index) in group.items">
        <v-list-tile
          v-if="item.visible !== false"
          :to="item.key"
          :key="index"
          :href="item.url"
          :target="item.url ? '_blank' : ''"
          rel="noopener noreferrer nofollow"
        >
          <v-list-tile-action style="min-width: 42px;margin-left: 13px;">
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{ $t(item.title) }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    value: Boolean
  },
  data() {
    return {
      drawer: this.$store.state.options.navBarIsOpen
    };
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    drawer() {
      (this as any).$emit("change", this.drawer);
    },
    value() {
      this.drawer = this.value;
    }
  },
  computed: {
    navs() {
      return [
        {
          title: "navigation.dashboard.title",
          key: "group-",
          items: [
            {
              title: "navigation.dashboard.userData",
              icon: "dashboard",
              key: "/home"
            },
            {
              title: "navigation.dashboard.searchResults",
              icon: "search",
              key: "/search-torrent"
            },
            {
              title: "navigation.dashboard.searchResultSnapshot",
              icon: "add_a_photo",
              key: "/search-result-snapshot",
              visible: (this.$store as any).state.options.allowSaveSnapshot
            },
            {
              title: "navigation.dashboard.history",
              icon: "history",
              key: "/history",
              visible: (this.$store as any).state.options.saveDownloadHistory
            },
            {
              title: "navigation.dashboard.collection",
              icon: "favorite",
              key: "/collection"
            },
            {
              title: "navigation.dashboard.keepUploadTask",
              icon: "merge_type",
              key: "/keep-upload-task"
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
              key: "/set-permissions"
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
        }
      ];
    }
  }
});
</script>
