const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.Port || 5000

//middleware file  
app.use(cors())
app.use(express.json())

//jwt verify
const verifyJwt = (req , res , next) =>{
 const authorization =  req.headers.authorization
 if(!authorization){
     return res.status(401).send({error: true , message: 'unAuthorized access '})
 }

 //bearer token 
 const token = authorization.split(' ')[1];

 jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (error , decoded) => {
  if(error){
    return res.status(401).send({error: true , message: 'unAuthorized access '})
  }

  req.decoded = decoded
  next();
 })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

     const usersCollection = client.db("chinesFood").collection("users");
     const menuCollection = client.db("chinesFood").collection("menu");
     const reviewCollection = client.db("chinesFood").collection("reviews");
     const cartCollection = client.db("chinesFood").collection("carts");


     //jwt
     app.post('/jwt',(req,res)=>{
      const user = req.body
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' })
      res.send({token})
     })


     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    
     //user related api

     app.get('/users',verifyJwt,verifyAdmin,async(req,res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
     })

     app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
        console.log(existingUser)
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //security layer : JWT
    //email same
    //check admin
    app.get('/users/admin/:email',verifyJwt,async(req,res)=>{
      const email = req.params.email

      if(req.decoded.email !== email){
        res.send({admin : false})
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}

      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter,updateDoc)
      res.send(result)

    })


    app.delete('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })


     //menu related api
     app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray()
      res.send(result)
     })

     //menu added
     app.post('/menu',verifyJwt,verifyAdmin,async(req,res)=>{
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem);
      res.send(result)
     })

     //menu item deleted
     app.delete('/menu/:id', verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })

     //review related api
     app.get('/review',async(req,res)=>{
      const result = await reviewCollection.find().toArray()
      res.send(result)
     })


     //add to cart 
    
     app.get('/carts',verifyJwt, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
  
      const decodedEmail = req.decoded.email

      if(email !== decodedEmail){
        return res.status(403).send({error: true , message: 'Forbidden access '})
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

     app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
     client.db("admin").command({ ping: 1 });
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