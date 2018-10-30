const express = require('express');
const app = express();

const port = process.env.PORT || 3200;

app.get('/', (req, res) => {

    res.sendStatus(200);
});

app.listen(port, () => {

    console.log(`Server started listening on port ${port}.`);
});