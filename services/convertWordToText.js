import mammoth from "mammoth";


const convertWordToText = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (err) {
    console.error("Word conversion error:", err.message);
    return "";
  }
};

export default convertWordToText;