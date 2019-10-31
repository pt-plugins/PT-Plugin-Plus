<template>
  <v-layout row wrap>
    <v-flex xs2 class="mt-1">
      <v-icon :size="10" :color="color" :title="statusTip">{{icon}}</v-icon>
    </v-flex>
    <v-flex xs10>
      <v-progress-linear
        style="margin-left: 1px;"
        :color="color"
        height="4"
        :value="progress"
        :title="`${progress}%`"
      ></v-progress-linear>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import Vue from "vue";
import { ETorrentStatus } from "@/interface/enum";

export default Vue.extend({
  props: {
    progress: Number,
    status: Number
  },
  mounted() {},
  computed: {
    color(): string {
      let result = "success";
      switch (this.status) {
        case ETorrentStatus.downloading:
          result = "info";
          break;

        case ETorrentStatus.completed:
        case ETorrentStatus.inactive:
          result = "grey";
          break;

        case ETorrentStatus.sending:
        default:
          break;
      }
      return result;
    },
    icon(): string {
      let result = "arrow_upward";
      switch (this.status) {
        case ETorrentStatus.downloading:
          result = "arrow_downward";
          break;

        case ETorrentStatus.completed:
          result = "done";
          break;

        case ETorrentStatus.inactive:
          result = "wifi_off";
          break;

        case ETorrentStatus.sending:
        default:
          break;
      }
      return result;
    },
    statusTip(): string {
      let result = this.$t("searchTorrent.torrentStatus.sending").toString();
      switch (this.status) {
        case ETorrentStatus.downloading:
          result = this.$t(
            "searchTorrent.torrentStatus.downloading"
          ).toString();
          break;

        case ETorrentStatus.completed:
          result = this.$t("searchTorrent.torrentStatus.completed").toString();
          break;

        case ETorrentStatus.inactive:
          result = this.$t("searchTorrent.torrentStatus.inactive").toString();
          break;

        case ETorrentStatus.sending:
        default:
          break;
      }
      return result;
    }
  }
});
</script>