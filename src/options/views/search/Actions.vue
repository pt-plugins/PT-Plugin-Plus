<template>
  <div style="display: inline-flex;">
    <v-btn
      flat
      icon
      small
      :class="$vuetify.breakpoint.mdAndUp? 'mx-0': 'mx-0 btn-mini'"
      color="grey darken-1"
    >
      <v-icon
        small
        @click="copyLinkToClipboard"
        :title="$t('searchTorrent.copyToClipboardTip')"
      >file_copy</v-icon>
    </v-btn>

    <!-- 下载到 -->
    <DownloadTo
      :downloadOptions="item"
      flat
      icon
      small
      :mini="$vuetify.breakpoint.smAndDown"
      class="mx-0"
      color="grey darken-1"
      @error="downloadError"
      @success="downloadSuccess"
    />

    <!-- 下载种子文件 -->
    <v-btn
      v-if="downloadMethod=='POST'"
      flat
      icon
      small
      :class="$vuetify.breakpoint.mdAndUp? 'mx-0': 'mx-0 btn-mini'"
      color="grey darken-1"
    >
      <v-icon @click.stop="saveTorrentFile" small :title="$t('searchTorrent.save')">get_app</v-icon>
    </v-btn>

    <v-btn
      v-else
      flat
      icon
      small
      :class="$vuetify.breakpoint.mdAndUp? 'mx-0': 'mx-0 btn-mini'"
      :href="url"
      target="_blank"
      rel="noopener noreferrer nofollow"
      :title="$t('searchTorrent.save')"
      color="grey darken-1"
    >
      <v-icon small>get_app</v-icon>
    </v-btn>

    <!-- 收藏 -->
    <v-btn
      v-if="!isCollectioned"
      flat
      icon
      small
      :class="$vuetify.breakpoint.mdAndUp? 'mx-0': 'mx-0 btn-mini'"
      color="grey darken-1"
      @click="addToCollection"
    >
      <v-icon small>favorite_border</v-icon>
    </v-btn>

    <v-btn
      v-else
      flat
      icon
      small
      :class="$vuetify.breakpoint.mdAndUp? 'mx-0': 'mx-0 btn-mini'"
      color="pink"
      @click="deleteCollection"
    >
      <v-icon small>favorite</v-icon>
    </v-btn>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import DownloadTo from "@/options/components/DownloadTo.vue";
export default Vue.extend({
  components: {
    DownloadTo
  },
  props: {
    url: String,
    downloadMethod: String,
    isCollectioned: Boolean,
    item: Object
  },
  methods: {
    copyLinkToClipboard() {
      this.$emit("copyLinkToClipboard");
    },
    showSiteContentMenus(event: any) {
      this.$emit("showSiteContentMenus", this.item, event);
    },
    saveTorrentFile() {
      this.$emit("saveTorrentFile", this.item);
    },
    addToCollection() {
      this.$emit("addToCollection", this.item);
    },
    deleteCollection() {
      this.$emit("deleteCollection", this.item);
    },
    downloadSuccess(msg: any) {
      this.$emit("downloadSuccess", msg);
    },
    downloadError(msg: any) {
      this.$emit("downloadError", msg);
    }
  }
});
</script>