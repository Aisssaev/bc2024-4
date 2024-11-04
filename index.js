const http = require('http');
const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');


program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-c, --cache <cache>', 'Шлях до кешу')
    .parse(process.argv);

const options = program.opts();

const server = http.createServer(async (req, res) => {
    const urlParts = req.url.split('/');
    const httpCode = urlParts[1];
    const imagePath = path.join(options.cache, `${httpCode}.jpg`);

    switch (req.method) {
        case 'GET':
            try {
                const image = await fs.readFile(imagePath);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(image);
            } catch (error) {

                try {
                    const response = await superagent.get(`https://http.cat/${httpCode}`);
                    const image = response.body;

                    await fs.writeFile(imagePath, image);

                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                } catch (err) {

                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not found');
                }
            }
            break;

        case 'PUT':
            try {

                const data = await new Promise((resolve, reject) => {
                    const chunks = [];
                    req.on('data', chunk => chunks.push(chunk));
                    req.on('end', () => resolve(Buffer.concat(chunks)));
                    req.on('error', reject);
                });

                if (data.length > 0) {

                    await fs.writeFile(imagePath, data);
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Image saved');
                } else {

                    const response = await superagent.get(`https://http.cat/${httpCode}`);
                    const image = response.body;


                    await fs.writeFile(imagePath, image);

                    res.writeHead(201, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                }
            } catch (error) {
                console.error('Error saving image:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error saving image');
            }
            break;
        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed');
            break;
    }
});


server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});

