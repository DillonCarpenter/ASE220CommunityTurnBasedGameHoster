const bcrypt = require('bcrypt');
const saltRounds = 10; // Leaving it as 10 for simplicity
bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
        // Handle error
        return;
    }
    // Salt generation successful, proceed to hash the password
    });
const userPassword = 'user_password'; // Replace with the actual password
bcrypt.hash(userPassword, salt, (err, hash) => {
    if (err) {
        // Handle error
        return;
    }

// Hashing successful, 'hash' contains the hashed password
console.log('Hashed password:', hash);
});