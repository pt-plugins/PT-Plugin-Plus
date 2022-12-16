<template>
  <v-card class="mb-5" :color="$vuetify.dark ? '' : 'grey lighten-4'">
    <v-card-text>
      <v-form v-model="valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="option.name"
          :label="$t('settings.sitePlugins.editor.name')"
          :placeholder="$t('settings.sitePlugins.editor.name')"
          required
          :rules="rules.require"
          :disabled="option.readonly"
        ></v-text-field>

        <!-- 页面 -->
        <v-combobox
          v-model="option.pages"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.pagesTip')"
          :label="$t('settings.sitePlugins.editor.pages')"
          multiple
          persistent-hint
          small-chips
          :disabled="option.readonly"
        ></v-combobox>

        <!-- 附加脚本文件 -->
        <v-combobox
          v-model="option.scripts"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.scriptsTip')"
          :label="$t('settings.sitePlugins.editor.scripts')"
          multiple
          persistent-hint
          small-chips
          :disabled="option.readonly"
        ></v-combobox>

        <!-- 附加样式文件 -->
        <v-combobox
          v-model="option.styles"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.stylesTip')"
          :label="$t('settings.sitePlugins.editor.styles')"
          multiple
          persistent-hint
          small-chips
          :disabled="option.readonly"
        ></v-combobox>

        <!-- 脚本 -->
        <v-textarea
          v-model="option.script"
          :label="$t('settings.sitePlugins.editor.script')"
          height="200"
          :disabled="option.readonly"
        ></v-textarea>

        <!-- 样式 -->
        <v-textarea
          v-model="option.style"
          :label="$t('settings.sitePlugins.editor.style')"
          height="200"
          :disabled="option.readonly"
        ></v-textarea>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import { Site } from "@/interface/common";
export default Vue.extend({
  data() {
    return {
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      valid: false,
      option: {
        name: "",
        id: null,
        pages: [],
        scripts: [],
        styles: [],
        script: "",
        style: "",
        readonly: false
      }
    };
  },
  props: {
    initData: {
      type: Object,
      default: () => ({
        valid: false,
        readonly: false
      })
    }
  },
  watch: {
    option: {
      handler() {
        this.$emit("change", {
          data: this.option,
          valid: this.valid
        });
      },
      deep: true
    },
    initData() {
      if (this.initData) {
        this.option = Object.assign({}, this.initData);
      }
    }
  }
});
</script>

<style lang="scss">
.v-textarea {
  .v-text-field__slot {
    height: 100%;
    textarea {
      height: 100%;
    }
  }
}
</style>
