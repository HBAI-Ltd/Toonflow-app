interface Owned {
  manufacturer: string;
  model: string;
  grid: boolean;
  type: "t2i" | "ti2i" | "i2i";
}

const modelList: Owned[] = [
  // 火山引擎
  {
    manufacturer: "volcengine",
    model: "doubao-seedream-5-0-260128",
    grid: false,
    type: "ti2i",
  },
  {
    manufacturer: "volcengine",
    model: "doubao-seedream-4-5-251128",
    grid: false,
    type: "ti2i",
  },
  {
    manufacturer: "volcengine",
    model: "doubao-seedream-4-0-250828",
    grid: false,
    type: "ti2i",
  },
  //可灵
  {
    manufacturer: "kling",
    model: "kling-image-o1",
    grid: false,
    type: "ti2i",
  },
  //gemini
  {
    manufacturer: "gemini",
    model: "gemini-2.5-flash-image",
    grid: true,
    type: "ti2i",
  },
  {
    manufacturer: "gemini",
    model: "gemini-3-pro-image-preview",
    grid: true,
    type: "ti2i",
  },
  //Vidu
   {
    manufacturer: "vidu",
    model: "viduq1",
    grid: false,
    type: "i2i",
  },
  {
    manufacturer: "vidu",
    model: "viduq2",
    grid: false,
    type: "ti2i",
  },
  //RunningHub
  {
    manufacturer: "runninghub",
    model: "nanobanana",
    grid: true,
    type: "ti2i",
  },
  //ApiMart
  {
    manufacturer: "apimart",
    model: "nanobanana",
    grid: true,
    type: "ti2i",
  },
];

export default modelList;
