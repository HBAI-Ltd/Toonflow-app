import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { initializeAdministrator, isInitialized } from "../src/utils/accounts/service";

if (!process.env.TOONFLOW_DATA_DIR) throw new Error("请显式设置 TOONFLOW_DATA_DIR 为服务数据目录");
if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("管理员初始化需要交互式终端，密码不能通过参数或管道传入");
if (isInitialized()) throw new Error("管理员已经初始化；不会覆盖现有账户");

const input = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let username: string;
try { username = await input.question("管理员用户名（3-64 位英文、数字、下划线、点或连字符）："); }
finally { input.close(); }

const silent = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
const secretInput = createInterface({ input: process.stdin, output: silent, terminal: true });
secretInput.on("SIGINT", () => { secretInput.close(); process.exitCode = 130; });
try {
  process.stdout.write("管理员密码（15-128 个字符，输入隐藏）：");
  const password = await secretInput.question("");
  process.stdout.write("\n再次输入密码：");
  const confirmation = await secretInput.question("");
  process.stdout.write("\n");
  if (password !== confirmation) throw new Error("两次密码不一致，未创建管理员");
  const user = await initializeAdministrator(username, password);
  console.log(`管理员 ${user.username} 初始化完成。旧设置迁移归属账户：${user.id}`);
} finally { secretInput.close(); }
