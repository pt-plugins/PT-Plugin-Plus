<template>
  <v-dialog v-model="show" max-width="800">
    <v-card>
      <v-card-title
        class="headline blue-grey darken-2"
        style="color:white"
      >{{ $t('settings.downloadPaths.edit.title') }}</v-card-title>

      <v-card-text>
        <v-form v-model="valid">
          <v-text-field
            :label="$t('settings.downloadPaths.edit.site')"
            disabled
            :value="defaultItem.name"
          ></v-text-field>
          <v-textarea
            v-model="defaultItem.paths"
            :label="$t('settings.downloadPaths.add.path')"
            value
            :hint="$t('settings.downloadPaths.add.pathTip')"
            :rules="rules.require"
          ></v-textarea>
          <v-alert :value="true" color="info" icon="info" outline v-if="client.pathDescription">
            <div v-html="client.pathDescription"></div>
            <KeyDescription/>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="cancel">
          <v-icon>cancel</v-icon>
          <span class="ml-1">{{ $t('settings.downloadPaths.add.cancel') }}</span>
        </v-btn>
        <v-btn flat color="success" @click="save" :disabled="!valid">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ $t('settings.downloadPaths.add.ok') }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import KeyDescription from "./KeyDescription.vue";

export default Vue.extend({
  components: {
    KeyDescription
  },
  data() {
    return {
      show: false,
      valid: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      defaultItem: {
        name: "",
        site: {},
        paths: ""
      }
    };
  },
  props: {
    value: Boolean,
    option: Object,
    client: Object
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
        this.defaultItem.paths = this.option.paths.join("\n");
      }
    }
  },
  methods: {
    save() {
      this.$emit("save", {
        site: this.defaultItem.site,
        paths: this.defaultItem.paths.split("\n")
      });
      this.show = false;
    },
    cancel() {
      this.show = false;
    }
  }
});
</script>
