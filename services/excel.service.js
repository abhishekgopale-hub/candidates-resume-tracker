import ExcelJS from "exceljs";

export const generateExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");

  if (!data || data.length === 0) {
    worksheet.addRow(["No Data Found"]);
    return workbook;
  }

  // ✅ remove file_path column
  const columns = Object.keys(data[0])
    .filter((key) => key !== "file_path")
    .map((key) => ({
      header: key === "resume_link" ? "DOWNLOAD RESUME" : key.toUpperCase(),
      key: key,
      width: 25,
    }));

  worksheet.columns = columns;

  data.forEach((row) => {
    const newRow = { ...row };

    // ✅ ONLY show button if file_path exists
    if (row.file_path && row.resume_link) {
      newRow.resume_link = {
        text: "Download",
        hyperlink: row.resume_link,
      };
    } else {
      // ❌ no file → empty cell
      newRow.resume_link = "";
    }

    worksheet.addRow(newRow);
  });

  return workbook;
};