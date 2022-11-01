<template>
  <v-menu v-model="showMenu" offset-y nudge-right="32">
    <template v-slot:activator="{ on }">
      <v-text-field
        flat
        solo-inverted
        prepend-icon="search"
        type="search"
        @click:prepend="searchTorrent()"
        :label="$t('searchBox.searchTip')"
        class="mt-2 mb-0"
        v-model="searchKey"
        clearable
        @click.stop="showSelectBox"
        @click:clear="clearSearchKey"
        :loading="loadStatus"
        enterkeyhint="search"
        v-on:keyup.enter="searchTorrent()"
      >
        <!-- 近期热门 -->
        <v-menu
          slot="prepend-inner"
          offset-y
          class="top-searches"
          nudge-bottom="8"
          nudge-left="12"
        >
          <v-btn slot="activator" flat small color="grey lighten-2">{{
            $t("common.hot")
          }}</v-btn>

          <div
            :style="
              ($vuetify.breakpoint.smAndUp ? 'width: 550px' : 'width: 300px') +
              ';background-color: #fff;'
            "
          >
            <v-container fluid grid-list-lg class="pa-3">
              <div v-if="topSearches.length == 0"> {{ $t('common.loading') }} </div>
              <v-layout  v-else row wrap>
                <v-flex v-for="(item, index) in topSearches" :key="index" xs4>
                  <v-card
                    @click="searchHotItem(item)"
                    style="cursor: pointer"
                    :title="$t('searchBox.searchThisKey', { key: item.title })"
                  >
                    <v-img
                      :src="item.image"
                      :height="$vuetify.breakpoint.smAndUp ? '230px' : '110px'"
                    >
                      <div class="top-searches-item px-1">
                        <div>
                          <span class="caption">{{ item.title }}</span>
                          <span
                            v-if="$vuetify.breakpoint.smAndUp"
                            class="caption ml-2 grey--text"
                            >({{ item.year }})</span
                          >

                          <!-- 评分，点击可前往豆瓣页面 -->
                          <a
                            v-if="item.doubanRating"
                            class="caption orange--text rating"
                            :href="item.link"
                            rel="noopener noreferrer nofollow"
                            target="_blank"
                            :title="$t('searchBox.toDouban')"
                            @click.stop
                            >{{ parseFloat(item.doubanRating).toFixed(1) }}</a
                          >
                        </div>
                        <div
                          v-if="$vuetify.breakpoint.smAndUp"
                          class="caption grey--text alt-title"
                        >
                          {{ item.alt_title }}
                        </div>
                      </div>
                    </v-img>
                  </v-card>
                </v-flex>
              </v-layout>
            </v-container>
            <v-divider></v-divider>

            <div class="pa-1 top-searches text-sm-right">
              <v-btn
                flat
                small
                class="caption grey--text"
                :title="$t('common.refresh')"
                @click.stop="getTopSearches"
                :loading="topSearchesLoading"
              >
                <v-icon style="font-size: 20px">update</v-icon>
                <span class="ml-2">{{
                  $t("common.lastUpdate", { time: topSearchesUpdateTime })
                }}</span>
              </v-btn>
            </div>
          </div>
        </v-menu>

        <!-- 搜索方案 -->
        <v-menu slot="append" offset-y class="search-solution">
          <v-btn slot="activator" flat small color="grey lighten-2">{{
            selectedSearchSolutionName
          }}</v-btn>
          <v-list dense>
            <v-list-tile
              @click="changeSearchSolution(null)"
              :title="$t('searchBox.defaultTip')"
            >
              <v-list-tile-title>{{
                $t("searchBox.default")
              }}</v-list-tile-title>
            </v-list-tile>
            <v-divider></v-divider>
            <template
              v-if="
                $store.state.options.searchSolutions &&
                $store.state.options.searchSolutions.length > 0
              "
            >
              <v-list-tile
                @click="changeSearchSolution(item)"
                v-for="(item, index) in $store.state.options.searchSolutions"
                :key="index"
              >
                <v-list-tile-title>{{ item.name }}</v-list-tile-title>
              </v-list-tile>
            </template>
            <v-btn flat small v-else to="/set-search-solution">{{
              $t("searchBox.noSearchSolution")
            }}</v-btn>

            <v-divider></v-divider>
            <v-list-tile @click="changeSearchSolution(allSite)">
              <v-list-tile-title>{{ $t("searchBox.all") }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </v-text-field>
    </template>
    <!-- 预选结果 -->
    <div>
      <!-- 直接关键字跳转 -->
      <v-list class="pb-0">
        <v-list-tile @click.stop="itemClick(null)">
          <v-list-tile-content>
            <v-list-tile-title>
              <v-icon>search</v-icon>
              <span class="title ml-1">{{
                $t("searchBox.searchThisKey", { key: this.searchKey })
              }}</span>
            </v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-icon>forward</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider v-if="!isLoading"></v-divider>
        <v-progress-linear
          :indeterminate="true"
          v-else
          color="secondary"
          height="2"
        ></v-progress-linear>
      </v-list>

      <!-- 预选列表 -->
      <v-list three-line class="py-0">
        <template v-for="(item, index) in items">
          <v-list-tile
            :key="index"
            @click.stop="itemClick(item)"
            :title="$t('searchBox.searchThisKey', { key: item.title })"
          >
            <v-list-tile-avatar class="album" :size="75">
              <img
                :src="
                  item.image || item.img ||
                  (item.images
                    ? item.images.small
                    : item.pic
                    ? item.pic.normal
                    : '')
                "
              />
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title class="mb-1">
                <span class="title">{{ item.title }}</span>
                <span class="ml-1 caption">({{ item.year }})</span>
              </v-list-tile-title>
              <v-list-tile-sub-title>
                <div>
                  {{
                    item.aka || item.originalTitle || item.original_title || ""
                  }}
                </div>
                <div class="caption">
                  {{ item.genre || (item.genres && item.genres.join(" | ")) }}
                </div>
              </v-list-tile-sub-title>
            </v-list-tile-content>

            <v-list-tile-action style="align-items: center">
              <a
                class="grey--text text--darken-1 mt-3 title"
                style="text-decoration: none"
                :href="item.link || item.alt || item.url"
                rel="noopener noreferrer nofollow"
                target="_blank"
                :title="$t('searchBox.toDouban')"
                @click.stop
              >
                <img src="https://img3.doubanio.com/favicon.ico" width="16" />
                {{
                  parseFloat(
                    item.average ?item.average : item.rating? (item.rating.average || item.rating.value) : null
                  ).toFixed(1)
                }}
              </a>
              <v-rating
                :value="
                  item.average
                    ? parseFloat(item.average) / 2
                    : item.rating? (item.rating.stars
                    ? parseInt(item.rating.stars) / 10
                    : item.rating.star_count): 0
                "
                background-color="grey lighten-2"
                color="yellow accent-4"
                dense
                readonly
                half-increments
                size="13"
                class="mb-3"
              ></v-rating>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider :key="'l' + index"></v-divider>
        </template>
      </v-list>
      <v-list class="py-0">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="grey--text text--darken-1 caption">{{
              $t("searchBox.doubanTip")
            }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </div>
  </v-menu>
</template>
<script lang="ts">
import Vue from "vue";
import {
  SearchSolution,
  Options,
  Site,
  EBeforeSearchingItemSearchMode,
  EAction,
} from "@/interface/common";

import Extension from "@/service/extension";
import dayjs from "dayjs";

const extension = new Extension();

export default Vue.extend({
  data() {
    return {
      isLoading: false,
      items: [] as any[],
      selected: {} as any,
      timer: null as any,
      showMenu: false,
      searchKey: "",
      options: this.$store.state.options as Options,
      selectedSearchSolutionName: "",
      allSite: {
        id: "all",
        name: "<所有站点>",
      },
      initialized: false,
      topSearches: [] as any[],
      topSearchesUpdateTime: "N/A" as any,
      topSearchesLoading: false,
    };
  },

  methods: {
    searchHotItem(item: any) {
      console.log(item);
      let key =
        item.imdbId || `douban${item.doubanId}|${item.title}|${item.alt_title}`;

      this.searchTorrent(key);
    },

    itemClick(item: any) {
      console.log(item);
      let key = this.searchKey;
      let searchMode = this.options.beforeSearchingOptions
        ? this.options.beforeSearchingOptions.searchModeForItem
        : EBeforeSearchingItemSearchMode.id;
      switch (searchMode) {
        case EBeforeSearchingItemSearchMode.id:
          if (item && item.id) {
            key = `douban${item.id}|${item.title}|${item.originalTitle || item.aka || item.original_title}|${key}`;
          }
          break;

        case EBeforeSearchingItemSearchMode.name:
          if (item && item.title) {
            key = item.title;
          }
          break;
      }

      this.searchTorrent(key);
    },
    showSelectBox() {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      if (this.items.length > 0) {
        this.showMenu = true;
      } else if (this.searchKey) {
        this.timer = setTimeout(() => {
          this.getDoubanInfos(this.searchKey);
        }, 750);
      }
    },
    /**
     * 从豆瓣获取相关信息
     */
    getDoubanInfos(key: string) {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      if (this.isLoading || !key) return;

      this.isLoading = true;
      this.items = [];

      // 本地调试时
      if (window.location.hostname == "localhost") {
        $.ajax("http://localhost:8001/test/beforeSearching.json")
          .done((result) => {
            console.log(result);
            if (result && result.subjects) {
              this.items = result.subjects;
              this.isLoading = false;
              this.showMenu = true;
            }
          })
          .fail((err) => {
            console.log(err);
          })
          .always(() => (this.isLoading = false));
        return;
      }

      extension
        .sendRequest(EAction.queryMovieInfoFromDouban, null, {
          key,
          count: this.$store.state.options.beforeSearchingOptions
            .maxMovieInformationCount,
        })
        .then((result) => {
          this.isLoading = false;
          if (result) {
            if (result.subjects) {
              // issue 615: frodo 接口不止返回电影类型，而模板只考虑了电影类型的展示，把其他都筛掉
              this.items = result.subjects.filter((x: { type: string; }) => x.type == 'movie');
              this.showMenu = this.items.length > 0;
            } else if (result.title && result.updateTime) {
              this.items = [result];
              this.showMenu = true;
            }
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    searchTorrent(key?: string) {
      key = key || this.searchKey;
      if (!key) {
        return;
      }

      this.showMenu = false;
      clearTimeout(this.timer);

      this.$store.dispatch("saveConfig", {
        lastSearchKey: this.searchKey,
      });

      this.$router.push({
        name: "search-torrent",
        params: {
          key: key,
        },
      });
    },
    changeSearchSolution(solution?: SearchSolution) {
      let defaultSearchSolutionId = "";
      if (solution) {
        this.selectedSearchSolutionName = solution.name;
        defaultSearchSolutionId = solution.id;
      } else {
        this.selectedSearchSolutionName = this.$t(
          "searchBox.default"
        ).toString();
      }

      this.$store.dispatch("saveConfig", {
        defaultSearchSolutionId: defaultSearchSolutionId,
      });
    },
    clearSearchKey() {
      this.$store.dispatch("saveConfig", {
        lastSearchKey: "",
      });
    },
    getTopSearches() {
      this.topSearchesLoading = true;
      extension
        .sendRequest(EAction.getTopSearches)
        .then((result) => {
          this.topSearches = result;
          this.topSearchesUpdateTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          this.topSearchesLoading = false;
        });
    },
  },
  watch: {
    /**
     * 当搜索关键字变更时，尝试从豆瓣获取相关信息
     */
    searchKey() {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      clearTimeout(this.timer);
      if (!this.initialized) return;
      if (!this.searchKey) {
        this.showMenu = false;
        return;
      }

      this.timer = setTimeout(() => {
        this.getDoubanInfos(this.searchKey);
      }, 750);
    },
    /**
     * 监控最后的搜索关键字，前显示当前搜索框
     */
    "$store.state.options.lastSearchKey"() {
      if (this.searchKey != this.$store.state.options.lastSearchKey) {
        console.log("key change: %s", this.$store.state.options.lastSearchKey);
        this.searchKey = this.$store.state.options.lastSearchKey;
        if (this.searchKey) {
          this.isLoading = true;
          this.items = [];
          setTimeout(() => {
            this.isLoading = false;
          }, 1000);
        }
      }
    },
  },
  created() {
    this.selectedSearchSolutionName = this.$t("searchBox.default").toString();
    if (this.options.defaultSearchSolutionId == this.allSite.id) {
      this.selectedSearchSolutionName = this.allSite.name;
    } else if (
      this.options.defaultSearchSolutionId &&
      this.options.searchSolutions
    ) {
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
    }
    if (this.options.search && this.options.search.saveKey) {
      this.searchKey = this.options.lastSearchKey || "";
    }
    this.getTopSearches();
    // 防止初始化时进行信息获取
    setTimeout(() => {
      this.initialized = true;
    }, 500);
  },
  computed: {
    loadStatus(): boolean {
      if (this.$store && this.$store.state) {
        return this.$store.state.searching || this.isLoading;
      } else {
        return this.isLoading;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.search-solution {
  margin-right: -10px;
}

.album {
  img {
    margin-top: 18px;
    border-radius: 0px;
    margin-right: 10px;
  }
}

.top-searches {
  button {
    min-width: unset;
    margin: 0;
  }
}

.top-searches-item {
  position: absolute;
  bottom: 0px;
  width: 100%;
  max-height: 50px;
  background-color: #fff;
  opacity: 0.85;
  padding: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .alt-title {
    display: inline;
  }

  .rating {
    position: absolute;
    text-decoration: none;
    right: 0px;
    background-color: #fff;
    padding: 1px 3px;
  }
}
</style>
