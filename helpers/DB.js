const mongoose = require('mongoose');

module.exports = async ()=>{
    const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Ecommerce';
    await mongoose.connect(
        URI,
        { useNewUrlParser: true }
    ).then(()=> console.log('DB coonected'))
    .catch(err => console.error(err));
}