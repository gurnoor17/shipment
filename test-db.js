const mongoose = require('mongoose');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).split('=')[1];

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const shipments = await db.collection('shipments').find().toArray();
  const users = await db.collection('users').find().toArray();
  console.log("Users:", users.map(u => ({_id: u._id, email: u.email})));
  console.log("Shipments:", shipments.map(s => ({_id: s._id, invoiceNo: s.invoiceNo, userId: s.userId})));
  process.exit(0);
});
