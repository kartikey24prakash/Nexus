const pdfParse = require("pdf-parse");

async function parsePdf(buffer) {
    const data = await pdfParse(buffer);
    return {
        text: data.text,
        pages: data.numpages,
    };
}

module.exports = { parsePdf };