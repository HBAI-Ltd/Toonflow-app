import formCreate from "@form-create/element-ui";
import type { Rule } from "@form-create/element-ui";
import {
  ElForm, ElFormItem, ElRow, ElCol, ElInput, ElInputNumber, ElSwitch,
  ElSelect, ElOption, ElCheckbox, ElCheckboxGroup, ElRadio, ElRadioGroup,
} from "element-plus";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/row/style/css";
import "element-plus/es/components/col/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/input-number/style/css";
import "element-plus/es/components/switch/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/checkbox/style/css";
import "element-plus/es/components/checkbox-group/style/css";
import "element-plus/es/components/radio/style/css";
import "element-plus/es/components/radio-group/style/css";

for (const [name, component] of Object.entries({
  "el-form": ElForm, "el-form-item": ElFormItem, "el-row": ElRow, "el-col": ElCol,
  "el-input": ElInput, "el-input-number": ElInputNumber, "el-switch": ElSwitch,
  "el-select": ElSelect, "el-option": ElOption, "el-checkbox": ElCheckbox,
  "el-checkbox-group": ElCheckboxGroup, "el-radio": ElRadio, "el-radio-group": ElRadioGroup,
})) formCreate.component(name, component);

export function copyProviderRules(provider?: { id: string; rules?: readonly Record<string, unknown>[] }) {
  const rules = formCreate.copyRules([...(provider?.rules ?? [])] as Rule[]) as Rule[];
  for (const rule of rules) {
    if (!rule.field) continue;
    if (provider?.id === "apiMart" && rule.field === "isOverseas" && rule.type === "input") {
      // ACT: 只修复旧版地区字段，保留用户原有值和其余表单配置。
      rule.type = "select";
      rule.title = "请求地区";
      rule.value ??= "1";
      rule.options = [{ label: "国内", value: "1" }, { label: "海外", value: "2" }];
    }
    rule.effect = { ...rule.effect, required: rule.effect?.required ?? rule.required ?? true };
  }
  return rules;
}

export type { Api, Options, Rule } from "@form-create/element-ui";
export default formCreate;
