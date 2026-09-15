import os
import re

files_to_update = [
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\jobsTabs\Done.jsx',
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\jobsTabs\InProgress.jsx',
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\jobsTabs\New.jsx',
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\storeTabs\Done.jsx',
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\storeTabs\InProgress.jsx',
    r'd:\Portfolio\React Native Flalx (electric)\flalx-react-native-app\FlalxRN\screens\mainScreens\storeTabs\Waiting.jsx',
]

import_str = "import { jobImages } from '../../../constants/jobImages';\n"

old_image_block = '''                    {hasImage ? (
                      <Image
                        source={{ uri: job.images[0] }}
                        style={styles.image}
                        resizeMode='cover'
                      />
                    ) : (
                      <View style={styles.placeholderImage}>'''

new_image_block = '''                    {hasImage ? (
                      <Image
                        source={{ uri: job.images[0] }}
                        style={styles.image}
                        resizeMode='cover'
                      />
                    ) : jobImages[job.subType?.key] || jobImages[job.type?.key] ? (
                      <Image
                        source={jobImages[job.subType?.key] || jobImages[job.type?.key]}
                        style={styles.image}
                        resizeMode='cover'
                      />
                    ) : (
                      <View style={styles.placeholderImage}>'''

for fpath in files_to_update:
    if not os.path.exists(fpath):
        print(f'File not found: {fpath}')
        continue
        
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'import { jobImages }' not in content:
        content = content.replace("} from 'react-native';", "} from 'react-native';\n" + import_str)
        
    if old_image_block in content:
        content = content.replace(old_image_block, new_image_block)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {fpath}')
    else:
        print(f'Block not found in {fpath}')
