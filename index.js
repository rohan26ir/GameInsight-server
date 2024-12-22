require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8c67l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  // await client.connect();
  console.log("Connected to MongoDB");

  const database = client.db('gameDB');
  const reviewCollection = database.collection('game');
  const watchlistCollection = database.collection('watchlist');

  // Fetch All Reviews (With Optional Sorting)
  app.get('/addReview', async (req, res) => {
    const { sortBy, order } = req.query;
    let sortCriteria = {};

    if (sortBy) {
      const orderValue = order === 'desc' ? -1 : 1;
      sortCriteria = { [sortBy]: orderValue };
    }

    const result = await reviewCollection.find().sort(sortCriteria).toArray();
    res.send(result);
  });

  // Add a Review
  app.post('/addReview', async (req, res) => {
    const newReview = req.body;
    const result = await reviewCollection.insertOne(newReview);
    res.send(result);
  });

  // Fetch My Reviews
  app.get('/myReviews', async (req, res) => {
    const userEmail = req.query.email;
    const result = await reviewCollection.find({ userEmail }).toArray();
    res.json(result);
  });

  // Update Review
  // Update Review
app.put('/updateReview/:id', async (req, res) => {
  const id = req.params.id;
  const updatedReview = req.body;

  try {
    const result = await reviewCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedReview }
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).send('Internal Server Error');
  }
});


  // Delete Review
  app.delete('/deleteReview/:id', async (req, res) => {
    const id = req.params.id;
    const result = await reviewCollection.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  });

  // Fetch Single Review by ID
  app.get('/review/:id', async (req, res) => {
    const reviewId = req.params.id;
    const result = await reviewCollection.findOne({ _id: new ObjectId(reviewId) });
    res.json(result);
  });

  // Get Highest Rated Games
  app.get('/highestRated', async (req, res) => {
    const result = await reviewCollection.find().sort({ rating: -1 }).limit(6).toArray();
    res.send(result);
  });

  // Add to Watchlist
  app.post('/addToWatchList', async (req, res) => {
    const watchItem = req.body;
    const existingItem = await watchlistCollection.findOne({
      reviewId: watchItem.reviewId,
      userEmail: watchItem.userEmail,
    });

    if (!existingItem) {
      const result = await watchlistCollection.insertOne(watchItem);
      res.json(result);
    } else {
      res.status(400).json({ message: 'Item already in watchlist' });
    }
  });

  // Get Watchlist by Email
  app.get('/watchlist', async (req, res) => {
    const { email } = req.query;
    const result = await watchlistCollection.find({ userEmail: email }).toArray();
    res.json(result);
  });
}
run().catch(console.dir);

// Default Route
app.get('/', (req, res) => {
  res.send('Game review server is running');
});

// Start Server
app.listen(port, () => {
  console.log(`Game review server is running on port: ${port}`);
});
