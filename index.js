const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.Port || 5000

//middleware file  
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ab4114m.mongodb.net/?retryWrites=true&w=majority`;

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
     client.connect();

     const menuCollection = client.db("chinesFood").collection("menu");
     const reviewCollection = client.db("chinesFood").collection("reviews");
     const cartCollection = client.db("chinesFood").collection("carts");

     app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray()
      res.send(result)
     })
     app.get('/review',async(req,res)=>{
      const result = await reviewCollection.find().toArray()
      res.send(result)
     })


     //add to cart 
    
     app.get('/carts', async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

     app.post('/carts',async(req,res)=>{
      const item = req.body;
      // console.log(item)
      const result = await cartCollection.insertOne(item)
      res.send(result)

     })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
  res.send('chines food is running')
})

app.listen(port,()=>{
  console.log(`chines food is running port${port}`)
})


/**
 * ------------------
 * Naming Convention
 * ------------------
 * user: userCollection
 * app.get(/user)
 * app.get(/user/:id)
 * app.post(/user)
 * app.patch('/user/:id')
 * app.put('/user/:id')
 * app.delete('/user/:id')
 */