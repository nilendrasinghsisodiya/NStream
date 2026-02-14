import path from 'path';
import { fileURLToPath } from 'url';

export const getDir = (metaURL) => {
  if (!metaURL) return undefined;
  return path.dirname(fileURLToPath(metaURL));
};
