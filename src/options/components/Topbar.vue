<template>
  <v-toolbar :color="baseColor" app fixed clipped-left>
    <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
    <v-toolbar-title style="width: 220px;">
      <span>PT 助手</span>
    </v-toolbar-title>

    <v-text-field
      flat
      solo-inverted
      prepend-icon="search"
      label="搜索种子"
      class="hidden-sm-and-down mt-2"
      v-model="searchKey"
      @change="searchTorrent"
    ></v-text-field>

    <v-spacer></v-spacer>
    <v-toolbar-items>
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus"
        target="_blank"
        class="grey--text text--darken-2"
      >
        <v-icon>home</v-icon>
        <span class="ml-2">访问 Github</span>
      </v-btn>
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus/wiki"
        target="_blank"
        class="grey--text text--darken-2"
      >
        <v-icon>help</v-icon>
        <span class="ml-2">使用帮助</span>
      </v-btn>
    </v-toolbar-items>
  </v-toolbar>
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
      baseColor: "amber",
      searchKey: ""
    };
  },
  methods: {
    searchTorrent() {
      if (!this.searchKey) {
        return;
      }
      this.$router.push({
        name: "search-torrent",
        params: {
          key: this.searchKey
        }
      });
    }
  }
});
</script>
