<template>
  <div class="keyDescription">
    <span>路径中可包含以下关键字：</span>
    <table>
      <tr>
        <td>$site.name$</td>
        <td>将被替换为当前站点名称；
          <br>例：/volume1/$site.name$/music -> /volume1/OpenCD/music
        </td>
      </tr>
      <tr>
        <td>$site.host$</td>
        <td>将被替换为当前站点域名；
          <br>例：/volume1/$site.host$/music -> /volume1/open.cd/music
        </td>
      </tr>
      <tr>
        <td>&lt;...&gt;</td>
        <td>将会弹出输入框，由用户输入路径中 &lt;...&gt; 部分内容；
          <br>例：/volume1/&lt;...&gt; ，输入：test，结果 /volume1/test
        </td>
      </tr>
    </table>
  </div>
</template>
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