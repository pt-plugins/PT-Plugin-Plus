import "../interface/types.expand";
import PTPlugin from "./service";
import { filters } from "../service/filters";

const PTService = new PTPlugin();

// 暴露到 window 对象
Object.assign(window, {
  PTServiceFilters: filters,
  PTBackgroundService: PTService,
  // 用于脚本中使用多语言环境
  i18n: PTService.i18n
});
