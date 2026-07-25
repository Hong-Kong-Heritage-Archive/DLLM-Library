// Helper function to detect if text contains CJK characters
export const containsCJK = (text: string): boolean => {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);
};
