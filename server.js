const express = require('express');
const path = require('path');
const app = express();
const route = require('./routes/route');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/', route);

const PORT = 3000;
app.use('/storage', express.static(path.join(__dirname, 'storage')));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);

});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
