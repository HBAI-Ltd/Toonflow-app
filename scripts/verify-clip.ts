(async () => {
  const { getImageEmbedding, cosineSimilarity } = await import("@/utils/agent/imageEmbedding");
  const fg = (await import("fast-glob")).default;
  const imgs = await fg("data/oss/1782473895115/role/*.jpg");
  const e0 = await getImageEmbedding(imgs[0]);
  console.log("RESULT dim=" + e0.length + " self=" + cosineSimilarity(e0, await getImageEmbedding(imgs[0])).toFixed(4));
  process.exit(0);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});
