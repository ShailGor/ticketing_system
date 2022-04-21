import pdf from 'html-pdf';

function createPDF(data: any, options: any, reportPath: string) {
    pdf.create(data, options).toFile(reportPath, function (err, res) {
        if (err) return err;
    });
}

export { createPDF };
