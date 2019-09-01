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
                <span>{{ item.time | formatDate }}</span>
                <span class="ml-2">{{ item.size | formatSize }}</span>
                <v-btn icon ripple small class="mr-0" @click="onDownload(item)">
                  <v-icon color="info" small>cloud_download</v-icon>
                </v-btn>
                <v-btn icon ripple class="ml-0" small @click="onDelete(item)">
                  <v-icon color="red" small>delete</v-icon>
                </v-btn>
              </div>
            </v-list-tile-sub-title>
          </v-list-tile-content>

          <v-list-tile-action></v-list-tile-action>
        </v-list-tile>

        <v-divider v-if="index>0 && index<items.length-1" :key="index"></v-divider>
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
export default Vue.extend({
  props: {
    items: Array,
    loading: Boolean,
    server: Object
  },
  methods: {
    onDownload(item: any) {
      this.$emit("download", this.server, item);
    },

    onDelete(item: any) {
      this.$emit("delete", this.server, item);
    }
  }
});
</script>