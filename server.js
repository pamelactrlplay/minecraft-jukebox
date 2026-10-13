const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const db = new sqlite3.Database('./jukebox.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite local.');
        db.run(`CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            src TEXT NOT NULL
        )`, (err) => {
            if (!err) {
                db.get("SELECT COUNT(*) as count FROM tracks", (err, row) => {
                    if (row.count === 0) {
                        const defaultTracks = [
                            ["C418 - Sweden", "Minecraft", "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg"],
                            ["C418 - Wet Hands", "Minecraft", "https://actions.google.com/sounds/v1/weather/wind_gusts.ogg"]
                        ];
                        const stmt = db.prepare("INSERT INTO tracks (title, author, src) VALUES (?, ?, ?)");
                        defaultTracks.forEach(track => stmt.run(track));
                        stmt.finalize();
                    }
                });
            }
        });
    }
});

app.get('/api/tracks', (req, res) => {
    db.all("SELECT * FROM tracks", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/tracks', (req, res) => {
    const { title, author, src } = req.body;
    db.run(`INSERT INTO tracks (title, author, src) VALUES (?, ?, ?)`, [title, author, src], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, author, src });
    });
});

app.delete('/api/tracks/:id', (req, res) => {
    db.run(`DELETE FROM tracks WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deletado com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});