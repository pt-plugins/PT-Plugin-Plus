<template>
  <div class="keyDescription">
    <span>{{ $t('settings.downloadPaths.keyDescription.allowKeys') }}</span>
    <table>
      <tr>
        <td>$site.name$</td>
        <td>
          {{ $t('settings.downloadPaths.keyDescription.siteName') }}
          <br>
          {{ $t('settings.downloadPaths.keyDescription.example') }}/volume1/$site.name$/music -> /volume1/OpenCD/music
        </td>
      </tr>
      <tr>
        <td>$site.host$</td>
        <td>
          {{ $t('settings.downloadPaths.keyDescription.siteHost') }}
          <br>
          {{ $t('settings.downloadPaths.keyDescription.example') }}/volume1/$site.host$/music -> /volume1/open.cd/music
        </td>
      </tr>
      <tr>
        <td>&lt;...&gt;</td>
        <td>
          {{ $t('settings.downloadPaths.keyDescription.dynamic', {
          key: "&lt;...&gt;"
          }) }}
          <br>
          {{ $t('settings.downloadPaths.keyDescription.dynamicExample') }}
        </td>
      </tr>
    </table>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({});
</script>

<style lang="scss" scoped>
.keyDescription {
  padding-top: 10px;

  table tr td {
    padding: 3px;
  }
  table tr td:first-child {
    text-align: right;
    padding-right: 10px;
  }
}
</style>