const express = require('express')
const path = require('path')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');


const app = express()
const port = 3000

const basePath = path.join(__dirname, 'templates')


app.use(
  express.urlencoded({
    extended: true
  }))
app.use(express.json())

app.use(bodyParser.raw({ 
  type: 'audio/ogg', 
  limit: '50mb' 
}));

app.post('/convert-audio', async (req, res) => {
  try {
    const filename = uuidv4();
    const buffer = req.body; // O buffer de áudio deve vir no corpo da requisição

    // Escrever o arquivo de áudio original
    await fs.promises.writeFile(`${filename}.ogg`, buffer);

    const inputFile = `${filename}.ogg`;
    const outputFile = `${filename}_converted.ogg`;

    // Iniciar a conversão do áudio
    ffmpeg(inputFile)
      .audioCodec('libvorbis')
      .on('end', async () => {
        console.log('Conversão finalizada.');
        // Leia o arquivo de saída, converta para base64 e retorne
        try {
          const data = await fs.promises.readFile(outputFile, 'base64');
          // Remover os arquivos temporários
          await fs.promises.unlink(inputFile);
          await fs.promises.unlink(outputFile);
          // Enviar dados como base64
          return res.status(200).json({ base64: data });
        } catch (err) {
          console.error('Erro ao ler o arquivo:', err);
          return res.status(500).send('Erro ao ler o arquivo de saída');
        }
      })
      .on('error', (err) => {
        console.error('Erro ao converter:', err);
        res.status(500).send('Erro ao converter o arquivo');
      })
      .save(outputFile);
  } catch (err) {
    console.error('Erro ao salvar o arquivo de entrada:', err);
    res.status(500).send('Erro ao processar o arquivo de entrada');
  }
});


app.listen(port, () => {
  console.log(`App rodando em http://localhost:${port}`)
})

