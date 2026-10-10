const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serwowanie plików statycznych z folderu "public"
app.use(express.static('public'));

// Przechowujemy historię wiadomości w pamięci serwera
let messageHistory = [];

// Funkcja sprawdzająca czas i czyszcząca czat o północy
function checkMidnightReset() {
    const now = new Date();
    // Sprawdzamy czy jest godzina 00:00 (z tolerancją na pierwszą sekundę minuty)
    if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        messageHistory = []; // Czyszczenie historii
        io.emit('clearChat'); // Informacja dla wszystkich telefonów, żeby wyczyściły ekran
        console.log('Automatyczny reset czatu o północy!');
    }
}

// Uruchamiamy zegar sprawdzający co sekundę
setInterval(checkMidnightReset, 1000);

io.on('connection', (socket) => {
    console.log('Użytkownik połączony:', socket.id);

    // Ktoś wchodzi na stronę – wysyłamy mu dotychczasową historię z danego dnia
    socket.emit('initHistory', messageHistory);

    // Odbieranie wiadomości i wysyłanie jej do wszystkich
    socket.on('chatMessage', (data) => {
        const messageWithTime = {
            ...data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        messageHistory.push(messageWithTime);
        
        // Ograniczamy historię do ostatnich 100 wiadomości
        if (messageHistory.length > 100) {
            messageHistory.shift();
        }

        io.emit('message', messageWithTime);
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik rozłączony');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer AL działa na porcie ${PORT}`);
});
