'use strict';

//APP DEPENDENCIES
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const methodOverride = require('method-override');
const pg = require('pg');
const PORT = process.env.PORT;

//APP SETUP
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);

//HOME PAGE
app.get('/', (req, res) => {
    let url = `https://api.covid19api.com/world/total`;
    superagent.get(url)
        .then(result => {
            res.render('HomePage', { totals: result.body })
        })
})

//SEARCH CONFIRMED CASES FOR CERTAIN COUNTRY
app.get('/search', (req, res) => {
    const country = req.query.country;
    const from = req.query.from;
    const to = req.query.to;
    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}&to=${to}`;
    superagent.get(url)
        .then(results => {
            console.log(results.body);
            res.render('getCountryResult', { resultsSearch: results.body })
        })

})

//RENDER ALL COUNTRIES WITH DETAILS
app.get('/allCountries', (req, res) => {
    let url = `https://api.covid19api.com/summary`;
    superagent.get(url)
        .then(results => {
            let objArr = results.body.Countries.map(obj => {
                return new CountryObj(obj);
            })
            res.render('AllCountries', { countries: objArr });
        })
})

//ADD NEW COUNTRY TO MY DATABASE
app.post('/addRecord', (req, res) => {
    let sql = 'INSERT INTO records (Country, TotalConfirmed, TotalDeaths, TotalRecovered, Date) VALUES ($1,$2,$3,$4,$5);';
    const { Country, TotalConfirmed, TotalDeaths, TotalRecovered, Date } = req.body;
    let safeValues = [Country, TotalConfirmed, TotalDeaths, TotalRecovered, Date];
    client.query(sql, safeValues)
        .then(() => {
            res.redirect('/MyRecords');
        })
})

//RENDER ADDED RECORDS
app.get('/MyRecords', (req, res) => {
    let sql = 'SELECT * FROM records;';
    client.query(sql)
        .then(results => {
            // console.log(results);
            if (results.rowCount > 0) {

                res.render('MyRecords', { record: results.rows });
            }
            else {

                res.send('No Available Records');
            }
        })
})

//DISPLAY DETAILS FOR SELECTED COUNTRY
app.get('/details/:id', (req, res) => {
    let sql = 'SELECT * FROM records WHERE id=$1;';
    let safeVal = [req.params.id];
    client.query(sql, safeVal)
        .then(result => {
            res.render('RecordDetails', { details: result.rows[0] });
        })
})

//UPDATE DETAILS
app.put('/details/:id', (req, res) => {
    let sql = 'UPDATE records SET Country=$1, TotalConfirmed=$2, TotalDeaths=$3, TotalRecovered=$4, Date=$5 WHERE id=$6;';
    const { Country, TotalConfirmed, TotalDeaths, TotalRecovered, Date } = req.body;
    let safeValues = [Country, TotalConfirmed, TotalDeaths, TotalRecovered, Date, req.params.id];
    client.query(sql, safeValues)
        .then(() => {
            res.redirect(`/details/${req.params.id}`);
        })
})

//DELETE COUNTRY FROM DATABASE
app.delete('/details/:id', (req, res) => {
    let sql = 'DELETE FROM records WHERE id =$1;';
    let safeVal = [req.params.id];
    client.query(sql, safeVal)
        .then(() => {
            res.redirect('/MyRecords');
        })
})

//CONSTRUCTOR TO INSTACIATE OBJECTS
function CountryObj(obj) {
    this.Country = obj.Country + ', ' + obj.CountryCode;
    this.TotalConfirmed = obj.TotalConfirmed;
    this.TotalDeaths = obj.TotalDeaths;
    this.TotalRecovered = obj.TotalRecovered;
    this.Date = obj.Date;
}

//CONNECT SERVER TO DB
client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Listening on port: ${PORT}`);
        })
    })