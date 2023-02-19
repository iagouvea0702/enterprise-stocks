const express = require('express')
const db = require('../db/db.js')
const router = express.Router()
const sendMail = require('../public/js/mail.js')
const  HTML_TEMPLATE = require("../public/js/mail-template.js");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.post('/register', (req, res) =>{
    const name = req.body.name
    const email = req.body.email
    const username = req.body.username

    const caracters = [
        ['abcdefghijklmnopqrstuvwxyz'],
        ['ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
        ['0123456789'],
        ['@#/_$&%!']
    ]

    var temppass = ''

    for(let i = 0; i < 12; i++){
        let char = caracters[Math.floor(Math.random(1, 10) * 4)].toString()
        temppass = temppass.concat(char[Math.floor(Math.random(0, 10) * char.length)])
    }

    const SQL = 'INSERT INTO users (name, email, username, temppass) VALUES (?, ?, ?, ?);'
    let errors = []

    if(username.length <= 5){
        db.query(SQL, [name, email, username, temppass], (err, result) =>{
            if(err) throw err
            const message = `
                <h2>Hi there,</h2>
                <p>Thanks for the registered to the my Cloud Stream!</p>
                <h3><strong>Access credentials:</strong></h3>
                <p><strong>Username: </strong>${username}</p>
                <p><strong>Temporary Password: </strong>${temppass}</p>
                <p>Please, <a href="http://10.147.20.170:8080/client/account-activation">click here</a> for active your account!</p>`
    
            const options = {
                from: "CLOUDSERVER <root.cloudserver@gmail.com>",
                to: email,
                subject: "Confirm the user registered at cloud server",
                text: message,
                html: HTML_TEMPLATE(message),
            }
            
                sendMail(options, (info) => {
                    console.log("Email sent successfully");
                    console.log("MESSAGE ID: ", info.messageId);
                    res.status(200).render('home/sendmail')
            });   
        })
    }

    else{
        errors.push({message: 'Username too short!'})
        res.status(201).render('home/register', {error: errors})
    }
})

router.post('/active', (req, res) =>{
    const temppass = req.body.temppass
    const password = req.body.password
    const password2 = req.body.password2

    const UPDATE = 'UPDATE users SET temppass = NULL, password = ? WHERE temppass = ?;'
    const SELECT = 'SELECT * FROM users WHERE temppass = ?;'

    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))

    db.query(SELECT, [temppass], (err, selected) =>{
        if(selected[0] == undefined || password != password2 || password.length < 6){
            console.log('temppass nao existe ou as novas senhas nao coincidem') //tratar erro
            res.render('home/active')
        }
        else{
            db.query(UPDATE, [hash, temppass], (err, updated) =>{
                res.render('home/activated')
            })
        }
   })  
})

router.post('/login', (req, res) =>{
    const username = req.body.username
    const password = req.body.password

    const SQL = 'SELECT * FROM users WHERE username = ?;'
    const SESSION = 'INSERT INTO sessions (username, token) VALUES (?, ?);'

    let errors = []

    db.query(SQL, [username], (err, result) =>{
        try{
            bcrypt.compare(password, result[0].password, (err, compare) =>{
                const token = jwt.sign({
                    id: result[0].id,
                    user: result[0].username
                }, 'AA5gx&kCBz7J0nNRFY')

                res.cookie('token', token)

                db.query(SESSION, [username, token], (err, auth) =>{
                    if(err) throw err
                    res.redirect('/home/dashboard')
                })
            })
        }
        catch(err){
            errors.push({message: 'Incorrect username or password!'})
            console.log(errors)
            res.render('home/login', {error: errors})
        }
    })
})

router.post('/stocks', (req, res) =>{
    const SQL = 'INSERT INTO stocks (name, ticker) VALUES (?, ?);'
    const name = req.body.name
    const ticker = req.body.ticker
    
    const successes = []

    db.query(SQL, [name, ticker], (err, result) =>{
        successes.push({message: 'Stock added successfully!'})
        res.redirect('/home/stocks', {success: successes})
    })
})

