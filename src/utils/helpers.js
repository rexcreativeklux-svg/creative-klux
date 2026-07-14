// Max files limits
export const FILE_LIMITS = {
  image: 5 * 1024 * 1024, // 5 MB
  video: 50 * 1024 * 1024, // 50 MB
  audio: 10 * 1024 * 1024, // 10 MB
  document: 5 * 1024 * 1024, // 5 MB
};


// Helper to reliably categorize files by MIME type
export const getFileCategory = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  
  // Common document MIME types
  const docTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain" // .txt
  ];
  if (docTypes.includes(file.type)) return "document";
  
  return null; // Unsupported file type
};