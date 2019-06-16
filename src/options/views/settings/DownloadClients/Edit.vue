<template>
  <v-dialog v-model="show" max-width="800">
    <v-card>
      <v-card-title
        class="headline blue-grey darken-2"
        style="color:white"
      >{{ $t('settings.downloadClients.edit.title') }}</v-card-title>

      <v-card-text>
        <Editor :option="defaultItem"/>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="cancel">
          <v-icon>cancel</v-icon>
          <span class="ml-1">{{ $t('settings.downloadClients.edit.cancel') }}</span>
        </v-btn>
        <v-btn flat color="success" @click="save" :disabled="!defaultItem.valid">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ $t('settings.downloadClients.edit.ok') }}</span>
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
      defaultItem: {
        name: ""
      }
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
      if (this.show) {
        this.defaultItem = Object.assign({}, this.option);
      }
    }
  },
  methods: {
    save() {
      this.$emit("save", this.defaultItem);
      this.show = false;
    },
    cancel() {
      this.show = false;
    }
  }
});
</script>
