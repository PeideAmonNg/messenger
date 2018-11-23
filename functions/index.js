const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.newPostcard = functions.database.ref('/postcards/{pushId}')
.onCreate((snapshot, context) => {
	// Grab the current value of what was written to the Realtime Database.
	const original = snapshot.val();
	let fromUid = original.from.uid, toUid = original.to.uid;

	console.log('Uppercasing', context.params.pushId, original);
	// const uppercase = original.toUpperCase();
	// You must return a Promise when performing asynchronous tasks inside a Functions such as
	// writing to the Firebase Realtime Database.
	// Setting an "uppercase" sibling in the Realtime Database returns a Promise.
	// let sentCount = firebase.database.child(`/postcardCount/sent/${fromUid}/${toUid}`).val() || 0;
	return admin.database().ref(`/postcardCount/sent/${fromUid}/${toUid}`).once('value', s  => {
		let sentCount = s.val()	|| 0;
		sentCount++;

		admin.database().ref(`/postcardCount/sent/${fromUid}/${toUid}`).set(sentCount);

		admin.database().ref(`/postcardCount/received/${toUid}/${fromUid}`).once('value', s  => {
			let receivedCount = s.val() || 0;
			receivedCount++;

			admin.database().ref(`/postcardCount/received/${toUid}/${fromUid}`).set(receivedCount);
		});
	});
	// functions.database.
	// let sentCount = firebase.database.child(`/postcardCount/sent/${fromUid}/${toUid}`).val() || 0;
	// return functions.database.ref().set({sentCount: ++sentCount})
	
	// return snapshot.ref.parent.child('uppercase').set(uppercase);
});
		
// exports.calculateMatchingInterests = functions.database.ref('/users/{uid}/interests')
// 	.onCreate((snapshot, context) => {
// 		let interests = snapshot.val();
// 		console.log(interests);
// 	});

exports.countMatchingInterests = functions.auth.user().onCreate((user) => {
	//get all users' interests
	// admin.auth().listUsers().then(result => {
	// 	for (i = 0; i < result.length; i++) { 
	// 		text += cars[i] + "<br>";
	// 	}
	// });

	getMatchingInterestsCount = (uIntersts, myInterests) => {
		return Math.floor(Math.random() * 20);   
	}

	getMyIntersts = () => {
		// array containing id of interests
		return [1, 5, 9, 12, 44];
	}

	sortUsersByHighestCount = (userToCount) => {
		console.log('sortUsersByHighestCount userToCount', userToCount);
		return userToCount;
	}
	
	// get max number of top users
	getTopUsers = (userToCount, max) => {
		console.log
		return userToCount;
	}

	saveTopUsers = userToCount => {		
		admin.database().ref(`matchingInterestsCount/${user.uid}`).set(userToCount);
	}

	return admin.database().ref('userInterests').once('value', s => {
		let userToMatchingInterestsCount = {};

		s.forEach(u => {
			const uid = u.key;
			const uIntersts = u.val();

			console.log('uid', uid);
			console.log('uInterests', uIntersts);

			userToMatchingInterestsCount[uid] = getMatchingInterestsCount(uIntersts, getMyIntersts());

			console.log('after getMatchingInterestsCount', userToMatchingInterestsCount);
		});

		console.log('after s.forEach', userToMatchingInterestsCount);

		userToMatchingInterestsCount = sortUsersByHighestCount(userToMatchingInterestsCount);

		console.log('after sortUsersByHighestCount', userToMatchingInterestsCount);

		userToMatchingInterestsCount = getTopUsers(userToMatchingInterestsCount, 20);

		console.log('after getTopUsers', userToMatchingInterestsCount);

		saveTopUsers(userToMatchingInterestsCount);
	});

});