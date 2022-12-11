<template>
  <v-dialog v-model="show" fullscreen>
    <v-card>
      <v-toolbar dark color="blue-grey darken-2">
        <v-toolbar-title>{{
          $t("settings.sitePlugins.edit.title")
        }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          flat
          color="success"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/config-custom-plugin"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :title="$t('common.help')"
        >
          <v-icon>help</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="body">
        <Editor :initData="defaultItem" @change="change" />
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3 toolbar">
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="cancel">
          <v-icon>cancel</v-icon>
          <span class="ml-1">{{ $t("common.cancel") }}</span>
        </v-btn>
        <v-btn
          flat
          color="success"
          @click="save"
          :disabled="!valid || defaultItem.readonly"
        >
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ $t("common.ok") }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import Editor from "./Editor.vue";
export default Vue.extend({
  components: {
    Editor
  },
  data() {
    return {
      show: false,
      defaultItem: {},
      newData: {} as any,
      valid: false
    };
  },
  props: {
    value: Boolean,
    initData: Object
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
      if (this.show) {
        this.defaultItem = Object.assign({}, this.initData);
      }
    }
  },
  methods: {
    save() {
      this.$emit("save", this.newData);
      this.show = false;
    },
    cancel() {
      this.show = false;
    },
    change(options: any) {
      console.log(options);
      this.newData = options.data;
      this.valid = options.valid;
    }
  }
});
</script>
<style lang="scss" scoped>
.body {
  position: absolute;
  bottom: 65px;
  top: 65px;
  overflow-y: auto;
}
.toolbar {
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>