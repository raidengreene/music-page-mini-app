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
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("music"); // Database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectDB();

//APIs
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'home-page.html'))
})


// Add albums
app.post('/api/albums', async (req, res) => {
  try {
    const { band, title, year } = req.body;
    
    // Simple validation
    if (!band || !title || !year) {
      return res.status(400).json({ error: 'Band, album title, and year are required' });
    }

    const album = { band, title, year: parseInt(year) };
    const result = await db.collection('albums').insertOne(album);
    
    res.status(201).json({ 
      message: 'Album created successfully',
      albumId: result.insertedId,
      album: { ...album, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create album: ' + error.message });
  }
});

// Load albums
app.get('/api/albums', async (req, res) => {
  try {
    const albums = await db.collection('albums').find({}).toArray();
    res.json(albums); // Return just the array for frontend simplicity
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch albums: ' + error.message });
  }
});

// UPDATE - Update a album by ID
app.put('/api/albums/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { band, title, year } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid album ID' });
    }

    const updateData = {};
    if (band) updateData.band = band;
    if (title) updateData.title = title;
    if (year) updateData.year = parseInt(year);

    const result = await db.collection('albums').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({ 
      message: 'Album updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update album: ' + error.message });
  }
});

// DELETE - Delete a album by ID
app.delete('/api/albums/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid album ID' });
    }

    const result = await db.collection('albums').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({ 
      message: 'Album deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete album: ' + error.message });
  }
});

// CLEANUP - Remove all albums
app.delete('/api/cleanup', async (req, res) => {
  try {
    const result = await db.collection('albums').deleteMany({});
    
    res.json({ 
      message: `Database cleaned successfully! Removed ${result.deletedCount} albums.`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup database: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Example app Listening on port ${PORT}`)
})