<template>
  <v-toolbar :color="baseColor" app fixed clipped-left>
    <v-toolbar-side-icon @click.stop="drawer = !drawer" :title="words.navBarTip"></v-toolbar-side-icon>
    <v-toolbar-title style="width: 220px;" class="hidden-sm-and-down">
      <span>{{ words.title }}</span>
    </v-toolbar-title>
    <SearchBox/>
    <v-btn
      flat
      to="/search-torrent/__LatestTorrents__"
      class="grey--text text--darken-2 hidden-sm-and-down"
    >
      <v-icon>fiber_new</v-icon>
      <span class="ml-2">{{ words.showNewTorrents }}</span>
    </v-btn>

    <v-spacer></v-spacer>
    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus"
        target="_blank"
        class="grey--text text--darken-2"
        rel="noopener noreferrer nofollow"
      >
        <v-icon>home</v-icon>
        <span class="ml-2">{{ words.github }}</span>
      </v-btn>
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus/wiki"
        target="_blank"
        class="grey--text text--darken-2"
        rel="noopener noreferrer nofollow"
      >
        <v-icon>help</v-icon>
        <span class="ml-2">{{ words.help }}</span>
      </v-btn>
    </v-toolbar-items>
  </v-toolbar>
</template>
<script lang="ts">
import Vue from "vue";
import SearchBox from "./SearchBox.vue";
export default Vue.extend({
  props: {
    value: Boolean
  },
  components: {
    SearchBox
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
      words: {
        title: "PT 助手",
        navBarTip: "点击显示/隐藏导航栏",
        help: "使用帮助",
        github: "访问 Github",
        showNewTorrents: "查看最新种子"
      },
      drawer: this.$store.state.options.navBarIsOpen,
      baseColor: "amber"
    };
  }
});
</script>
