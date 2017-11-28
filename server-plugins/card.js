'use strict';
/********************
 * PSGO
 * Card system originally from EOS: Credit to Naten, nineage, fender, and everyone who added cards/
 * All cards should be retrieved here http://www.pokemon.com/us/pokemon-tcg/pokemon-cards/
 * Cards are organized alphabetically and use a point system
 * publicids are dex numbers and any unique identifiers (if they're not a Pokemon, do a shorthand version of the card name)
 * Dex Number, (for multiple pokemon: DEX[lowercase letter, a, b, c, d])
********************/
const uuid = require('uuid');
const cards = require('../config/card-data');

const colors = {
	Mythic: '#D82A2A',
	Legendary: '#E8AB03',
	Epic: '#73DF14',
	Rare: '#2DD1B6',
	Uncommon: '#2D3ED1',
	Common: '#696969',
};

const shop = [
	['XY-Promo', 'Get three cards from the Promo pack released in the Pokemon XY set.', 10],
	['XY-Base', 'Get three cards from the first pack released in the Pokemon XY set.', 4],
	['XY-Flashfire', 'Get three cards from the Flashfire pack released in the Pokemon XY set.', 4],
	['XY-Furious Fists', 'Get three cards from the Furious Fists pack released in the Pokemon XY set.', 4],
	['XY-Phantom Forces', 'Get three cards from the Phantom Forces pack released in the Pokemon XY set.', 4],
	['XY-Primal Clash', 'Get three cards from the Primal Clash pack released in the Pokemon XY set.', 4],
	['XY-Roaring Skies', 'Get three cards from the Roaring Skies pack released in the Pokemon XY set.', 4],
	['XY-Ancient Origins', 'Get three cards from the Ancient Origins pack released in the Pokemon XY set.', 4],
	['HGSS-Base', 'Get three cards from the first pack released in the Pokemon HGSS set.', 8],
];
let packShop = ['XY-Promo', 'XY-Base', 'XY-Flashfire', 'XY-Furious Fists', 'XY-Phantom Forces', 'XY-Primal Clash', 'XY-Roaring Skies', 'XY-Ancient Origins', 'HGSS-Base', 'Double Crisis', 'Water', 'Fire', 'Fighting', 'Fairy', 'Dragon', 'Colorless', 'Psychic', 'Lightning', 'Darkness', 'Grass', 'OU-Pack', 'UU-Pack', 'Uber-Pack', 'PU-Pack', 'NU-Pack', 'RU-Pack', 'LC-Pack', 'BL-Pack', 'BL2-Pack', 'BL3-Pack', 'Gen1', 'Gen2', 'Gen3', 'Gen4', 'Gen5', 'Gen6', 'Metal', 'Trainer', 'Supporter', 'Item', 'Stadium', 'EX-Pack', 'Legendary', 'Full', 'Event'];
const tourCardRarity = ['No Card', 'Common', 'Uncommon', 'Rare', 'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic'];
const cardRarity = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
let cleanShop = [];
let cleanCard = [];
let rareCache = []; // Used to cache cards for tours
let cardCache = []; // Used to cache cards in packs
let userPacks = {}; // Used to store users unopened packs

function cachePacks() {
	for (let i = 0; i < packShop.length; i++) {
		cardCache.push([]);
		for (let key in cards) {
			if (cards[key]) {
				let obj = cards[key];
				if (obj['collection'] && obj.collection.indexOf(packShop[i]) > -1) cardCache[i].push(key);
			}
		}
	}
	for (let i = 0; i < packShop.length; i++) {
		cleanShop.push(toId(packShop[i]));
	}
}

function cacheRarity() {
	for (let i = 0; i < cardRarity.length; i++) {
		rareCache.push([]);
		for (let key in cards) {
			if (cards[key]) {
				let obj = cards[key];
				if (obj['rarity'] && obj.rarity.indexOf(cardRarity[i]) > -1) rareCache[i].push(key);
			}
		}
	}
	for (let i = 0; i < cardRarity.length; i++) {
		cleanCard.push(toId(cardRarity[i]));
	}
}

Server.tourCard = function (tourSize, userid) {
	if (tourSize > 32) tourSize = 32;
	let tourRarity = tourCardRarity[Math.floor(tourSize / 4)];
	let cacheValue = rareCache[cleanCard.indexOf(toId(tourRarity))];
	if (!cacheValue || !cacheValue.length) return false;
	let card = cacheValue[Math.round(Math.random() * (cacheValue.length - 1))];
	if (tourRarity === 'No Card') return;
	addCard(userid, card);
	return [colors[cards[card].rarity], cards[card].rarity, cards[card].title, cards[card].name];
};

function addCard(name, card) {
	let newCard = {};
	newCard.id = uuid.v1();
	newCard.title = cards[card].title;
	newCard.card = cards[card].card;
	newCard.name = cards[card].name;
	newCard.rarity = cards[card].rarity;
	newCard.points = cards[card].points;

	let userid = toId(name);
	Db('cards').set(userid, Db('cards').get(userid, []).concat([newCard]));
	Db('points').set(userid, Db('points').get(userid, 0) + newCard.points);
}

function removeCard(cardTitle, userid) {
	let userCards = Db('cards').get(userid, []);
	let idx = -1;
	// search for index of the card
	for (let i = 0; i < userCards.length; i++) {
		let card = userCards[i];
		if (card.title === cardTitle) {
			idx = i;
			break;
		}
	}
	if (idx === -1) return false;
	// remove it
	userCards.splice(idx, 1);
	// set it in db
	Db('cards').set(userid, userCards);
	return true;
}

function getPointTotal(userid) {
	let totalCards = Db('cards').get(userid, []);
	let total = 0;
	for (let i = 0; i < totalCards.length; i++) {
		total += totalCards[i].points;
	}
	return total;
}

