const express = require('express');
const sqlite3 = require('sqlite3');
const artistsRouter = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

artistsRouter.get('/', (req, res, next) => {
	db.all(`SELECT * FROM Artist WHERE is_currently_employed = 1`, (err, rows) => {
		if (err) {
			next(err);
		} else {
			res.status(200).send({artists: rows});
		}
	});
});

artistsRouter.param('artistId', (req, res, next, artistId) => {
	db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (err, artist) => {
		if (err) {
			next(err);
		} else if (artist) {
			req.artist = artist;
			next();
		} else {
			res.sendStatus(404);
		}
	});
});

artistsRouter.get('/:artistId', (req, res, next) => {
	res.status(200).json({artist: req.artist});
});

let checkInput = (req, res, next) => {
	let artist = req.body.artist;
	if (
		!artist.name ||
		!artist.dateOfBirth ||
		!artist.biography
	) {
		res.sendStatus(400);
	} else {
		if (!artist.is_currently_employed) {
			artist.is_currently_employed = 1;
		}
		req.artist = artist;
		next();
	}
}

artistsRouter.post('/', checkInput, (req, res, next) => {
	db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) 
	VALUES ($name, $date_of_birth, $biography, $is_currently_employed)`, {
		$name: req.artist.name,
		$date_of_birth: req.artist.dateOfBirth,
		$biography: req.artist.biography,
		$is_currently_employed: req.artist.is_currently_employed
	}, function(err) {
		if (err) {
			next(err);
		} else {
			db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, (err, row) => {
				res.status(201).json({artist: row});
			});
		}
	});
});

let checkInput2 = (req, res, next) => {
	let artist = req.body.artist;
	if (
		!artist.name ||
		!artist.dateOfBirth ||
		!artist.biography
	) {
		res.sendStatus(400);
	} else {
		if (!artist.is_currently_employed) {
			req.body.artist.is_currently_employed = 1;
		}
		next();
	}
}

artistsRouter.put('/:artistId', checkInput2, (req, res, next) => {
	const sql = `
		UPDATE Artist
		SET name = $name, date_of_birth = $date_of_birth, biography = $biography, is_currently_employed = $is_currently_employed
		WHERE Artist.id = $id;`;
	const values = {
		$id: req.params.artistId,
		name: req.body.artist.name,
		$date_of_birth: req.body.artist.dateOfBirth,
		$biography: req.body.artist.biography,
		$is_currently_employed: req.body.artist.is_currently_employed
	};

	db.run(sql, values, function(err) {
		if (err) {
			next(err);
		} else {
			db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (err, row) => {
				res.status(200).json({artist: row});
			});
		}
	});
});

module.exports = artistsRouter;