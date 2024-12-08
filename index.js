require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8c67l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db('gameDB');
    const reviewCollection = database.collection('game');
    const watchlistCollection = database.collection('watchlist');


    // All Review and Sort
    app.get('/addReview', async (req, res) => {
      const { sortBy, order } = req.query;
      let sortCriteria = {};

      if (sortBy) {
        const orderValue = order === 'desc' ? -1 : 1;
        if (sortBy === 'rating') {
          sortCriteria = { rating: orderValue };
        } else if (sortBy === 'year') {
          sortCriteria = { year: orderValue };
        }
      }

      try {
        const cursor = reviewCollection.find().sort(sortCriteria);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.json({ messeage: error });
      }
    });


    app.post('/addReview', async (req, res) => {
      const newReview = req.body;
      console.log('Adding new review', newReview)

      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    // My Reviews
    app.get('/myReviews', async (req, res) => {
      const userEmail = req.query.email;

      if (!userEmail) {
        return res.json({ message: 'Email is required' });
      }

      try {
        const userReviews = await reviewCollection.find({ userEmail }).toArray();
        res.json(userReviews);
      } catch (error) {
        res.json({ message: 'Failed to fetch reviews', error });
      }
    });

    // Update Review
    const { ObjectId } = require('mongodb');

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
        res.json({ message: 'Failed to update review', error });
      }
    });

    // Delete Review
    app.delete('/deleteReview/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await reviewCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch (error) {
        res.json({ message: 'Failed to delete review', error });
      }
    });

    // ExploreDetails
    app.get('/review/:id', async (req, res) => {
      const reviewId = req.params.id;
      try {
        const review = await reviewCollection.findOne({ _id: new ObjectId(reviewId) });
        if (!review) {
          return res.json();
        }
        res.json(review);
      } catch (error) {
        res.json();
      }
    });


    // Highest Rated Games
    app.get('/highestRated', async (req, res) => {
      try {
        const cursor = reviewCollection.find().sort({ rating: -1 }).limit(6);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.json();
      }
    });

    // Add WatchList
    app.post('/addToWatchList', async (req, res) => {
      const watchItem = req.body;
      if (!watchItem.userEmail || !watchItem.reviewId) {
        return res.json();
      }

      try {
        const existingItem = await watchlistCollection.findOne({
          reviewId: watchItem.reviewId,
          userEmail: watchItem.userEmail,
        });

        if (existingItem) {
          return res.json({ message: 'Item already in watchlist' });
        }

        const result = await watchlistCollection.insertOne(watchItem);
        res.json(result);
      } catch (error) {
        res.json();
      }
    });

    // Get Watch list by Email
app.get('/watchlist', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.json();
  }

  try {
    const watchlist = await watchlistCollection.find({ userEmail: email }).toArray();
    res.json(watchlist);
  } catch (error) {
    res.json();
  }
});

    






  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('game review server is running')
})

app.listen(port, () => {
  console.log(`gaming server is running on port:s ${port}`);
})