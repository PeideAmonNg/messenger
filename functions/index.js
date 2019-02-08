const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.updatePostcardCount = functions.database.ref('/postcards/{postcardId}')
.onCreate((snapshot, context) => {
	// Grab the current value of what was written to the Realtime Database.
	const original = snapshot.val();
	let fromUid = original.from.uid, toUid = original.to.uid;

	// You must return a Promise when performing asynchronous tasks inside a Functions such as
	// writing to the Firebase Realtime Database.

	return admin.database().ref(`/postcardCount/${fromUid}/${toUid}`).once('value', s  => {
		let sentCount = (s.exists() && s.val().sent || 0) + 1;

		admin.database().ref(`/postcardCount/${fromUid}/${toUid}/sent`).set(sentCount);

		admin.database().ref(`/postcardCount/${toUid}/${fromUid}`).once('value', s  => {
			let receivedCount = (s.exists() && s.val().received || 0) + 1;

			admin.database().ref(`/postcardCount/${toUid}/${fromUid}/received`).set(receivedCount);
		});
	});
});
		
// exports.calculateMatchingInterests = functions.database.ref('/users/{uid}/interests')
// 	.onCreate((snapshot, context) => {
// 		let interests = snapshot.val();
// 		console.log(interests);
// 	});

countMatchingInterests = (snapshot, context) => {
	
	getMatchingInterests = (uInterests, myInterests) => {
		// return Math.floor(Math.random() * 20);   

		let interests = {};
		let count = 0;
				
		for(var key in myInterests) {
			if(uInterests[key]) {
				interests[key] = uInterests[key];
				count++;
			}
		}

		return {interests, count};
	}

	sortUsersByHighestCount = (userToCount) => {
		console.log('sortUsersByHighestCount userToCount', userToCount);
		return userToCount;
	}
	
	// get max number of top users
	getTopUsers = (userToCount, max) => {
		return userToCount;
	}

	save = userToCount => {
		admin.database().ref(`matchingInterestsCount/${context.params.uid}`).set(userToCount);
	}

	isEmpty = obj => {
    for(var key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
    return true;
	}

	return admin.database().ref('userInterests').once('value', s => {
		// Object containing uid -> {interests, count}
		let matchingInterestsCount = {};
		console.log('snapshot', snapshot);
		let myInterests = snapshot.val().interests;
		console.log('myInterests', myInterests);
		// Main user has at least one interest
		if(typeof myInterests === 'object' && !isEmpty(myInterests)) {		
			s.forEach(u => {
				const uid = u.key;
				const uInterests = u.val().interests;
				const uName = u.val().name;

				console.log('uInterests', uInterests);

				if(uid !== context.params.uid) {
					let matchingInterests = getMatchingInterests(uInterests, myInterests);

					if(matchingInterests.count > 0) {
						matchingInterestsCount[uid] = {
							interests: matchingInterests.interests,
							count: matchingInterests.count,
							name: uName
						};
					}
				}

				console.log('after getMatchingInterest', matchingInterestsCount);
			});
			
			console.log('after s.forEach', matchingInterestsCount);

			matchingInterestsCount = sortUsersByHighestCount(matchingInterestsCount);

			console.log('after sortUsersByHighestCount', matchingInterestsCount);

			matchingInterestsCount = getTopUsers(matchingInterestsCount, 20);

			console.log('after getTopUsers', matchingInterestsCount);

			save(matchingInterestsCount);
		}
	});
}

// exports.countMatchingInterests = functions.auth.user().onCreate((user) => {
exports.getMatchingInterests = functions.database.ref('/userInterests/{uid}')
	.onCreate((snapshot, context) => {
		return countMatchingInterests(snapshot, context);
	});

exports.updateMatchingInterests = functions.database.ref('/userInterests/{uid}')
	.onUpdate((snapshot, context) => {
		return countMatchingInterests(snapshot.after, context);
	});

	
exports.addToThreadsByUser = functions.database.ref('threads/{threadId}/messages/{msgId}')
.onWrite((snapshot, context) => {
	// Grab the current value of what was written to the Realtime Database.
	const original = snapshot.after.val();

	console.log(snapshot.after.val());
	console.log(context);
	// console.log('context.auth.uid ', context.auth.uid );
	console.log('context.auth.uid ', context.auth);

	return admin.database().ref(`threads/${context.params.threadId}`).once('value', s => {
		let users = s.val().users;
		let serialisedUsers = s.val().serialisedUsers;
		console.log('users', users);

		var i = 0;
		for (var key in users) {

			console.log('key oustide', key);
			console.log('i outside', i++);
			(key => {
				admin.database().ref(`threadsByUser/${key}/threads/${context.params.threadId}`).transaction(currentThread => {
					// If users/ada/rank has never been set, currentRank will be `null`.
					console.log('key inside', key);
					console.log(key === context.auth.uid);
					console.log('i inside', i++);
					return {
						lastRead: key === context.auth.uid ? original.timestamp : ((currentThread && currentThread.lastRead) || '') ,
						// lastRead: original.date,
						lastUpdated: original.timestamp,
						// ...(original.image && {image: original.image}),
						latestMsg: original.msg,
						updatedBy: original.user,
						users: users,
						serialisedUsers: serialisedUsers						
					}
				});
			})(key);
		}
	});

});