router.post('/dividends', (req, res) =>{
    const SQL = 'INSERT INTO stocks_dividends (ticker, value, date) VALUES (?, ?, ?);'
    const ticker = req.body.ticker
    const value = req.body.value
    const date = req.body.date

    db.query(SQL, [ticker, value, date], (err, result) =>{
        console.log(result)
        res.redirect('/home/dividends')
    })
})

router.post('/dividends_history', (req, res) =>{
    const ticker = req.body.ticker
    const year = req.body.year
    const month = req.body.month

    if(month == '0' && ticker == '0'){
        const SQL = `
        SELECT std.ticker, std.value, DATE_FORMAT(std.date, '%d-%m-%Y') date, st.name FROM stocks_dividends std 
        INNER JOIN stocks st ON st.ticker = std.ticker 
        WHERE YEAR(std.date) = ?;
        `
        const SQL_GET = 'SELECT ticker FROM stocks;'
        const params = [year]
        db.query(SQL, [params], (err, result) =>{
            db.query(SQL_GET, (err, ticker) =>{
                res.render('home/dividends_history', { tickers: ticker, item: result })
            })
        })
    }
    else if(month == '0'){
        const SQL = `
        SELECT std.ticker, std.value, DATE_FORMAT(std.date, '%d-%m-%Y') date, st.name FROM stocks_dividends std 
        INNER JOIN stocks st ON st.ticker = std.ticker 
        WHERE std.ticker = ? AND YEAR(std.date) = ?;
        `
        const SQL_GET = 'SELECT ticker FROM stocks;'
        const params = [ticker, year]    
        db.query(SQL, [params[0], params[1]], (err, result) =>{
            db.query(SQL_GET, (err, ticker) =>{
                res.render('home/dividends_history', { tickers: ticker, item: result })
            })
        })
    }
    else if(ticker == '0'){
        const SQL = `
        SELECT std.ticker, std.value, DATE_FORMAT(std.date, '%d-%m-%Y') date, st.name FROM stocks_dividends std 
        INNER JOIN stocks st ON st.ticker = std.ticker 
        WHERE MONTH(std.date) = ? AND YEAR(std.date) = ?;
        `
        const SQL_GET = 'SELECT ticker FROM stocks;'
        const params = [month, year]
        db.query(SQL, [params[0], params[1]], (err, result) =>{
            db.query(SQL_GET, (err, ticker) =>{
                res.render('home/dividends_history', { tickers: ticker, item: result })
            })
        })
    }
    else{
        const SQL = `
            SELECT std.ticker, std.value, DATE_FORMAT(std.date, '%d-%m-%Y') date, st.name FROM stocks_dividends std 
            INNER JOIN stocks st ON st.ticker = std.ticker 
            WHERE std.ticker = ? AND MONTH(std.date) = ? AND YEAR(std.date) = ?;
        `
        const SQL_GET = 'SELECT ticker FROM stocks;'
        const params = [ ticker, month, year]
        db.query(SQL, [params[0], params[1], params[2]], (err, result) =>{
            db.query(SQL_GET, (err, ticker) =>{
                res.render('home/dividends_history', { tickers: ticker, item: result })
            })
        })
    }
})

router.post('/payments', (req, res) =>{
    const SQL = 'INSERT INTO payment_type (name, cnpj) VALUES (?, ?);'
    const name = req.body.name
    const cnpj = req.body.cnpj

    const regex = new RegExp('^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}$') 
    let validate = regex.test(cnpj)
    let errors = []
    let successes = []
    if(validate){
        db.query(SQL, [name, cnpj], (err, result) =>{
            successes.push({message: 'Payment added successfully!'})
            res.redirect('/home/payments', {success: successes})
        })
    }
    else{
        errors.push({message: 'Invalid CNPJ!'})
        res.render('home/payments', {error: errors})
    }
})

