const express = require('express');
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 8000;
const helmet = require('helmet');

app.use(helmet());
app.use(express.static(__dirname + '/public'));

app.get('/' , function(req, res){
    res.sendFile(__dirname+'/public/html/index.html');
});

http.listen(PORT, function(){
    console.log('Server listening. Port:' + PORT);
});