function getShopDisplay(shop) {
	let display = "<table width='100%' border='1' style='border-collapse: collapse; color: #444; box-shadow: 2px 3px 5px rgba(0, 0, 0, 0.2);' cellpadding='5'>" +
		"<tr><th class='card-th' style='background-image: -moz-linear-gradient(center top , #EBF3FC, #DCE9F9); box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.8) inset;'>Command</th><th class='card-th' style='background-image: -moz-linear-gradient(center top , #EBF3FC, #DCE9F9); box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.8) inset;'>Description</th><th class='card-th' style='background-image: -moz-linear-gradient(center top , #EBF3FC, #DCE9F9); box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.8) inset;'>Cost</th></tr>";
	let start = 0;
	while (start < shop.length) {
		display += "<tr>" + "<td class='card-td'><button name='send' value='/buypack " + shop[start][0] + "' style='border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;'><strong>" + shop[start][0] + "</strong></button></td>" +
			"<td class='card-td'>" + shop[start][1] + "</td>" +
			"<td class='card-td'>" + shop[start][2] + "</td>" +
			"</tr>";
		start++;
	}
	display += "</table><center>To buy a pack from the shop, use /buypack <em>pack</em>.</center>";
	return display;
}

function toTitleCase(str) {
	return str.replace(/(\w\S*)/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

cachePacks();
cacheRarity();

exports.commands = {
<<<<<<< HEAD
	packs: 'pack',
	pack: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) target = user.name;
		target = toId(target);
		if (!userPacks[target] || userPacks[target].length === 0) return this.sendReply((target === user.userid ? 'You have' : target + ' has') + ' no packs.');
		this.sendReply('|raw|<u><strong>List of packs:</strong></u>');
		for (let i = 0; i < userPacks[target].length; i++) {
			this.sendReply('|raw| <button name="send" value="/openpack ' + userPacks[target][i] + '"> Press to open <strong>' + toTitleCase(userPacks[target][i]) + '</strong> pack</button>');
		}
	},

	buypacks: 'buypack',
	buypack: function (target, room, user) {
		if (!target) return this.sendReply("/buypack - Buys a pack from the pack shop. Alias: /buypacks");
		let self = this;
		let packId = toId(target);
		let amount = Db('money').get(user.userid, 0);
		if (cleanShop.indexOf(packId) < 0) return self.sendReply("This is not a valid pack. Use /packshop to see all packs.");
		let shopIndex = cleanShop.indexOf(toId(target));
		if (packId !== 'xybase' && packId !== 'xyfuriousfists' && packId !== 'xyflashfire' && packId !== 'xyphantomforces' && packId !== 'xyroaringskies' && packId !== 'xyprimalclash' && packId !== 'xyancientorigins' && packId !== 'xygenerations' && packId !== 'xypromo' && packId !== 'hgss') return self.sendReply("This pack is not currently in circulation.  Please use /packshop to see the current packs.");
		let cost = shop[shopIndex][2];
		if (cost > amount) return self.sendReply("You need " + (cost - amount) + " more bucks to buy this pack.");
		Economy.writeMoney(user.userid, Number(-cost));
		let pack = toId(target);
		self.sendReply('|raw|You have bought ' + target + ' pack for ' + cost + ' bucks. Use <button name="send" value="/openpack ' + pack + '"><strong>/openpack ' + pack + '</strong></button> to open your pack.');
		self.sendReply("You have until the server restarts to open your pack.");
		if (!userPacks[user.userid]) userPacks[user.userid] = [];
		userPacks[user.userid].push(pack);
	},

	packshop: function (target, room, user) {
		if (!this.runBroadcast()) return;
		return this.sendReply('|raw|' + getShopDisplay(shop));
	},

	open: 'openpack',
	openpacks: 'openpack',
	openpack: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) {
			this.sendReply("/openpack [pack] - Open a Pokemon Card Pack. Alias: /open, /openpacks");
			return this.parse('/packs');
		}
		if (cleanShop.indexOf(toId(target)) < 0) return this.sendReply("This pack does not exist.");
		if (!userPacks[user.userid] || userPacks[user.userid].length === 0) return this.sendReply("You have no packs.");
		if (userPacks[user.userid].indexOf(toId(target)) < 0) return this.sendReply("You do not have this pack.");
		let newPack;
		for (let i = 0; i < 3; i++) {
			newPack = toId(target);
			let cacheValue = cardCache[cleanShop.indexOf(toId(target))];
			let card = cacheValue[Math.round(Math.random() * (cacheValue.length - 1))];
			addCard(user.userid, card);
			let cardName = cards[card].name;
			let packName = packShop[cleanShop.indexOf(toId(target))];
			this.sendReplyBox(Server.nameColor(user.name, true) + ' got <font color="' + colors[cards[card].rarity] + '">' + cards[card].rarity + '</font> ' +
			'<button name="send" value="/card ' + card + '"><strong>' + cardName + '</strong></button> from a ' +
			'<button name="send" value="/buypack ' + packName + '">' + packName + ' Pack</button>.');
		}
		let usrIndex = userPacks[user.userid].indexOf(newPack);
		userPacks[user.userid].splice(usrIndex, 1);
	},

	givepacks: 'givepack',
	givepack: function (target, room, user) {
		if (!user.can('ban')) return this.errorReply("/givepack - Access denied.");
		if (!target) return this.sendReply("/givepack [user], [pack] - Give a user a pack.");
		let parts = target.split(',');
		this.splitTarget(parts[0]);
		if (!parts[1]) return this.sendReply("/givepack [user], [pack] - Give a user a pack.");
		let pack = toId(parts[1]);
		if (cleanShop.indexOf(pack) < 0) return this.sendReply("This pack does not exist.");
		if (!this.targetUser) return this.sendReply("User '" + this.targetUsername + "' not found.");
		if (!userPacks[user.name]) userPacks[user.name] = [];
		userPacks[user.name].push(pack);
		this.sendReply(this.targetUsername + " was given " + pack + " pack. This user now has " + userPacks[user.name].length + " pack(s).");
		Users.get(this.targetUsername).connections[0].sendTo(room.id,
			'|raw|' + user.name + ' has given you ' + pack + ' pack. You have until the server restarts to open your pack.' +
			'Use <button name="send" value="/openpack ' + pack + '"><strong>/openpack ' + pack + '</strong></button> to open your pack.');
	},

	takepacks: 'takepack',
	takepack: function (target, room, user) {
		if (!user.can('ban')) return this.errorReply("/takepack - Access denied.");
		if (!target) return this.sendReply("/takepack [user], [pack] - Take a pack from a user.");
		let parts = target.split(',');
		this.splitTarget(parts[0]);
		if (!parts[1]) return this.sendReply("/takepack [user], [pack] - Take a pack from a user.");
		let pack = toId(parts[1]);
		let userid = toId(this.targetUsername);
		let packIndex = userPacks[userid].indexOf(pack);
		if (packShop.indexOf(pack) < 0) return this.sendReply("This pack does not exist.");
		if (!this.targetUser) return this.sendReply("User '" + this.targetUsername + "' not found.");
		if (!userPacks[userid]) userPacks[userid] = [];
		if (packIndex < 0) return this.sendReply("This user does not have this pack.");
		userPacks[userid].splice(packIndex, 1);
		this.sendReply(this.targetUsername + " lost " + pack + " pack. This user now has " + userPacks[userid].length + " pack(s).");
		Users.get(this.targetUsername).send('|raw|' + user.name + ' has taken ' + pack + ' pack from you. You now have ' + userPacks[userid].length + ' pack(s).');
	},

	showcards: 'showcase',
	showcard: 'showcase',
	showcase: function (target, room, user) {
		if (!this.runBroadcast()) return;
		let userid = user.userid;
		if (target) userid = toId(target);
		const cards = Db('cards').get(userid, []);
		if (!cards.length || userid === "constructor") return this.sendReplyBox(Server.nameColor(userid, false) + " has no cards.");
		const cardsMapping = cards.map(function (card) {
			return '<button name="send" value="/card ' + card.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="card-button"><img src="' + card.card + '" width="80" title="' + card.name + '"></button>';
		});
		this.sendReplyBox('<div style="max-height: 300px; overflow-y: scroll;">' + cardsMapping.join('') + '</div><br><center><strong>' + Server.nameColor(userid, false) + ' has ' + cards.length + ' cards and ' + getPointTotal(userid) + ' points.</strong></center>');
	},

	card: function (target, room, user) {
		if (!target) return this.sendReply("/card [name] - Shows information about a card.");
		if (!this.runBroadcast()) return;
		let cardName = toId(target);
		if (!cards[cardName]) return this.sendReply(target + ": card not found.");
		let card = cards[cardName];
		let html = '<div class="card-div card-td" style="box-shadow: 2px 3px 5px rgba(0, 0, 0, 0.2);"><img src="' + card.card + '" height="220" title="' + card.name + '" align="right">' +
			'<h1>' + card.name + '</h1>' +
			'<br /><br /><h1><font color="' + colors[card.rarity] + '">' + card.rarity + '</font></h1>' +
			'<br /><br /><font color="#AAA"><i>Points:</i></font> ' + card.points +
			'<br /><br /><font color="#AAA"><i>Found in Packs:</i></font> ' + card.collection.join(', ') +
			'<br clear="all">';
		this.sendReply('|raw|' + html);
	},

	cardladder: function (target, room, user) {
		if (!this.runBroadcast()) return;
		let keys = Object.keys(Db('points').object()).map(function (name) {
			return {name: name, points: getPointTotal(name)};
		});
		if (!keys.length) return this.sendReplyBox("Card ladder is empty.");
		keys.sort(function (a, b) { return b.points - a.points; });
		this.sendReplyBox(rankLadder('Card Ladder', 'Points', keys.slice(0, 100), 'points'));
	},

	sell: 'sellcard',
	sellcards: 'sellcard',
	sellcard: function (target, user) {
		let canSell = removeCard(target, user.userid);
		let profit;
		if (!target) return this.errorReply("/sellcard [card ID]");
		if (!cards[target]) {
			return this.sendReply("That card does not exist.");
		} else if (cards[target] && !canSell) {
			return this.sendReply("You do not own that card.");
		} else {
			if (card.rarity === 'Common' || card.rarity === 'Uncommon' || card.rarity === 'Rare') {
				return this.sendReply("That card is not worth anything.");
			} else if (card.rarity === 'Epic') {
				profit = 2;
				card = cards[card];
				removeCard(card.title, user.userid);
				return this.sendReply("Card successfully sold for " + profit + " Soul Dews.");
			} else if (card.rarity === 'Legendary') {
				profit = 4;
				card = cards[card];
				removeCard(card.title, user.userid);
				return this.sendReply("Card successfully sold for " + profit + " Soul Dews.");
			} else if (card.rarity === 'Mythic') {
				profit = 12;
				card = cards[card];
				removeCard(card.title, user.userid);
				return this.sendReply("Card successfully sold for " + profit + " Soul Dews.");
=======
	psgo: {
		display: 'card',
		card: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) return this.parse(`/help psgo card`);
			if (!cards[toId(target)]) return this.errorReply(`That card does not exist.`);
			let card = cards[toId(target)];
			let display = `<div style="width: 49%; display: inline-block;"><img src="${card.image}" title="${card.id}"></div>`;
			display += `<div style="width: 49%; display: inline-block; float: right;">`;
			let colors = {Common: '#0066ff', Uncommon: '#008000', Rare: '#cc0000', "Ultra Rare": '#800080', Legendary: '#c0c0c0', Mythic: '#998200'};
			display += `<font style="font-size: 3em; font-weight: bold;">${card.name}</font><h5>(ID: ${card.id})</h5><font style="font-size: 2em; font-weight: bold; color: ${colors[card.rarity]};">${card.rarity}</font><br/><strong>Species</strong>: ${card.species}<br/><strong>Type</strong>: ${card.type}<br/>`;
			display += `<strong>Pack</strong>: ${card.pack}<br/><strong>Card Type</strong>: ${card.cardType}</div>`;

			return this.sendReplyBox(display);
		},
		cardhelp: ['/psgo card [card id] - Gives information on the card selected.'],

		showcase: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = user.userid;
			const cards = Db("cards").get(toId(target), []);
			if (!cards.length) return this.sendReplyBox(`${toId(target)} has no cards.`);
			let cardsShown = 0;
			// done this way because of a glitch
			let broadcasting = this.broadcasting;
			const cardsMapping = cards.map(function (card) {
				if (broadcasting && cardsShown >= 100) {
					if (cardsShown === 100) {
						cardsShown++;
						return `<button name="send" value="/psgo showcase ${toId(target)}" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;">Show all cards</button>`;
					}
					return '';
				}
				cardsShown++;
				return `<button name="send" value="/psgo card ${card.id}" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;"><img src="${card.image}" width="100" title="${card.id}"></button>`;
			});
			this.sendReplyBox(`<div style="max-height: 300px; overflow-y: scroll;">${cardsMapping.join('')}</div><br><center><strong>${Server.nameColor(toId(target), true)} has ${cards.length} cards</strong></center>`);
		},
		showcasehelp: ['/psgo showcase (user) - Show all of the selected users cards.'],

		confirmtransfercard: 'transfercard',
		transfercard: function (target, room, user, connection, cmd) {
			if (!target) return this.parse(`/help psgo transfercard`);
			let targets = target.split(`,`).map(x => {
				return x.trim();
			});
			if (targets.length < 2) return this.parse(`/help psgo transfercard`);

			let targetUser = Users(toId(targets[0]));
			if (!targetUser) return this.errorReply(`The user "${targets[0]}" was not found.`);
			if (!targetUser.named) return this.errorReply(`Guests cannot be given cards.`);
			if (targetUser.userid === user.userid) return this.errorReply(`You cannot transfer cards to yourself.`);
			let card = toId(targets[1]);
			if (!cards[card]) return this.errorReply(`That card does not exist.`);

			let canTransfer = hasCard(user.userid, card);
			if (!canTransfer) return user.popup(`You do not have that card.`);

			if (cmd !== 'confirmtransfercard') {
				return this.popupReply(`|html|<center>` +
					`<button class = "card-td button" name = "send" value = "/psgo confirmtransfercard ${targetUser.userid}, ${card}"` +
					`style = "outline: none; width: 200px; font-size: 11pt; padding: 10px; border-radius: 14px ; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4); box-shadow: 0px 0px 7px rgba(0, 0, 0, 0.4) inset; transition: all 0.2s;">` +
					`Confirm transfer to <br><strong style = "color:${Server.nameColor(targetUser.userid)}; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8)">${Chat.escapeHTML(targetUser.name)}</strong></button></center>`
				);
>>>>>>> d289d6cf2c33c0272adcc08274e71b7cbb3808e2
			}
		}

	},

	cs: 'cardsearch',
	cardsearch: 'searchcard',
	searchcard: function (target, room, user) {
		const letters = "abcdefghijklmnopqrstuvwxyz".split("");
		const categories = {
			Rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'], // rarities
			Packs: ['XY-Promo', 'XY-Base', 'XY-Flashfire', 'XY-Furious Fists', 'XY-Phantom Forces', 'XY-Primal Clash', 'XY-Roaring Skies', 'XY-Ancient Origins', 'Double Crisis', 'XY-RadiantCollection', 'XY-Promo'],
			Types: ['Water', 'Fire', 'Fighting', 'Fairy', 'Dragon', 'Colorless', 'Psychic', 'Lightning', 'Darkness', 'Grass', 'Metal'],
			Tiers: ['OU-Pack', 'UU-Pack', 'Uber-Pack', 'PU-Pack', 'NU-Pack', 'RU-Pack', 'LC-Pack', 'BL-Pack', 'BL2-Pack', 'BL3-Pack'],
			Generation: ['Gen1', 'Gen2', 'Gen3', 'Gen4', 'Gen5', 'Gen6'],
			Miscellaneous: ['Trainer', 'Supporter', 'Item', 'Stadium', 'Energy', 'Delta', 'EX-Pack', 'Mega', 'Legendary', 'Full', 'Event'],
		};

		const scrollable = "<div style=\"max-height: 300px; overflow-y: scroll\">"; // code for scrollable html
		const divEnd = "</div>";
		const definePopup = "|wide||html|<center><strong>CardSearch</strong></center><br />";
		const generalMenu = "<center>" +
			'<button name="send" value="/searchcard letter" style="background-color:aliceblue;height:30px">Alphabetical</button>&nbsp;&nbsp;' + // alphabetical
			'<button name="send" value="/searchcard category" style="background-color:aliceblue;height:30px">Categories</button>&nbsp;&nbsp;' + // category
			'</center><br />';
		if (!target) {
			return user.popup(definePopup + generalMenu);
		}
		// quick fix for when target ends with a comma
		target = target.replace(/,[\s]+$/i, "");
		let parts = target.split(",");
		let actionCommand = parts.shift();
		let cardDisplay;
		switch (toId(actionCommand)) {
		case 'letter':
			let letter = toId(parts[0]);

			const letterMenu = '<center>' + letters.map(l => {
				return '<button name="send" value="/searchcard letter, ' + l + '" ' + (letter === l ? "style=\"background-color:lightblue;height:30px;width:35px\"" : "style=\"background-color:aliceblue;height:30px;width:35px\"") + ">" + l.toUpperCase() + "</button>";
			}).join("&nbsp;") + "</center><br />";

			if (!letter || letters.indexOf(letter) === -1) {
				// invalid letter to search for, or none given
				// only show menu
				return user.popup(definePopup + generalMenu + letterMenu);
			}
			// sort cards by letter
			let letterMons = {};
			for (let m in cards) {
				if (!letterMons[m.charAt(0)]) letterMons[m.charAt(0)] = {};
				letterMons[m.charAt(0)][m] = 1;
			}

			if (!letterMons[letter]) return user.popup(definePopup + generalMenu + letterMenu);
			// make graphics for the letter
			cardDisplay = Object.keys(letterMons[letter]).sort().map(m => {
				let card = cards[m];
				return '<button name="send" value="/searchcard card, ' + card.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="card-button"><img src="' + card.card + '" width="100" title="' + card.name + '"></button>';
			}).join("&nbsp;");
			// send the popup
			user.lastCardSearch = target;
			user.popup(definePopup + generalMenu + letterMenu + scrollable + cardDisplay + divEnd);
			break;
		case 'category':
			// clean all the parts first
			parts = parts.map(p => {
				return toId(p);
			});

			// create category menu
			let categoryMenu = "";
			for (let c in categories) {
				categoryMenu += '<strong>' + c + ' -</strong> ' + categories[c].map(k => {
					let m = toId(k);
					// add a special search condition for rarity
					if (c === "Rarity") m += "rarity";

					// new params for the search
					// clone parts
					let newParams = parts.slice(0);
					if (parts.indexOf(m) > -1) {
						// remove it
						newParams.splice(newParams.indexOf(m), 1);
					} else {
						newParams.push(m);
					}

					let style = (parts.indexOf(m) > -1 ? "style=\"background-color:lightblue;height:23\"" : "style=\"background-color:aliceblue;height:23\""); // button style checking if currently searching

					return '<button name="send" value="/searchcard category, ' + newParams.join(", ") + '" ' + style + '>' + k + '</button>';
				}).join("&nbsp;") + "<br />";
			}
			if (!parts.length) {
				return user.popup(definePopup + generalMenu + categoryMenu);
			}
			// now clone the cards and delete the ones who dont match the categories
			let paramCards = Object.assign({}, cards);

			// filter out the unneeded ones; ignore rarity
			for (let i = 0; i < parts.length; i++) {
				let param = parts[i];
				// ignore rarity
				if (/rarity$/i.test(param)) continue;
				for (let c in paramCards) {
					let cardParams = paramCards[c].collection.join("~").toLowerCase().replace(/[^a-z0-9~]/g, "").split("~");
					if (cardParams.indexOf(param) === -1) delete paramCards[c]; // remove the card from the currently searched ones.
				}
			}

			// seperate check for rarity
			let rarityCheck = parts.some(a => {
				return /rarity$/i.test(a);
			});
			if (rarityCheck) {
				for (let c in paramCards) {
					let cardRare = toId(paramCards[c].rarity);
					for (let i = 0; i < parts.length; i++) {
						if (/rarity$/i.test(parts[i])) {
							// check if rarity is the card's rarity
							if (parts[i].replace(/rarity$/i, "") !== cardRare) {
								// remove if not matched
								delete paramCards[c];
							}
						}
					}
				}
			}

			// no cards left
			if (!Object.keys(paramCards).length) {
				return user.popup(definePopup + generalMenu + categoryMenu + '<br /><center><font color="red"><strong>Nothing matches your search</strong></font></center>');
			}
			user.lastCardSearch = target;
			// build the display
			cardDisplay = Object.keys(paramCards).sort().map(m => {
				let card = paramCards[m];
				return '<button name="send" value="/searchcard card, ' + card.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="card-button"><img src="' + card.card + '" width="100" title="' + card.name + '"></button>';
			}).join("&nbsp;");
			user.popup(definePopup + generalMenu + categoryMenu + scrollable + cardDisplay + divEnd);
			break;
		case 'card':
			let backButton = '<button name="send" value="/cardsearch ' + user.lastCardSearch + '" style="background-color:aliceblue;height:30px;width:35">&lt;&nbsp;Back</button><br /><br />';
			if (!parts[0] || !(toId(parts[0]) in cards) || toId(parts[0]) === "constructor") {
				return user.popup(definePopup + backButton + '<center><font color="red"><strong>Invalid Card</strong></font></center>');
			}

			// build the display screen for the card
			let card = cards[toId(parts[0])];
			// the image
			let cardImage = '<img src="' + card.card + '" height=250>';
			// the name of the card
			let cardName = "<strong>Name:</strong> " + card.name + "<br />";
			// the id of the card
			let cardId = "<font color=\"gray\">(" + card.title + ")</font><br />";
			// rarity display
			let cardRarityPoints = '<strong>Rarity: </strong><font color="' + colors[card.rarity] + '">' + card.rarity + '</font> (' + card.points + ')<br />';
			// collections
			let cardCollection = '<strong>Packs: </strong>' + card.collection.join(", ") + "<br />";
			// get users that have the card
			let allCardUsers = Db('cards').object();
			let cardHolders = [];
			// dont allow duplicates
			for (let u in allCardUsers) {
				let userData = allCardUsers[u];
				for (let i = 0; i < userData.length; i++) {
					let tC = userData[i];
					if (tC && tC.title === card.title) {
						if (!cardHolders[u]) cardHolders[u] = 0;
						cardHolders[u]++;
					}
				}
			}
			// show duplicates as (x#)
			cardHolders = Object.keys(cardHolders).sort().map(u => {
				return "&nbsp;- " + u + (cardHolders[u] > 1 ? " (x" + cardHolders[u] + ")" : "");
			});

			// build the display!
			cardDisplay = "<center><table><tr>" +
				"<td>" + cardImage + "</td>" + // Card on the left
				"<td>" + // details now
				cardName + cardId + cardRarityPoints + cardCollection +
				"<strong>Users with this card:</strong><br />" + // card holders
				"<div style=\"max-height: 130px; overflow-y: scroll\">" + // scrollable
				cardHolders.join("<br />") + "<br />" +
				"</td></tr></table></center>"; // close the table

			user.popup(definePopup + backButton + cardDisplay);
			break;
		case 'error':
		default:
			user.popup(definePopup + generalMenu + '<br /><center><font color="red"><strong>Invalid Command action for CardSearch</strong></font></center>');
			break;
		}
	},

	trade: 'tradecard',
	tradecard: function (target, room, user) {
		if (!target) return this.errorReply("/tradecard [card ID], [user], [targetCard ID]");
		let parts = target.split(",").map(p => toId(p));
		if (parts.length !== 3) return this.errorReply("/tradecard [your card's ID], [targetUser], [targetCard ID]");
		let match;

		// check for user's card
		let forTrade = parts[0];
		match = false;
		let userCards = Db('cards').get(user.userid, []);
		for (let i = 0; i < userCards.length; i++) {
			if (userCards[i].title === forTrade) {
				match = true;
				break;
			}
		}
		if (!match) return this.errorReply("You don't have that card!");

		// check for target's card
		let targetUser = parts[1];
		let targetTrade = parts[2];

		let targetCards = Db('cards').get(targetUser, []);
		match = false;
		for (let i = 0; i < targetCards.length; i++) {
			if (targetCards[i].title === targetTrade) {
				match = true;
				break;
			}
		}

		if (!match) return this.errorReply(targetUser + " does not have that card!");

		// initiate trade
		let tradeId = uuid.v1();
		let newTrade = {
			from: user.userid,
			to: targetUser,
			fromExchange: forTrade,
			toExchange: targetTrade,
			id: tradeId,
		};

		Db('cardtrades').set(tradeId, newTrade);

		// send messages
		this.sendReply("Your trade has been taken submitted.");
		if (Users.get(targetUser)) Users.get(targetUser).send("|pm|~" + Config.serverName + " Server|" + Server.nameColor(targetUser) + "|/raw <div class=\"broadcast-green\">" + Server.nameColor(user.name, true) + " has initiated a trade with you.  Click <button name=\"send\" value=\"/trades last\">here</button> or use <strong>/trades</strong> to view your pending trade requests.</div>");
		user.send("|pm|~" + Config.serverName + " Server|" + Server.nameColor(user.userid) + "|/raw <div class=\"broadcast-green\">Your trade with " + Server.nameColor(targetUser, true) + " has been initiated.  Click <button name=\"send\" value=\"/trades last\">here</button> or use <strong>/trades</strong> to view your pending trade requests.</div>");
	},

	trades: 'viewcardtrades',
	viewcardtrades: function (target, room, user) {
		// popup variables
		const popup = "|html|<center><strong><font color=\"blue\">Trade Manager</font></strong></center><br />";

		// get the user's trades
		let allTrades = Db('cardtrades').object();
		let userTrades = [];
		for (let id in allTrades) {
			let trade = allTrades[id];
			if (trade.from === user.userid || trade.to === user.userid) {
				// push this into the user's trade data
				userTrades.push(trade);
			}
		}

		// if no pending trades
		if (!userTrades.length) return user.popup(popup + "<center>You have no pending trades.</center>");

		// build trade manager screen
		// decide which trade to display
		if (target === "last") {
			target = userTrades.length - 1;
		} else {
			// when there is no target (initial use of command)
			if (!target) target = 0;
			target = parseInt(target);
			if (isNaN(target)) target = 0;
			if (target < 0) target = 0;
			if (target >= userTrades.length) target = userTrades.length - 1;
		}

		// show trade details
		let displayTrade = userTrades[target];
		const acceptReject = '<center>' + (displayTrade.from === user.userid ? "" : '<button name="send" value="/tradeaction accept, ' + displayTrade.id + '" style="background-color:green;height:30px"><strong>Accept</strong></button>') + // accept button
			'&nbsp;&nbsp;' + // spacing
			'<button name="send" value="/tradeaction ' + (displayTrade.from === user.userid ? "cancel" : "reject") + ', ' + displayTrade.id + '" style="background-color:red;height:30px"><strong>' + (displayTrade.from === user.userid ? "Cancel" : "Reject") + '</strong></button></center>' + // reject button
			'<br /><br />'; // new line

		// build the user's card first
		let card = cards[(displayTrade.from === user.userid ? displayTrade.fromExchange : displayTrade.toExchange)];
		// the image
		let cardImage = '<img src="' + card.card + '" height=250>';
		// rarity display
		let cardRarityPoints = '(<font color="' + colors[card.rarity] + '">' + card.rarity + '</font> - ' + card.points + ')<br />';
		let userSideDisplay = '<center>' + Server.nameColor(user.userid, true) + '<br />' + cardImage + "<br />" + cardRarityPoints + '</center>';

		// now build the target's side
		card = cards[(displayTrade.from !== user.userid ? displayTrade.fromExchange : displayTrade.toExchange)];
		// the image
		cardImage = '<img src="' + card.card + '" height=250>';
		// rarity display
		cardRarityPoints = '(<font color="' + colors[card.rarity] + '">' + card.rarity + '</font> - ' + card.points + ')<br />';
		let targetSideDisplay = "<center>" + (displayTrade.from !== user.userid ? Server.nameColor(displayTrade.from, true) : Server.nameColor(displayTrade.to, true)) + '<br />' + cardImage + "<br />" + cardRarityPoints + "</center>";

		// now build the entire popup
		let tradeScreen = popup + // base popup
			'<center><table><tr><td>' + // table element
			userSideDisplay +
			'</td><td>' + // next column
			targetSideDisplay +
			'</td></tr></table></center><br />' + // close table and add new line
			acceptReject;

		// build the navigation bar
		// build max and min
		let navigationButtons;
		if (userTrades.length === 1) {
			navigationButtons = '<center><button style="background-color:deepskyblue;height:30px;width:30px">1</button></center>';
		} else {
			// build min and mas
			let min = '<button style="background-color:lightblue;height:30px;width:30px" name="send" value="/viewcardtrades 0">1</button>&nbsp;&nbsp;&nbsp;';
			let max = '&nbsp;&nbsp;&nbsp;<button style="background-color:lightblue;height:30px;width:30px" name="send" value="/viewcardtrades last">' + (userTrades.length) + '</button>';
			// lazy replace for colour
			if (target === 0) min = min.replace("background-color:lightblue;height:30px", "background-color:deepskyblue;height:30px");
			if (target === userTrades.length - 1) max = max.replace("background-color:lightblue;height:30px", "background-color:deepskyblue;height:30px");

			let middle = "";
			// build range
			let range = Object.keys(userTrades).slice(1, userTrades.length - 1); // remove min and max and turn it into a array of numbers
			if (range.length !== 0) { // only build middle buttons is there is none
				if (range.length > 5) {
					// find the current one and get 2 above and below
					let displayRange = [target - 2, target - 1, target, target + 1, target + 2].filter(i => {
						return i > 0 && i <= range.length;
					});
					// build middle buttons
					middle = (displayRange[0] !== 1 ? "... " : "") + displayRange.map(n => {
						n = parseInt(n);
						let style = n === target ? "background-color:deepskyblue;height:30px;width:30px" : "background-color:aliceblue;height:30px;width:30px";
						return '<button style="' + style + '" name="send" value="/viewcardtrades ' + n + '">' + (n + 1) + '</button>';
					}).join("&nbsp;") + (displayRange[displayRange.length - 1] !== range.length ? " ..." : "");
				} else {
					// just map the range
					middle = range.map(n => {
						n = parseInt(n);
						let style = n === target ? "background-color:deepskyblue;height:30px;width:30px" : "background-color:aliceblue;height:30px;width:30px";
						return '<button style="' + style + '" name="send" value="/viewcardtrades ' + n + '">' + (n + 1) + '</button>';
					}).join("&nbsp;");
				}
			}
			// add the stuff to navigation buttons
			navigationButtons = "<center>" + min + middle + max + "</center>";
		}
		// add the navigation buttons to the popup
		user.lastTradeCommand = "/viewcardtrades " + target;
		tradeScreen += navigationButtons;
		user.popup(tradeScreen);
	},

	tradeaction: function (target, room, user) {
		if (!target) return false; // due to the complexity of the command, this should only be used through the viewtrades screen
		let parts = target.split(",").map(p => p.trim());
		let action = toId(parts.shift());
		const backButton = '<button name="send" value="' + (user.lastTradeCommand || '/viewcardtrades') + '" style="background-color:aliceblue;height:30px">< Back</button><br /><br />';
		const tradeError = "|html|" + backButton + '<center><font color="red"><strong>ERROR: Invalid Trade / You cannot accept your own trade request!</strong></font><center>';
		let trade;
		switch (action) {
		case 'confirmaccept':
		case 'accept':
			if (!parts[0]) return false;
			if (action === "accept") {
				// make the user confirm the decision
				// build a back button
				return user.popup("|html|" + backButton + // back button
				'<center><button name="send" value="/tradeaction confirmaccept, ' + parts[0] + '" style="background-color:red;height:65px;width:150px"><strong>Confirm Trade</strong></button></center>');
			}
			// finalize trade
			// get the trade
			trade = Db('cardtrades').get(parts[0], null);
			if (!trade) return user.popup(tradeError);

			// check if the trade involves the user
			let accepter, otherTarget;
			if (trade.to === user.userid) {
				accepter = "to";
				otherTarget = "from";
			} else {
				// user has no say in this trade
				return user.popup(tradeError);
			}

			let match;
			// now double check that both users still have those cards
			// check user first
			match = false;
			let userCards = Db('cards').get(user.userid, []);
			for (let i = 0; i < userCards.length; i++) {
				if (userCards[i].title === trade[accepter + "Exchange"]) {
					match = true;
					break;
				}
			}

			if (!match) return this.parse('/tradeaction forcecancel, ' + trade.id);

			// check target
			match = false;
			let targetCards = Db('cards').get(trade[otherTarget], []);
			for (let i = 0; i < targetCards.length; i++) {
				if (targetCards[i].title === trade[otherTarget + "Exchange"]) {
					match = true;
					break;
				}
			}
			if (!match) return this.parse('/tradeaction forcecancel, ' + trade.id);

			// now go ahead with the trade!
			// for "from" first
			addCard(trade.from, trade.toExchange);
			removeCard(trade.fromExchange, trade.from);

			// apply the actions to "to"
			addCard(trade.to, trade.fromExchange);
			removeCard(trade.toExchange, trade.to);

			// update points
			Db('points').set(trade.to, getPointTotal(trade.to));
			Db('points').set(trade.from, getPointTotal(trade.from));

			// remove the trade
			Db('cardtrades').delete(parts[0]);

			// on trade success
			// send popups to both user and target saying the trade with user was a success
			// and a button to view the card they just received
			let targetUsers = [Users.get(trade.to), Users.get(trade.from)];
			if (targetUsers[0]) {
				targetUsers[0].popup("|html|" + backButton + "<center>Your trade with " + Server.nameColor(trade.from, true) + " has gone through." +
				"<br /><button name=\"send\" value=\"/cs card, " + trade.fromExchange + "\">View Traded Card</button></center>"); // show card
			}
			if (targetUsers[1]) {
				targetUsers[1].popup("|html|<center>Your trade with " + Server.nameColor(trade.to, true) + " has gone through." +
				"<br /><button name=\"send\" value=\"/cs card, " + trade.toExchange + "\">View Traded Card</button></center>");
			}

			// log trades and delete the data from list of trades.
			let now = Date.now().toString();
			Db('completedTrades').set(now, trade);
			break;
		case 'forcecancel':
		case 'cancel':
		case 'reject':
			if (!parts[0]) return false;
			// check for trade
			trade = Db('cardtrades').get(parts[0], null);

			if (!trade) return user.popup(tradeError);

			// additional consts
			const popupText = {
				forcecancel: "The trade has automatically been cancelled as one of the participants does not have that card anymore.",
				cancel: "You have cancelled the trade",
			};

			// check if user is involved
			if (trade.from === user.userid || trade.to === user.userid) {
				// check that the action is correct
				if (trade.from === user.userid && action === "reject") action = "cancel";
				if (trade.to === user.userid && action !== "reject" && action !== "forcecancel") action = "reject";
			} else {
				return user.popup(tradeError);
			}

			// remove the trade
			Db('cardtrades').delete(parts[0]);

			// letting the users involved know
			let targetUser;
			if (action === "reject") {
				targetUser = Users.get(trade.from);
				if (targetUser) targetUser.popup("Your trade request with " + user.userid + " was rejected");
				user.popup("|html|" + backButton + "You have rejected " + trade.from + "'s trade request.");
			} else {
				user.popup("|html|" + backButton + popupText[action]);
			}
			break;
		}
	},

	confirmtransfercard: 'transfercard',
	transfercard: function (target, room, user, connection, cmd) {
		if (!target) return this.errorReply("/transfercard [user], [card ID]");
		if (toId(target) === user) return this.errorReply("You cannot transfer cards to yourself.");
		let parts = target.split(",").map(p => toId(p));
		// find targetUser and the card being transfered.
		let targetUser = parts.shift();
		let card = parts[0];
		if (!targetUser || !card) return this.errorReply("/transfercard [user], [card ID]");

		if (cmd === "transfercard") {
			return user.popup('|html|<center><button name="send" value="/confirmtransfercard ' + target + '" style="background-color:red;height:65px;width:150px"><strong><font color="white" size=3>Confirm Transfer to ' + targetUser + '</font></strong></button>');
		}
		// check if card can been removed
		let canTransfer = removeCard(card, user.userid);
		if (!canTransfer) return user.popup("Invalid card.");
		// complete transfer
		addCard(targetUser, card);

		Db('points').set(targetUser, getPointTotal(targetUser));
		Db('points').set(user.userid, getPointTotal(user.userid));

		// build transfer profile
		let newTransfer = {
			from: user.userid,
			to: targetUser,
			transfer: card,
		};
		// log it
		let now = Date.now().toString();
		Db('completedTrades').set(now, newTransfer);
		user.popup("You have successfully transfered " + card + " to " + targetUser + ".");
	},

	confirmtransferallcards: 'transferallcards',
	transferallcards: function (target, room, user, connection, cmd) {
		if (!target) return this.errorReply("/transferallcards [user]");
		if (toId(target) === user) return this.errorReply("You cannot transfer cards to yourself.");
		let targetUser = toId(target);
		if (!targetUser) return this.errorReply("/transferallcards [user]");
		let userCards = Db('cards').get(user.userid, []);
		let targetCards = Db('cards').get(targetUser, []);

		if (!userCards.length) return this.errorReply("You don't have any cards.");

		// confirmation
		if (cmd === "transferallcards") {
			return user.popup('|html|<center><button name="send" value="/confirmtransferallcards ' + target + '" style="background-color:red;height:65px;width:150px"><strong><font color="white" size=3>Confirm Transfer to ' + targetUser + '</font></strong></button>');
		}

		// now the real work
		Db('cards').set(targetUser, targetCards.concat(userCards));
		Db('cards').set(user.userid, []);

		Db('points').set(targetUser, getPointTotal(targetUser));
		Db('points').set(user.userid, getPointTotal(user.userid));

		user.popup("You have transfered all your cards to " + targetUser + ".");

		let newTransfer = {
			from: user.userid,
			to: targetUser,
			transfer: "all",
		};

		let now = Date.now().toString();
		Db('completedTrades').set(now, newTransfer);
	},

	psgo: 'cardshelp',
	cardshelp: function (target, room, user) {
		if (!this.runBroadcast()) return;
		return this.sendReplyBox("<center><strong><u>PSGO Help:</u></strong></center><br>" +
			"<strong>/buypack</strong> - Buys a pack from the pack shop.<br>" +
			"<strong>/packshop</strong> - Shows the shop for buying packs.<br>" +
			"<strong>/openpack</strong> - Opens a pack that has been purchased from the shop.<br>" +
			"<strong>/packs</strong> - Shows a display of all your unopened packs.<br>" +
			"<strong>/showcase</strong> - Shows a display of all cards that you have.<br>" +
			"<strong>/card</strong> - Shows data and information on any specifc card.<br>" +
			"<strong>/cardladder</strong> - Shows the leaderboard of the users with the most card points.<br>" +
			"<strong>/cardsearch</strong> - Opens a window allowing you to search through all the cards.<br>" +
			"<strong>/trade</strong> - /trade [user's card], [targetUser], [targetUser's card] - starts a new trade request.<br>" +
			"<strong>/trades</strong> - View your current pending trade requests.<br>" +
			"<strong>/transfercard</strong> - /transfercard [targetUser], [card] - transfers a card to the target user.<br>" +
			"<strong>/transferallcards</strong> - /transferallcards [user] - transfers all of your cards to the target user.<br>" +
			"<strong>/spawncard</strong> - /spawncard [user], [card] - Gives a user a specific card from console.<br>" +
			"<strong>/takecard</strong> - /takecard [user], [card] - Forcefully deletes a user's specified card.<br>" +
			"<strong>/resetcards</strong> - /resetcards [user] - Forcefully resets a user's card collection.<br>"
		);
	},

	givecard: 'spawncard',
	spawncard: function (target, room, user, connection, cmd) {
		if (!this.can('ban')) return false;
		if (!target) return this.errorReply("/givecard [user], [card ID]");
		let parts = target.split(",").map(p => toId(p));
		// find targetUser and the card being given.
		let targetUser = parts.shift();
		let card = parts[0].trim();
		if (!targetUser || !card) return this.errorReply("/givecard [user], [card ID]");
		if (!cards[card]) return this.sendReply(target + ": card not found.");
		//Give the card to the user.
		card = cards[card];
		addCard(targetUser, card.title);
		user.popup("You have successfully given " + card.name + " to " + Server.nameColor(targetUser) + ".");
		this.logModCommand(user.name + "gave the card '" + card.name + "' to " + targetUser + ".");
	},

	takecard: function (target, room, user, connection, cmd) {
		if (!this.can('ban')) return false;
		if (!target) return this.errorReply("/takecard [user], [card ID]");
		let parts = target.split(",").map(p => toId(p));
		// find targetUser and the card being taken.
		let targetUser = parts.shift();
		let card = parts[0].trim();
		if (!targetUser || !card) return this.errorReply("/takecard [user], [card ID]");
		if (!cards[card]) return this.sendReply(target + ": card not found.");
		//Take the card from the user.
		card = cards[card];
		removeCard(card.title, targetUser);
		user.popup("You have successfully taken " + card.name + " from " + Server.nameColor(targetUser) + ".");
		this.logModCommand(user.name + " took the card '" + card.name + "' from " + targetUser + ".");
	},
	resetcards: function (target, room, user) {
		if (!this.can('forcewin')) return false;
		Db('cards').set(toId(target), 0);
		this.sendReply(Server.nameColor(target) + " has had their cards reset.");
	},
	resetcardshelp: ["/resetcards [user] - Reset user's card collection."],
};
