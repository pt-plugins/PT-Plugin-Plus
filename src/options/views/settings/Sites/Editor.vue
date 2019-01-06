<template>
  <v-card class="mb-5" color="grey lighten-4">
    <v-card-text>
      <v-form v-model="site.valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="site.name"
          :label="words.name"
          :placeholder="words.name"
          required
          :rules="rules.require"
        ></v-text-field>

        <!-- 标签 -->
        <v-combobox
          v-model="site.tags"
          hide-selected
          :hint="words.inputTags"
          :label="words.tags"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 当前架构 -->
        <v-text-field :value="getSchema" :label="words.schema" disabled v-if="!custom"></v-text-field>

        <!-- 当前架构(自定义时) -->
        <v-autocomplete
          v-model="site.schema"
          :items="$store.state.options.system.schemas"
          :label="words.schema"
          :menu-props="{maxHeight:'auto'}"
          persistent-hint
          single-line
          item-text="name"
          item-value="name"
          v-if="custom"
        >
          <template slot="selection" slot-scope="{ item }">
            <span v-text="item.name"></span>
          </template>
          <template slot="item" slot-scope="data" style>
            <v-list-tile-content>
              <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-list-tile-action-text>{{ data.item.ver }}</v-list-tile-action-text>
            </v-list-tile-action>
          </template>
        </v-autocomplete>

        <v-text-field
          v-model="site.passkey"
          :label="words.passkey"
          :placeholder="words.passkeyTip"
          :type="showPasskey ? 'text' : 'password'"
          :append-icon="showPasskey ? 'visibility_off' : 'visibility'"
          @click:append="showPasskey = !showPasskey"
          v-if="!site.securityKeys"
        ></v-text-field>

        <v-text-field
          v-else
          v-for="(value, key, index) in site.securityKeys"
          :key="index"
          :label="key"
          :type="showPasskey ? 'text' : 'password'"
          v-model="site.securityKeys[key]"
          :append-icon="showPasskey ? 'visibility_off' : 'visibility'"
          @click:append="showPasskey = !showPasskey"
        ></v-text-field>

        <v-text-field
          v-model="site.url"
          :label="words.url"
          :placeholder="words.urlTip"
          required
          :rules="rules.require"
          :disabled="!custom"
        ></v-text-field>
        <v-text-field v-model="site.description" :label="words.description"></v-text-field>

        <v-autocomplete
          v-model="site.defaultClientId"
          :items="this.$store.state.options.clients"
          :label="words.defaultClient"
          :menu-props="{maxHeight:'auto'}"
          persistent-hint
          item-text="name"
          item-value="id"
        >
          <template slot="selection" slot-scope="{ item }">
            <span v-text="item.name"></span>
          </template>
          <template slot="item" slot-scope="data" style>
            <v-list-tile-content>
              <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
              <v-list-tile-sub-title v-html="data.item.address"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-list-tile-action-text>{{ data.item.type }}</v-list-tile-action-text>
            </v-list-tile-action>
          </template>
        </v-autocomplete>

        <!-- 允许搜索 -->
        <v-switch :label="words.allowSearch" v-model="site.allowSearch"></v-switch>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import { Site } from "../../../../interface/common";
export default Vue.extend({
  data() {
    return {
      words: {
        defaultClient: "默认下载服务器",
        name: "站点名称",
        tags: "站点标签",
        inputTags: "标签输入完成后按回车添加，可添加多个",
        schema: "网站架构",
        description: "网站描述",
        host: "域名",
        url: "网站地址",
        urlTip: "网站完整地址，如：https://open.cd/",
        passkey: "密钥",
        passkeyTip: "密钥用于聚合搜索、生成下载链接等操作",
        allowSearch: "允许搜索"
      },
      showPasskey: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      }
    };
  },
  props: {
    site: Object,
    custom: Boolean
  },
  computed: {
    selectedTags(): string {
      let site = this.site;
      let tags = "";
      if (site.tags !== undefined) {
        tags = site.tags.join(",");
      }
      return tags;
    },
    getSchema(): string {
      let result: string = "";
      if (typeof this.site.schema === "string") {
        result = this.site.schema;
      } else if (this.site.schema && this.site.schema.name) {
        result = this.site.schema.name;
      }
      return result;
    }
  }
});
</script>
