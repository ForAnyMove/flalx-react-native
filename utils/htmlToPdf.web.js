// Web: direct file download via Blob URL — no print dialog, no preview.
// Requires the server to respond with Content-Type: application/pdf
// and Content-Disposition: attachment; filename="..."
export async function exportHtmlToPdf(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
