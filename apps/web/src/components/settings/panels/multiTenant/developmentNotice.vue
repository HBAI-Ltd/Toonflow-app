<template>
  <div class="multiTenant">
    <section class="developmentNotice" aria-labelledby="developmentTitle">
      <div class="noticeContent">
        <icon-barrier-block :size="36" aria-hidden="true" />
        <h3 id="developmentTitle">正在开发</h3>
        <p>Toonflow 将在后续更新中推出多租户能力，敬请期待。</p>
      </div>
    </section>

    <section class="businessContact" aria-labelledby="businessTitle">
      <div class="contactInfo">
        <h3 id="businessTitle">商务合作</h3>
        <p>接受定制化功能开发或私有化部署，欢迎联系我们洽谈需求。</p>
        <p class="scanTip">微信扫码洽谈商务合作</p>
      </div>
      <div class="businessQr">
        <q-r-code
          value="https://work.weixin.qq.com/u/vc0f54596c5837d05a?v=5.0.8.70675"
          :size="168"
          type="svg"
          color="#000000"
          bgColor="#ffffff"
          borderless
          role="img"
          aria-label="Toonflow 商务合作二维码" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { QRCode } from "tdesign-vue-next";
</script>

<style lang="scss" scoped>
.multiTenant {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 4px 8px;

  .developmentNotice {
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-extra-light);

    .noticeContent {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 28px 20px;
      text-align: center;

      > svg {
        color: var(--el-text-color-secondary);
      }

      h3 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: 16px;
      }

      p {
        margin: 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
        line-height: 1.7;
      }
    }
  }

  .businessContact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    padding: 20px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    background: var(--el-bg-color);

    .contactInfo {
      flex: 1 1 220px;
      min-width: 0;

      h3 {
        margin: 0 0 10px;
        color: var(--el-text-color-primary);
        font-size: 14px;
      }

      p {
        margin: 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
        line-height: 1.7;
      }

      .scanTip {
        margin-top: 12px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }

    .businessQr {
      flex-shrink: 0;
      padding: 12px;
      border-radius: var(--el-border-radius-base);
      background: #ffffff;
    }

    @media (max-width: 700px) {
      padding: 12px;
    }
  }
}
</style>
