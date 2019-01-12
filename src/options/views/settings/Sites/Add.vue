<template>
  <div>
    <v-snackbar v-model="valid" top :timeout="3000" color="error">{{ words.validMsg }}</v-snackbar>
    <v-dialog v-model="show" max-width="800">
      <v-card>
        <v-card-title class="headline blue-grey darken-2" style="color:white">{{ words.title }}</v-card-title>

        <v-card-text>
          <v-stepper v-model="step">
            <v-stepper-header>
              <v-stepper-step :complete="step > 1" step="1">{{ words.step1 }}</v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="2">{{ words.step2 }}</v-stepper-step>
            </v-stepper-header>

            <v-stepper-items>
              <!-- 选择一个站点 -->
              <v-stepper-content step="1">
                <v-autocomplete
                  v-model="selectedSite"
                  :items="$store.getters.sites"
                  :label="words.validMsg"
                  :hint="selectedSiteDescription"
                  :filter="filterSite"
                  persistent-hint
                  return-object
                  single-line
                  item-text="name"
                  item-value="name"
                >
                  <template slot="selection" slot-scope="{ item }">
                    <v-list-tile-avatar>
                      <img :src="item.icon">
                    </v-list-tile-avatar>
                    <span v-text="item.name"></span>
                  </template>
                  <template slot="item" slot-scope="data" style>
                    <v-list-tile-avatar>
                      <img :src="data.item.icon">
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                      <v-list-tile-sub-title v-html="data.item.url"></v-list-tile-sub-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                      <v-list-tile-action-text>{{ joinTags(data.item.tags) }}</v-list-tile-action-text>
                    </v-list-tile-action>
                  </template>
                </v-autocomplete>
              </v-stepper-content>

              <!-- 站点配置 -->
              <v-stepper-content step="2">
                <SiteEditor :site="selectedSite" :custom="isCustom"/>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-btn
            flat
            color="grey darken-1"
            href="https://github.com/ronggang/PT-Plugin-Plus/tree/master/resource/sites"
            target="_blank"
            v-show="step==1"
            rel="noopener noreferrer nofollow"
          >
            <v-icon>help</v-icon>
            <span class="ml-1">{{ words.help }}</span>
          </v-btn>
          <v-btn flat @click="custom" v-show="step<stepCount">
            <v-icon>add_circle_outline</v-icon>
            <span class="ml-1">{{ words.custom }}</span>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn flat color="grey darken-1" @click="step--" :disabled="step===1">
            <v-icon>navigate_before</v-icon>
            <span>{{ words.prev }}</span>
          </v-btn>
          <v-btn flat color="blue" @click="next(step)" v-show="step<stepCount">
            <span>{{ words.next }}</span>
            <v-icon>navigate_next</v-icon>
          </v-btn>
          <v-btn
            flat
            color="success"
            @click="save"
            v-show="step===stepCount"
            :disabled="!selectedSite.valid"
          >
            <v-icon>check_circle_outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import { Site } from "@/interface/common";
import Vue from "vue";
import SiteEditor from "./Editor.vue";
export default Vue.extend({
  components: {
    SiteEditor
  },
  data() {
    return {
      words: {
        title: "新增站点",
        next: "下一步",
        prev: "上一步",
        help: "找不到想要的站点？来这里添加吧！",
        validMsg: "请选择一个站点（支持搜索）",
        custom: "自定义",
        step1: "选择站点",
        step2: "确认站点配置"
      },
      step: 1,
      show: false,
      stepCount: 2,
      selectedSite: {} as Site,
      valid: false,
      isCustom: false
    };
  },
  props: {
    value: Boolean
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    show() {
      this.$emit("change", this.show);
      if (!this.show) {
        this.step = 1;
        this.selectedSite = { name: "" };
      }
    },
    value() {
      this.show = this.value;
    }
  },
  methods: {
    save() {
      this.$emit("save", Object.assign({}, this.selectedSite));
      this.show = false;
    },
    next(step: number) {
      if (this.selectedSite && this.selectedSite.name) {
        this.valid = false;
        this.step++;
      } else {
        this.valid = true;
      }
    },
    custom() {
      this.isCustom = true;
      this.valid = false;
      this.step = 2;
    },
    joinTags(tags: any): string {
      if (tags && tags.join) {
        return tags.join(", ");
      }
      return "";
    },
    filterSite(item: Site, queryText: string, itemText: string):boolean {
      function hasValue(val: any): string {
        return val != null ? val : '';
      }

      // 支持在Site中host,name,url属性中搜索
      const text = hasValue(item.host) + hasValue(item.name) + hasValue(item.url);
      const query = hasValue(queryText);

      return text.toString().toLowerCase()
              .indexOf(query.toString().toLowerCase()) > -1;
    }
  },
  computed: {
    selectedSiteDescription(): string {
      let site = this.selectedSite;
      let description = "";
      if (site.description !== undefined) {
        description = "; " + site.description;
      }
      return (site.url ? site.url : "") + description;
    }
  },
  created() {}
});
</script>
