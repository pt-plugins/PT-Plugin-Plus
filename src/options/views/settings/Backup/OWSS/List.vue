<template>
  <div>
    <v-list two-line dense>
      <template v-for="(item, index) in items">
        <v-divider v-if="index>0" :key="index"></v-divider>

        <v-list-tile :key="item.name">
          <v-list-tile-avatar>
            <v-icon class="grey lighten-1 white--text">bookmark</v-icon>
          </v-list-tile-avatar>

          <v-list-tile-content>
            <v-list-tile-title>{{ item.name }}</v-list-tile-title>
            <v-list-tile-sub-title>
              <div>
                <span>{{ item.time | formatDate }}</span>
                <span class="ml-2">{{ item.size | formatSize }}</span>
                <v-btn icon ripple small class="mr-0">
                  <v-icon color="info" small>cloud_download</v-icon>
                </v-btn>
                <v-btn icon ripple class="ml-0" small>
                  <v-icon color="red" small>delete</v-icon>
                </v-btn>
              </div>
            </v-list-tile-sub-title>
          </v-list-tile-content>

          <v-list-tile-action></v-list-tile-action>
        </v-list-tile>
      </template>
    </v-list>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    items: Array
  }
});
</script>