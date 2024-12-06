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


      app.get('/addReview', async (req, res) => {
          const cursor = reviewCollection.find();
          const result = await cursor.toArray();
          res.send(result);
      });


      app.post('/addReview', async (req, res) => {
        const newReview = req.body;
        console.log('Adding new review', newReview)

        const result = await reviewCollection.insertOne(newReview);
        res.send(result);
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