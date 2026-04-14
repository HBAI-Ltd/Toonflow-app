import express from "express";
import { success, error } from "@/lib/responseFormat";
import db from "@/utils/db";
import Ai from "@/utils/ai";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

async function verifyToonflowKey() {
  const mockMode = process.env.TOONFLOW_MOCK_AGENT_SET_KEY;

  if (mockMode === "success") {
    return { text: "[mock agentSetKey success]" };
  }

  if (mockMode === "failure") {
    throw new Error("mock invalid key");
  }

  return Ai.Text("toonflow:claude-haiku-4-5-20251001").invoke({
    prompt: "1+1等于几？请直接回答，不要解释。",
  });
}

export default router.post(
  "/",
  validateFields({
    key: z.string().optional(),
  }),
  async (req, res) => {
    const { key } = req.body;
    const vendorConfigData = await db("o_vendorConfig").where("id", "toonflow").first();

    if (!vendorConfigData) {
      return res.status(500).send(error("未找到该供应商配置"));
    }

    if (!vendorConfigData.inputValues) {
      return res.status(500).send(error("未找到模型配置数据"));
    }

    const inputValue = JSON.parse(vendorConfigData.inputValues) as Record<string, unknown>;
    inputValue.apiKey = key;

    await db("o_vendorConfig")
      .where("id", "toonflow")
      .update({
        inputValues: JSON.stringify(inputValue),
      });

    try {
      const resText = await verifyToonflowKey();

      if (!resText.text) {
        throw new Error("agentSetKey probe returned empty text");
      }

      await db("o_agentDeploy").where("key", "scriptAgent").update({
        model: "claude-sonnet-4-6",
        modelName: "toonflow:claude-sonnet-4-6",
        vendorId: "toonflow",
      });

      await db("o_agentDeploy").where("key", "productionAgent").update({
        model: "claude-sonnet-4-6",
        modelName: "toonflow:claude-sonnet-4-6",
        vendorId: "toonflow",
      });

      await db("o_agentDeploy").where("key", "universalAi").update({
        model: "claude-haiku-4-5",
        modelName: "toonflow:claude-haiku-4-5-20251001",
        vendorId: "toonflow",
      });

      res.status(200).send(success("一键填入成功"));
    } catch (err) {
      const shouldLogMockFailure = !(process.env.TOONFLOW_MOCK_AGENT_SET_KEY === "failure" && err instanceof Error && err.message === "mock invalid key");

      if (shouldLogMockFailure) {
        console.error(err);
      }

      inputValue.apiKey = "";

      await db("o_vendorConfig")
        .where("id", "toonflow")
        .update({ inputValues: JSON.stringify(inputValue) });

      res.status(400).send(error("KEY 无效，请重新输入"));
    }
  },
);
