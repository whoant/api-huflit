require('dotenv').config()

const APIHuflit = require('./modules/huflit');


const API = new APIHuflit();

const info = {
    user: process.env.USER,
    pass: process.env.PASS
};



(async() => {
   
    try {
        await API.login(info);
        let schedule = await API.getAllMark();
        console.log(schedule)
    } catch (error) {
        console.log(error);
    }
     
})();

