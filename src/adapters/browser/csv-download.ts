import type { DownloadPort } from '../../ports';

export const browserDownload: DownloadPort = {
  download(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
