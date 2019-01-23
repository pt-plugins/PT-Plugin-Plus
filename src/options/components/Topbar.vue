<template>
  <v-toolbar :color="baseColor" app fixed clipped-left>
    <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
    <v-toolbar-title style="width: 220px;">
      <span>{{ words.title }}</span>
    </v-toolbar-title>

    <v-text-field
      flat
      solo-inverted
      prepend-icon="search"
      :label="words.searchTip"
      class="hidden-sm-and-down mt-2"
      v-model="searchKey"
      @change="searchTorrent"
    >
      <v-menu slot="append" offset-y class="search-solution">
        <v-btn slot="activator" flat small color="grey lighten-2">{{selectedSearchSolutionName}}</v-btn>
        <v-list dense>
          <v-list-tile @click="changeSearchSolution(null)">
            <v-list-tile-title>{{ words.default }}</v-list-tile-title>
          </v-list-tile>
          <v-divider></v-divider>
          <template
            v-if="$store.state.options.searchSolutions && $store.state.options.searchSolutions.length>0"
          >
            <v-list-tile
              @click="changeSearchSolution(item)"
              v-for="(item, index) in $store.state.options.searchSolutions"
              :key="index"
            >
              <v-list-tile-title>{{ item.name }}</v-list-tile-title>
            </v-list-tile>
          </template>
          <v-btn flat small v-else to="/set-search-solution">{{words.noSearchSolution}}</v-btn>
        </v-list>
      </v-menu>
    </v-text-field>

    <v-btn flat to="/search-torrent/__LatestTorrents__" class="grey--text text--darken-2">
      <v-icon>fiber_new</v-icon>
      <span class="ml-2">查看最新种子</span>
    </v-btn>

    <v-spacer></v-spacer>
    <v-toolbar-items>
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus"
        target="_blank"
        class="grey--text text--darken-2"
        rel="noopener noreferrer nofollow"
      >
        <v-icon>home</v-icon>
        <span class="ml-2">访问 Github</span>
      </v-btn>
      <v-btn
        flat
        href="https://github.com/ronggang/PT-Plugin-Plus/wiki"
        target="_blank"
        class="grey--text text--darken-2"
        rel="noopener noreferrer nofollow"
      >
        <v-icon>help</v-icon>
        <span class="ml-2">使用帮助</span>
      </v-btn>
    </v-toolbar-items>
  </v-toolbar>
</template>
<script lang="ts">
import Vue from "vue";
import { Site, SearchSolution, Options } from "@/interface/common";
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
      words: {
        title: "PT 助手",
        searchTip: "",
        default: "<默认>",
        noSearchSolution: "暂无方案，请添加"
      },
      drawer: true,
      baseColor: "amber",
      searchKey: "",
      options: this.$store.state.options as Options,
      selectedSearchSolutionName: ""
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
    },
    changeSearchSolution(solution?: SearchSolution) {
      let defaultSearchSolutionId = "";
      if (solution) {
        this.selectedSearchSolutionName = solution.name;
        defaultSearchSolutionId = solution.id;
      } else {
        this.selectedSearchSolutionName = this.words.default;
      }

      this.$store.dispatch("saveConfig", {
        defaultSearchSolutionId: defaultSearchSolutionId
      });
    }
  },
  created() {
    this.selectedSearchSolutionName = this.words.default;
    if (this.options.defaultSearchSolutionId && this.options.searchSolutions) {
      let searchSolution:
        | SearchSolution
        | undefined = this.options.searchSolutions.find(
        (item: SearchSolution) => {
          return item.id === this.options.defaultSearchSolutionId;
        }
      );

      if (searchSolution) {
        this.selectedSearchSolutionName = searchSolution.name;
      }
    }
    if (this.options.sites) {
      let count = 0;
      this.options.sites.forEach((item: Site) => {
        if (item.allowSearch) {
          count++;
        }
      });
      if (count > 0) {
        this.words.searchTip = `输入种子关键字，按回车进行搜索。`;
      } else {
        this.words.searchTip = "暂未配置允许搜索的站点，请先配置";
      }
    }
  }
});
</script>
<style lang="scss" scoped>
.search-solution {
  margin-right: -10px;
}
</style>
