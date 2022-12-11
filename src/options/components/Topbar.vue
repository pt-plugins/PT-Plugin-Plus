<template>
  <v-toolbar :color="baseColor" app fixed clipped-left id="system-topbar">
    <v-toolbar-side-icon
      @click.stop="drawer = !drawer"
      :title="$t('topbar.navBarTip')"
    ></v-toolbar-side-icon>
    <v-toolbar-title style="width: 220px" class="hidden-md-and-down">
      <span>{{ $t("topbar.title") }}</span>
    </v-toolbar-title>
    <SearchBox />
    <v-btn
      flat
      to="/search-torrent/__LatestTorrents__"
      class="grey--text text--darken-2 hidden-xs-only"
      :title="$t('topbar.showNewTorrentsTip')"
    >
      <v-icon>fiber_new</v-icon>
      <span class="ml-2 hidden-md-and-down">{{
        $t("topbar.showNewTorrents")
      }}</span>
    </v-btn>

    <v-spacer></v-spacer>
    <v-toolbar-items class="hidden-xs-only">
      <v-btn
        flat
        href="https://github.com/pt-plugins/PT-Plugin-Plus"
        target="_blank"
        class="grey--text text--darken-2"
        rel="noopener noreferrer nofollow"
        :title="$t('topbar.github')"
      >
        <v-icon>home</v-icon>
        <span class="ml-1">{{ $t("topbar.github") }}</span>
      </v-btn>
      <v-btn
        flat
        href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki"
        target="_blank"
        class="grey--text text--darken-2"
        :title="$t('topbar.help')"
        rel="noopener noreferrer nofollow"
      >
        <v-icon>help</v-icon>
        <span class="ml-1">{{ $t("topbar.help") }}</span>
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
        showNewTorrents: "浏览各站首页种子",
        showNewTorrentsTip: "根据当前方案，搜索各站的首页种子"
      },
      drawer: this.$store.state.options.navBarIsOpen,
      baseColor: "amber"
    };
  }
});
</script>
