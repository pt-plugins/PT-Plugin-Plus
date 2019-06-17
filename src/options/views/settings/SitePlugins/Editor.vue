<template>
  <v-card class="mb-5" color="grey lighten-4">
    <v-card-text>
      <v-form v-model="data.valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="data.name"
          :label="$t('settings.sitePlugins.editor.name')"
          :placeholder="$t('settings.sitePlugins.editor.name')"
          required
          :rules="rules.require"
        ></v-text-field>

        <!-- 页面 -->
        <v-combobox
          v-model="data.pages"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.pagesTip')"
          :label="$t('settings.sitePlugins.editor.pages')"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 附加脚本文件 -->
        <v-combobox
          v-model="data.scripts"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.scriptsTip')"
          :label="$t('settings.sitePlugins.editor.scripts')"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 附加样式文件 -->
        <v-combobox
          v-model="data.styles"
          hide-selected
          :hint="$t('settings.sitePlugins.editor.stylesTip')"
          :label="$t('settings.sitePlugins.editor.styles')"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 脚本 -->
        <v-textarea
          v-model="data.script"
          :label="$t('settings.sitePlugins.editor.script')"
          required
          :rules="rules.require"
          height="200"
        ></v-textarea>

        <!-- 样式 -->
        <v-textarea
          v-model="data.style"
          :label="$t('settings.sitePlugins.editor.style')"
          height="200"
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
      }
    };
  },
  props: {
    data: {
      type: Object,
      default: () => ({
        valid: false
      })
    }
  },
  watch: {
    "data.script"() {
      console.log(
        JSON.stringify({
          script: this.data.script
        })
      );
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
