import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Mobile: renders HTML to a real PDF using expo-print, then opens the native share sheet.
export async function exportHtmlToPdf(html, filename) {
    const { uri } = await Print.printToFileAsync({ html });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
    }
}
