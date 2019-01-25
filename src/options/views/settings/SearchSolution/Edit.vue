<template>
  <v-dialog v-model="show" max-width="800">
    <v-card>
      <v-card-title class="headline blue-grey darken-2" style="color:white">{{ words.title }}</v-card-title>

      <v-card-text>
        <Editor :option="defaultItem" :initSites="sites" @change="change"/>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="cancel">
          <v-icon>cancel</v-icon>
          <span class="ml-1">{{ words.cancel }}</span>
        </v-btn>
        <v-btn flat color="success" @click="save" :disabled="!valid">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ words.ok }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import Editor from "./Editor.vue";
import {
  SearchSolution,
  Site,
  SearchSolutionRange,
  SearchEntry
} from "@/interface/common";
export default Vue.extend({
  components: {
    Editor
  },
  data() {
    return {
      words: {
        title: "搜索方案定义",
        ok: "确认",
        cancel: "取消"
      },
      show: false,
      valid: false,
      sites: [] as Site[],
      defaultItem: {
        id: "",
        name: "",
        range: []
      } as SearchSolution,
      newValue: {} as SearchSolution
    };
  },
  props: {
    value: Boolean,
    option: Object
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    show() {
      this.$emit("change", this.show);
    },
    value() {
      this.show = this.value;
      if (this.show && this.option) {
        this.defaultItem = Object.assign({}, this.option);
      }
    },
    option() {
      console.log("option change", this.option);
      this.resetSites();
    }
  },
  methods: {
    save() {
      if (this.newValue) {
        this.$emit("save", this.newValue);
        this.resetSites();
      }
      this.show = false;
    },
    cancel() {
      this.show = false;
    },
    change(value: SearchSolution) {
      console.log(value);
      this.newValue = value;
      this.valid = !!value.name;
    },
    resetSites() {
      let options = Object.assign({}, this.$store.state.options);
      // this.sites = JSON.parse(JSON.stringify(options.sites)) as Site[];
      this.sites = [];
      options.sites.forEach((item: Site) => {
        this.sites.push(Object.assign({}, item));
      });

      console.log("resetSites", this.option, this.sites);
      if (this.option && this.option.id) {
        // this.valid = true;
        this.option.range.forEach((range: SearchSolutionRange) => {
          let index = this.sites.findIndex((item: any) => {
            return item.host === range.host;
          });

          if (index > -1) {
            let site: any = this.sites[index];
            site.enabled = true;
            let results: string[] = [];
            let siteEntry: SearchEntry[] = site.searchEntry;

            if (siteEntry) {
              siteEntry.forEach((v, index) => {
                siteEntry[index].enabled = false;
              });
              range.entry &&
                range.entry.forEach((key: string) => {
                  let index: number = siteEntry.findIndex(
                    (entry: SearchEntry) => {
                      return entry.id == key || entry.name == key;
                    }
                  );
                  if (siteEntry[index] && siteEntry[index].name) {
                    siteEntry[index].enabled = true;
                  }
                });
            }
          }
        });
      }
    }
  },
  created() {
    this.resetSites();
  }
});
</script>
