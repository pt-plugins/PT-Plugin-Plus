<template>
  <v-app id="inspire">
    <v-toolbar :color="baseColor" app fixed clipped-left id="system-topbar">
      <v-toolbar-title style="width: 220px" class="hidden-md-and-down">
        <span>Debugger Beta</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-xs-only">
        <v-btn
          flat
          href="https://github.com/pt-plugins/PT-Plugin-Plus/issues"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon>bug_report</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <v-container fluid class="debugger">
        <table>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td class="id">{{ index + 1 }}</td>
              <td class="time">{{ item.time }}</td>
              <td class="msg">
                <div>{{ item.msg }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </v-container>
    </v-content>
  </v-app>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      items: [] as any[],
      baseColor: "amber"
    };
  },

  methods: {
    add(msg: any) {
      this.items.push({
        time: new Date().toLocaleString(),
        msg: typeof msg === "string" ? msg : JSON.stringify(msg)
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.debugger {
  padding: 5px;

  table {
    width: 100%;
    td: {
      padding: 2px;
    }
  }

  table tbody tr:nth-child(even) {
    background-color: #f1f1f1;
  }

  table tbody tr:nth-child(odd) {
    background-color: #fff;
  }

  .time {
    color: #0044ff;
    width: 150px;
  }

  .id {
    width: 20px;
    text-align: center;
  }

  .msg {
    max-width: 70%;
    div {
      width: 100%;
      word-wrap: break-word;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
    }
  }
}
</style>