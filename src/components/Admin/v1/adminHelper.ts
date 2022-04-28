import pdf from 'html-pdf';

function createPDF(data: any, options: any, reportPath: string) {
    try {
        return new Promise((resolve, reject) => {
            pdf.create(data, options).toFile(reportPath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.filename);
                }
            });
        });
    } catch (error) {
        return error;
    }
}

export { createPDF };
