const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://legov48519:CBRHRiycoWnHh8Ma@cluster0.tgq4vgk.mongodb.net/lol?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Available collections:');
    for (const col of collections) {
      try {
        const Model = mongoose.model(col.name + '_temp', {}, col.name);
        const count = await Model.countDocuments({});
        console.log(`  - ${col.name}: ${count} documents`);
        
        // Check if this collection has champion-like data
        if (count > 0 && count < 200) { // Only show sample for smaller collections
          const sample = await Model.findOne({});
          if (sample && (sample.name || sample.title)) {
            console.log(`    Sample from ${col.name}:`, JSON.stringify({
              name: sample.name,
              title: sample.title,
              lang: sample.lang,
              roles: sample.roles
            }, null, 2));
          }
        }
      } catch (error) {
        console.log(`  - ${col.name}: Error reading`);
      }
    }
    
    mongoose.disconnect();
  })
  .catch(console.error); 