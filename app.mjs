import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';


//constants
const app = express()
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

//APIs
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'home-page.html'))
  console.log("if you don't see home page then sendfile didn't work")
})



app.listen(PORT, () => {
  console.log(`Example app Listening on port ${PORT}`)
})