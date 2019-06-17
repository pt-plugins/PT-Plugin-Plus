<template>
  <v-layout class="mt-3">
    <v-flex xs12 sm8 offset-sm2>
      <v-card>
        <v-img src="./assets/banner/default.jpg" aspect-ratio="2.75"></v-img>

        <v-card-title class="pb-1">
          <div v-if="!cancelled">
            <h3 class="title mb-2">{{ $t("permissions.title") }}</h3>
            <h3>{{ $t("permissions.subtitle") }}</h3>

            <v-data-table
              v-model="selected"
              :headers="headers"
              :items="items"
              item-key="key"
              select-all
              hide-actions
            >
              <template v-slot:items="props">
                <td>
                  <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
                </td>
                <td>{{ $t(props.item.title) }}</td>
                <td>
                  <v-switch
                    true-value="true"
                    false-value="false"
                    :input-value="props.item.enabled?'true':'false'"
                    hide-details
                    @click.stop="updatePermissions(props.item)"
                  ></v-switch>
                </td>
              </template>
            </v-data-table>
          </div>

          <div v-else class="title mb-2">{{ $t("permissions.cancelled") }}</div>
        </v-card-title>

        <v-card-actions v-if="!cancelled">
          <v-btn
            flat
            color="success"
            :disabled="selected.length==0"
            @click="authorize"
          >{{ $t("permissions.authorize") }}</v-btn>
          <v-btn flat color="orange" @click="cancel">{{ $t("permissions.cancel") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      permissions: [
        {
          key: "*://*/*",
          title: "permissions.details.allSites",
          isOrigin: true
        },
        { key: "tabs", title: "permissions.details.tabs" },
        { key: "downloads", title: "permissions.details.downloads" }
      ],
      selected: [] as any,
      cancelled: false,
      items: [] as any
    };
  },
  methods: {
    /**
     * 发起用户授权
     */
    authorize() {
      if (chrome && chrome.permissions) {
        let options = {
          permissions: [] as any,
          origins: [] as any
        };
        this.selected.forEach((item: any) => {
          if (item.isOrigin) {
            options.origins.push(item.key);
          } else {
            options.permissions.push(item.key);
          }
        });
        // 权限必须在用户操作下请求，例如按钮单击的事件处理函数。
        chrome.permissions.request(options, granted => {
          this.$emit("update", granted);
        });
      } else {
        this.$emit("update", true);
      }
    },
    cancel() {
      this.cancelled = true;
    },
    updatePermissions(item: any) {
      item.enabled = !(<boolean>item.enabled);
      let options = {};
      if (item.isOrigin) {
        options = {
          origins: [item.key]
        };
      } else {
        options = {
          permissions: [item.key]
        };
      }
      if (item.enabled) {
        chrome.permissions.request(options, granted => {
          item.enabled = granted;
        });
      } else {
        chrome.permissions.remove(options, granted => {
          item.enabled = !granted;
        });
      }

      console.log(item);
    }
  },
  created() {
    if (chrome && chrome.permissions) {
    } else {
      this.items = this.permissions;
      return;
    }
    this.permissions.forEach(item => {
      let options = {};
      if (item.isOrigin) {
        options = {
          origins: [item.key]
        };
      } else {
        options = {
          permissions: [item.key]
        };
      }
      // 查询当前权限
      chrome.permissions.contains(options, result => {
        this.items.push(Object.assign({ enabled: result }, item));
      });
    });
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("permissions.headers.title"),
          align: "left",
          sortable: false,
          value: "title"
        },
        {
          text: this.$t("permissions.headers.enabled"),
          align: "left",
          value: "enabled",
          sortable: false
        }
      ];
    }
  }
});
</script>
<style lang="scss" scoped>
.item {
  padding: 5px;
}

.logo {
  position: absolute;
  right: 20px;
  bottom: 60px;
  opacity: 0.5;
}
</style>
