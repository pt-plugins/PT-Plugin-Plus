<template>
  <v-card class="mb-5" :color="$vuetify.dark ? '' : 'grey lighten-4'">
    <v-card-text>
      <v-form v-model="valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="site.name"
          :label="$t('settings.sites.editor.name')"
          :placeholder="$t('settings.sites.editor.name')"
          required
          :rules="rules.require"
        ></v-text-field>

        <!-- 标签 -->
        <v-combobox
          v-model="site.tags"
          hide-selected
          :hint="$t('settings.sites.editor.inputTags')"
          :label="$t('settings.sites.editor.tags')"
          multiple
          persistent-hint
          small-chips
        ></v-combobox>

        <!-- 当前架构 -->
        <v-text-field
          :value="getSchema"
          :label="$t('settings.sites.editor.schema')"
          disabled
          v-if="!site.isCustom"
        ></v-text-field>

        <!-- 当前架构(自定义时) -->
        <v-autocomplete
          v-model="site.schema"
          :items="$store.state.options.system.schemas"
          :label="$t('settings.sites.editor.schema')"
          :menu-props="{maxHeight:'auto'}"
          persistent-hint
          single-line
          item-text="name"
          item-value="name"
          v-if="site.isCustom"
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
          :label="$t('settings.sites.editor.passkey')"
          :placeholder="$t('settings.sites.editor.passkeyTip')"
          :type="showPasskey ? 'text' : 'password'"
          :append-icon="showPasskey ? 'visibility_off' : 'visibility'"
          @click:append="showPasskey = !showPasskey"
          v-if="!site.securityKeys"
        ></v-text-field>

        <template v-else>
          <v-text-field
            v-for="(value, key, index) in site.securityKeys"
            :key="index"
            :label="key"
            :type="showPasskey ? 'text' : 'password'"
            v-model="site.securityKeys[key]"
            :append-icon="showPasskey ? 'visibility_off' : 'visibility'"
            @click:append="showPasskey = !showPasskey"
          ></v-text-field>
        </template>

        <v-text-field
          v-model="site.url"
          :label="$t('settings.sites.editor.url')"
          :placeholder="$t('settings.sites.editor.urlTip')"
          required
          :rules="[rules.url]"
          :disabled="!custom"
        ></v-text-field>

        <v-text-field
          v-model="site.priority"
          :label="$t('settings.sites.editor.priority')"
          :placeholder="$t('settings.sites.editor.priorityTip')"
          type="number"
        ></v-text-field>

        <v-textarea
          v-model="cdn"
          :label="$t('settings.sites.editor.cdn')"
          value
          :hint="$t('settings.sites.editor.cdnTip')"
        ></v-textarea>

        <!-- 时区 -->
        <v-autocomplete
          v-model="site.timezoneOffset"
          :items="timezone"
          :label="$t('settings.sites.editor.timezone')"
          persistent-hint
          item-text="text"
          item-value="value"
        ></v-autocomplete>

        <v-text-field v-model="site.description" :label="$t('settings.sites.editor.description')"></v-text-field>

        <v-autocomplete
          v-model="site.defaultClientId"
          :items="this.$store.state.options.clients"
          :label="$t('settings.sites.editor.defaultClient')"
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

        <v-text-field
                v-model="site.upLoadLimit"
                :label="$t('settings.sites.editor.upLoadLimit')"
                :placeholder="$t('settings.sites.editor.upLoadLimitTip')"
        ></v-text-field>
        <!-- 允许获取用户信息 -->
        <v-switch
          :label="$t('settings.sites.editor.allowGetUserInfo')"
          v-model="site.allowGetUserInfo"
          :disabled="site.offline"
        ></v-switch>

        <!-- 允许搜索 -->
        <v-switch v-model="site.allowSearch" :disabled="site.offline"
                  :label="$t('settings.sites.editor.allowSearch')"></v-switch>

        <!-- 搜索入口设置 v-if="site.allowSearch"  -->
        <template v-if="site.allowSearch">
          <v-container fluid class="ma-0 pa-0 ml-4">
            <v-layout row wrap class="ma-0 pa-0">
              <v-flex
                class="ma-0 pa-0"
                xs3
                v-for="(item, key, index) in site.searchEntry"
                :key="index"
              >
                <v-checkbox
                  :disabled="!site.allowSearch || site.offline"
                  class="ma-0 pa-0"
                  :label="item.name"
                  v-model="item.enabled"
                ></v-checkbox>
              </v-flex>
            </v-layout>
          </v-container>
        </template>

        <!-- 站点已离线（停机/关闭） -->
        <v-switch :label="$t('settings.sites.editor.offline')" v-model="site.offline"></v-switch>

        <!-- 消息提醒开关 -->
        <v-switch :label="$t('settings.sites.editor.disableMessageCount')" v-model="site.disableMessageCount"></v-switch>
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
      showPasskey: false,
      rules: {
        require: [(v: any) => !!v || "!"],
        url: (v: any) => {
          return (
            /^(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/.test(
              v
            ) || this.$t("settings.sites.editor.urlTip")
          );
        }
      },
      cdn: "",
      valid: false,
      site: {} as Site,
      timezone: [
        {
          value: "-1200",
          text: "(UTC -12:00) Enitwetok, Kwajalien"
        },
        {
          value: "-1100",
          text: "(UTC -11:00) Midway Island, Samoa"
        },
        {
          value: "-1000",
          text: "(UTC -10:00) Hawaii"
        },
        {
          value: "-0900",
          text: "(UTC -09:00) Alaska"
        },
        {
          value: "-0800",
          text: "(UTC -08:00) Pacific Time (US & Canada)"
        },
        {
          value: "-0700",
          text: "(UTC -07:00) Mountain Time (US & Canada)"
        },
        {
          value: "-0600",
          text: "(UTC -06:00) Central Time (US & Canada), Mexico City"
        },
        {
          value: "-0500",
          text: "(UTC -05:00) Eastern Time (US & Canada), Bogota, Lima"
        },
        {
          value: "-0400",
          text: "(UTC -04:00) Atlantic Time (Canada), Caracas, La Paz"
        },
        {
          value: "-0330",
          text: "(UTC -03:30) Newfoundland"
        },
        {
          value: "-0300",
          text: "(UTC -03:00) Brazil, Buenos Aires, Falkland Is."
        },
        {
          value: "-0200",
          text: "(UTC -02:00) Mid-Atlantic, Ascention Is., St Helena"
        },
        {
          value: "-0100",
          text: "(UTC -01:00) Azores, Cape Verde Islands"
        },
        {
          value: "+0000",
          text: "(UTC ±00:00) Casablanca, Dublin, London, Lisbon, Monrovia"
        },
        {
          value: "+0100",
          text: "(UTC +01:00) Brussels, Copenhagen, Madrid, Paris"
        },
        {
          value: "+0200",
          text: "(UTC +02:00) Sofia, Izrael, South Africa,"
        },
        {
          value: "+0300",
          text: "(UTC +03:00) Baghdad, Riyadh, Moscow, Nairobi"
        },
        {
          value: "+0330",
          text: "(UTC +03:30) Tehran"
        },
        {
          value: "+0400",
          text: "(UTC +04:00) Abu Dhabi, Baku, Muscat, Tbilisi"
        },
        {
          value: "+0430",
          text: "(UTC +04:30) Kabul"
        },
        {
          value: "+0500",
          text: "(UTC +05:00) Ekaterinburg, Karachi, Tashkent"
        },
        {
          value: "+0530",
          text: "(UTC +05:30) Bombay, Calcutta, Madras, New Delhi"
        },
        {
          value: "+0600",
          text: "(UTC +06:00) Almaty, Colomba, Dhakra"
        },
        {
          value: "+0700",
          text: "(UTC +07:00) Bangkok, Hanoi, Jakarta"
        },
        {
          value: "+0800",
          text: "(UTC +08:00) ShangHai, HongKong, Perth, Singapore, Taipei"
        },
        {
          value: "+0900",
          text: "(UTC +09:00) Osaka, Sapporo, Seoul, Tokyo, Yakutsk"
        },
        {
          value: "+0930",
          text: "(UTC +09:30) Adelaide, Darwin"
        },
        {
          value: "+1000",
          text: "(UTC +10:00) Melbourne, Papua New Guinea, Sydney"
        },
        {
          value: "+1100",
          text: "(UTC +11:00) Magadan, New Caledonia, Solomon Is."
        },
        {
          value: "+1200",
          text: "(UTC +12:00) Auckland, Fiji, Marshall Island"
        }
      ]
    };
  },
  props: {
    custom: Boolean,
    initData: {
      type: Object,
      default: () => ({
        valid: false
      })
    }
  },
  watch: {
    site: {
      handler() {
        if (this.site.cdn) {
          this.cdn = this.site.cdn.join("\n");
        } else {
          this.cdn = "";
        }
        this.$emit("change", {
          data: this.site,
          valid: this.valid
        });
      },
      deep: true
    },
    cdn() {
      let items = this.cdn.split("\n");
      let result: string[] = [];
      items.forEach(cdn => {
        if (
          /(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/.test(
            cdn
          )
        ) {
          result.push(cdn);
        }
      });

      if (result.length > 0) {
        this.site.activeURL = result[0];
      } else {
        this.site.activeURL = this.site.url;
      }

      this.site.cdn = result;
    },
    initData() {
      if (this.initData) {
        this.site = Object.assign({}, this.initData);
        this.valid = this.site.name && this.site.host ? true : false;
      }
    }
  },
  computed: {
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
