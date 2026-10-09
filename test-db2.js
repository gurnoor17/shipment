const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).split('=')[1];

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const profiles = await db.collection('profiles').find().toArray();
  console.log("Profiles:", profiles.map(p => ({_id: p._id, userName: p.userName, userId: p.userId})));
  process.exit(0);
});
