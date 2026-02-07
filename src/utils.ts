import db from "@/utils/db";
import oss from "@/utils/oss";
import * as ai from "@/utils/ai";
import editImage from "@/utils/editImage";
import number2Chinese from "@/utils/number2Chinese";
import deleteOutline from "@/utils/deleteOutline";
import getConfig from "./utils/getConfig";
import { v4 as uuid } from "uuid";

export default {
  db,
  oss,
  ai,
  editImage,
  number2Chinese,
  deleteOutline,
  getConfig,
  uuid,
};
