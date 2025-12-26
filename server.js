let express = require("express");
let app = express();
const path = require('path');
let ejs = require('ejs');
var image = require('../static/image_class')

app.set('view engine', 'ejs');

app.use(express.static("../static"));

let reqPath = path.join(__dirname, '../');

app.get('/', function(req, res) {
    res.render('home.ejs');
});

app.get('/digit', function(req, res) {
    res.render('digit_option.ejs');
});

app.get('/character', function(req, res) {
    res.render('character_option.ejs');
});

app.get('/digit/learn', function(req, res) {
    var digit = req.query.choice;
    // console.log(digit);
    if(digit === undefined) res.render('digit_choice.ejs');
    else {
        res.render('digit_learn.ejs', {digit, english: ENG_NUMBER_CLASSES[digit], engl: ENG_NUMBER_N_CLASSES[digit]});
    }
});


app.get('/character/learn', function(req, res) {
    var digit = req.query.choice;
    // console.log(digit);
    if(digit === undefined) res.render('character_choice.ejs');
    else {
        res.render('character_learn.ejs', {digit, engl_char: ENG_CHAR_CLASS[digit], eng_prnc: ENG_CHAR_LETTERS_CLASS[digit]});
    }
});


app.get('/digit/test', function(req, res) {
    res.render('digit_test.ejs');
});

app.get('/character/test', function(req, res) {
    res.render('character_test.ejs');
});

app.listen(2600, function() {
    console.log("Server static on 2600");
});


const ENG_NUMBER_CLASSES = {
    0: 'Zero',
    1: 'One',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine'
}

const ENG_NUMBER_N_CLASSES = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9'
}

const ENG_CHAR_LETTERS_CLASS = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
    6: 'G',
    7: 'H',
    8: 'I',
    9: 'J',
    10: 'K',
    11: 'L',
    12: 'M',
    13: 'N',
    14: 'O',
    15: 'P',
    16: 'Q',
    17: 'R',
    18: 'S',
    19: 'T',
    20: 'U',
    21: 'V',
    22: 'W',
    23: 'X',
    24: 'Y',
    25: 'Z'
}

const ENG_CHAR_CLASS = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
    6: 'G',
    7: 'H',
    8: 'I',
    9: 'J',
    10: 'K',
    11: 'L',
    12: 'M',
    13: 'N',
    14: 'O',
    15: 'P',
    16: 'Q',
    17: 'R',
    18: 'S',
    19: 'T',
    20: 'U',
    21: 'V',
    22: 'W',
    23: 'X',
    24: 'Y',
    25: 'Z'
}