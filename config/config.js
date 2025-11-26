import dotenv from "dotenv";

dotenv.config();

export default {
  FIGMA_TOKEN: process.env.FIGMA_TOKEN,
  FILE_ID: process.env.FIGMA_FILE_ID
};