<template>
  <div>
    <v-progress-circular v-if="loading" indeterminate color="primary" class="ma-2" :width="3"></v-progress-circular>
    <v-list two-line dense v-if="items && items.length>0">
      <template v-for="(item, index) in items">
        <v-list-tile :key="item.name" v-if="item.type=='file'">
          <v-list-tile-avatar>
            <v-icon class="grey lighten-1 white--text">bookmark</v-icon>
          </v-list-tile-avatar>

          <v-list-tile-content>
            <v-list-tile-title>{{ item.name }}</v-list-tile-title>
            <v-list-tile-sub-title>
              <div>
                <span class="caption mr-2">
                  <span>{{ item.time | formatDate }}</span>
                  <span class="mx-2">{{ item.size | formatSize }}</span>
                </span>
                <!-- 恢复 -->
                <v-btn
                  icon
                  small
                  class="mx-0"
                  :loading="downloading && downloadingIndex==index"
                  @click="selectRestoreType(item, index, $event)"
                  :title="$t('settings.backup.restore')"
                >
                  <v-icon color="info" small>cloud_download</v-icon>
                </v-btn>

                <!-- 删除备份 -->
                <v-btn
                  icon
                  ripple
                  class="mx-0"
                  small
                  @click="onDelete(item, index)"
                  :title="$t('common.remove')"
                >
                  <v-icon color="red" small>delete</v-icon>
                </v-btn>
              </div>
            </v-list-tile-sub-title>
          </v-list-tile-content>

          <v-list-tile-action></v-list-tile-action>
        </v-list-tile>

        <v-divider :key="index"></v-divider>
      </template>
    </v-list>
    <v-list two-line dense v-else-if="!loading">
      <v-list-tile>
        <v-list-tile-content>{{ $t('settings.backup.server.list.noData') }}</v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { PPF } from "@/service/public";
import { ERestoreContent } from "@/interface/enum";
export default Vue.extend({
  data() {
    return {
      downloadingIndex: 0
    };
  },
  props: {
    items: Array,
    loading: Boolean,
    downloading: Boolean,
    server: Object
  },
  methods: {
    onDelete(item: any, index: number) {
      this.$emit("delete", this.server, item, index);
    },

    selectRestoreType(item: any, index: number, event: any) {
      this.downloadingIndex = index;

      let menus: any[] = [];

      menus.push({
        title: this.$t("settings.backup.restoreAll"),
        fn: () => {
          console.log(this.server);
          this.$emit("download", this.server, item, ERestoreContent.all);
        }
      });

      menus.push({});

      menus.push({
        title: this.$t("settings.backup.restoreCollection"),
        fn: () => {
          this.$emit("download", this.server, item, ERestoreContent.collection);
        }
      });

      if (PPF.checkOptionalPermission("cookies")) {
        menus.push({});

        menus.push({
          title: this.$t("settings.backup.restoreCookies"),
          fn: () => {
            this.$emit("download", this.server, item, ERestoreContent.cookies);
          }
        });
      }

      menus.push({});

      menus.push({
        title: this.$t("settings.backup.restoreSearchResultSnapshot"),
        fn: () => {
          this.$emit(
            "download",
            this.server,
            item,
            ERestoreContent.searchResultSnapshot
          );
        }
      });

      menus.push({});

      menus.push({
        title: this.$t("settings.backup.restoreKeepUploadTask"),
        fn: () => {
          this.$emit(
            "download",
            this.server,
            item,
            ERestoreContent.keepUploadTask
          );
        }
      });

      menus.push({});

      menus.push({
        title: this.$t("settings.backup.restoreDownloadHistory"),
        fn: () => {
          this.$emit(
            "download",
            this.server,
            item,
            ERestoreContent.downloadHistory
          );
        }
      });

      PPF.showContextMenu(menus, event);
    }
  }
});
</script>