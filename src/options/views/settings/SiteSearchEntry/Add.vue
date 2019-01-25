<template>
  <div>
    <v-dialog v-model="show" max-width="900">
      <v-card>
        <v-card-title class="headline blue-grey darken-2" style="color:white">{{ words.title }}</v-card-title>

        <v-card-text>
          <Editor :data="selected" :site="site"/>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn flat color="error" @click="cancel">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ words.cancel }}</span>
          </v-btn>
          <v-btn flat color="success" @click="save" :disabled="!selected.valid">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ words.ok }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Editor from "./Editor.vue";
import { ESearchResultType } from "@/interface/common";
export default Vue.extend({
  components: {
    Editor
  },
  data() {
    return {
      words: {
        title: "新增搜索入口",
        ok: "确认",
        cancel: "取消"
      },
      show: false,
      selected: { isCustom: true } as any,
      valid: false
    };
  },
  props: {
    value: Boolean,
    site: Object
  },
  model: {
    prop: "value",
    event: "change"
  },
  watch: {
    show() {
      this.$emit("change", this.show);
      if (!this.show) {
        this.selected = { isCustom: true };
      }
    },
    value() {
      this.show = this.value;
    }
  },
  methods: {
    save() {
      this.$emit(
        "save",
        Object.assign(
          { isCustom: true, resultType: ESearchResultType.HTML },
          this.selected
        )
      );
      this.show = false;
    },
    cancel() {
      this.show = false;
    }
  }
});
</script>
