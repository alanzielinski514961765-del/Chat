const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serwowanie plików statycznych z folderu "public"
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Użytkownik połączony:', socket.id);

    // Odbieranie wiadomości i wysyłanie jej do wszystkich
    socket.on('chatMessage', (data) => {
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik rozłączony');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer AL działa na porcie ${PORT}`);
});
