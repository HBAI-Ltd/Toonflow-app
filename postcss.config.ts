import pxtorem from "postcss-pxtorem";

export default {
  plugins: [pxtorem({
    rootValue: 16,
    propList: ["*font*", "*line-height*", "letter-spacing", "word-spacing"],
    exclude: () => false,
  })],
};
