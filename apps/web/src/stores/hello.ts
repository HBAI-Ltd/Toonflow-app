import { ref } from "vue";
import { defineStore } from "pinia";

export const useHelloStore = defineStore("hello", () => {
  const completed = ref(false);

  function load() {
    try {
      completed.value = JSON.parse(localStorage.getItem("toonflow.hello") ?? "null")?.completed === true;
    } catch {
      completed.value = false;
    }
    return completed.value;
  }

  function complete() {
    localStorage.setItem("toonflow.hello", JSON.stringify({ completed: true }));
    completed.value = true;
  }

  function reset() {
    localStorage.removeItem("toonflow.hello");
    completed.value = false;
  }

  // ACT: 只由 localStorage 控制引导，不接入全局的后端持久化。
  load();
  return { completed, load, complete, reset };
});
