const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/lol-check')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const WrChampion = mongoose.model('WrChampion', {
      name: String, 
      lang: String,
      title: String,
      roles: [String]
    });
    
    const totalChampions = await WrChampion.countDocuments({});
    console.log('Total champions:', totalChampions);
    
    const championsWithVi = await WrChampion.countDocuments({ lang: 'vi' });
    console.log('Champions with lang=vi:', championsWithVi);
    
    const championsWithoutLang = await WrChampion.countDocuments({ lang: { $exists: false } });
    console.log('Champions without lang field:', championsWithoutLang);
    
    const sampleChampions = await WrChampion.find({}).limit(3).select('name lang title');
    console.log('Sample champions:', JSON.stringify(sampleChampions, null, 2));
    
    mongoose.disconnect();
  })
  .catch(console.error); 