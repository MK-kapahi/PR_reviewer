const bcrypt = require("bcrypt");

const creatingHashedPass = async (req, res) => {
    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(req.body.password, salt);
    console.log(`Hashed Password : ${hash}`);
    return hash;
};

module.exports = {creatingHashedPass}