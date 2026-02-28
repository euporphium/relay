function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.slice(dotIndex);
}

export function buildAttachmentUploadName(
  attachmentId: string,
  fileName: string,
) {
  return `${attachmentId}${getFileExtension(fileName)}`;
}
