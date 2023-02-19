const mysql = require('mysql2')
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '6055302',
    database: 'portfolio'
})

module.exports = db