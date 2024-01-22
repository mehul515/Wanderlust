const mongoose = require("mongoose")
const initData = require("./data.js")
const Listing = require("../models/listing.js")
const URI = "mongodb://127.0.0.1:27017/WanderLust" 

async function main(){
    await mongoose.connect(URI)
}

main().then(()=>{
    console.log("Connected Successfully...")
}).catch((err) => {
    console.log(err)
})

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "65acfc479c2c818dbc45dbf2"}));
    await Listing.insertMany(initData.data);
    console.log("Data Initialized Successfully...");
}

initDB();