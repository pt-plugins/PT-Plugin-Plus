import "../interface/types.expand";
import PTPlugin from "./service";
import { filters } from "../service/filters";

const PTService = new PTPlugin();

// 暴露到 window 对象
Object.assign(window, {
  PTSevriceFilters: filters,
  PTBackgroundService: PTService
});
