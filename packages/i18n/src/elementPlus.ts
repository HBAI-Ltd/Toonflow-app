import type { Locale } from "./index";
import zhCn from "./elementPlus/zhCn.json";
import zhTw from "./elementPlus/zhTw.json";
import en from "./elementPlus/en.json";
import ja from "./elementPlus/ja.json";
import ru from "./elementPlus/ru.json";
import vi from "./elementPlus/vi.json";
import th from "./elementPlus/th.json";
import ko from "./elementPlus/ko.json";
import hi from "./elementPlus/hi.json";
import id from "./elementPlus/id.json";
import ms from "./elementPlus/ms.json";
import fil from "./elementPlus/fil.json";
import bn from "./elementPlus/bn.json";
import ur from "./elementPlus/ur.json";
import ta from "./elementPlus/ta.json";
import te from "./elementPlus/te.json";
import mr from "./elementPlus/mr.json";
import pa from "./elementPlus/pa.json";
import ar from "./elementPlus/ar.json";
import fa from "./elementPlus/fa.json";
import tr from "./elementPlus/tr.json";
import pt from "./elementPlus/pt.json";

export const elementLocales = {
  "zh-CN": zhCn, "zh-TW": zhTw, en, ja, ru, vi, th, ko, hi, id, ms, fil, bn, ur, ta, te, mr, pa, ar, fa, tr, pt,
} satisfies Record<Locale, typeof en>;