router.post('/debts', (req, res) =>{
    const SQL = 'INSERT INTO debts (name, value, date) VALUES (?, ?, ?);'
    const name = req.body.name
    const value = req.body.value
    const date = req.body.date

    db.query(SQL, [name, value, date], (err, result) =>{
        console.log(result)
        res.redirect('/home/debts')
    })
})

router.post('/debts_history', (req, res) =>{
    const name = req.body.name
    const year = req.body.year
    const month = req.body.month

    if(month == '0' && name == '0'){
        const SQL = `
        SELECT dbt.name, dbt.value, DATE_FORMAT(dbt.date, '%d-%m-%Y') date, pay.cnpj FROM debts dbt 
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE YEAR(dbt.date) = ?;
        `
        
        const SQL_TOTAL = `
        SELECT SUM(dbt.value) FROM debts dbt 
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE YEAR(dbt.date) = ?;
        `
        const SQL_GET = 'SELECT name FROM payment_type;'
        const params = [year]
        db.query(SQL, [params], (err, result) =>{
            db.query(SQL_GET, (err, payment) =>{
                res.render('home/debts_history', { payments: payment, item: result })
            })
        })
    }
    else if(month == '0'){
        const SQL = `
        SELECT dbt.name, dbt.value, DATE_FORMAT(dbt.date, '%d-%m-%Y') date, pay.cnpj FROM debts dbt 
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE dbt.name = ? AND YEAR(dbt.date) = ?;
        `
        const SQL_TOTAL = `
        SELECT SUM(dbt.value) FROM debts dbt
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE dbt.name = ? AND YEAR(dbt.date) = ?;
        `
        const SQL_GET = 'SELECT name FROM payment_type;'
        const params = [name, year]    
        db.query(SQL, [params[0], params[1]], (err, result) =>{
            db.query(SQL_GET, (err, payment) =>{
                res.render('home/debts_history', { payments: payment, item: result })
            })
        })
    }
    else if(name == '0'){
        const SQL = `
        SELECT dbt.name, dbt.value, DATE_FORMAT(dbt.date, '%d-%m-%Y') date, pay.cnpj FROM debts dbt 
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE MONTH(dbt.date) = ? AND YEAR(dbt.date) = ?;
        `

        const SQL_TOTAL = `
        SELECT SUM(dbt.value) FROM debts dbt
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE MONTH(dbt.date) = ? AND YEAR(dbt.date) = ?;
        `

        const SQL_GET = 'SELECT name FROM payment_type;'
        const params = [month, year]
        db.query(SQL, [params[0], params[1]], (err, result) =>{
            db.query(SQL_GET, (err, payment) =>{
                res.render('home/debts_history', { payments: payment, item: result })
            })
        })
    }
    else{
        const SQL = `
        SELECT dbt.name, dbt.value, DATE_FORMAT(dbt.date, '%d-%m-%Y') date, pay.cnpj FROM debts dbt 
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE dbt.name = ? AND MONTH(dbt.date) = ? AND YEAR(dbt.date) = ?;
        `

        const SQL_TOTAL = `
        SELECT SUM(dbt.value) AS total FROM debts dbt
        INNER JOIN payment_type pay ON dbt.name = pay.name
        WHERE dbt.name = ? AND MONTH(dbt.date) = ? AND YEAR(dbt.date) = ?;
        `
        const SQL_GET = 'SELECT name FROM payment_type;'
        const params = [name, month, year]
        db.query(SQL, [params[0], params[1], params[2]], (err, result) =>{
            db.query(SQL_GET, (err, payment) =>{
                db.query(SQL_TOTAL, (err, valor) =>{
                    res.render('home/debts_history', { payments: payment, item: result, total: valor })
                })
                
            })
        })
    }
})
module.exports = router