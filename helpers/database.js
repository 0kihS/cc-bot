const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv');

async function fetchDataFromMongoDB() {
    const mongoURI = process.env.MONGODB_URI; // Your MongoDB URI
    const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    useNewUrlParser: true
  }
});

    try {
        console.log('downloading cards');
        await client.connect();
        const db = client.db('cardsdb');
        const collection = db.collection('cards');
        const data = await collection.find({}).toArray();
        return data;
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        return [];
    } finally {
        await client.close();
        console.log('Successfully downloaded cards!')
    }
}

const cards = fetchDataFromMongoDB();
module.exports = cards;