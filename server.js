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

// Funkcja sprawdzająca czas i czyszcząca czat o północy w polskiej strefie czasowej
function checkMidnightReset() {
    const now = new Date();
    const polandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
    
    // Sprawdzamy czy w Polsce jest godzina 00:00 (pierwsza sekunda)
    if (polandTime.getHours() === 0 && polandTime.getMinutes() === 0 && polandTime.getSeconds() === 0) {
        messageHistory = []; // Czyszczenie historii
        io.emit('clearChat'); // Informacja dla wszystkich telefonów, żeby wyczyściły ekran
        console.log('Automatyczny reset czatu o północy (czas PL)!');
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
            // Polska strefa czasowa i format 24-godzinny (np. 14:37)
            time: new Date().toLocaleTimeString('pl-PL', { 
                timeZone: 'Europe/Warsaw', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            })
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
