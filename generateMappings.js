const fs = require('fs');
const files = fs.readdirSync('d:/Portfolio/React Native Flalx (electric)/flalx-react-native-app/FlalxRN/assets/jobTypes');
const mapping = files.map(f => {
  const match = f.match(/^icons_\d+_(.+)\.png$/i);
  if (!match) return null;
  const key = match[1].toLowerCase().replace(/[-\s]/g, '_');
  return `  '${key}': require('../assets/jobTypes/${f}'),`;
}).filter(Boolean).join('\n');
fs.writeFileSync('d:/Portfolio/React Native Flalx (electric)/flalx-react-native-app/FlalxRN/constants/jobImages.js', `export const jobImages = {\n${mapping}\n};\n`, 'utf8');
