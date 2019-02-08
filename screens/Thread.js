import React from 'react';
import {Text, TextInput, View, ToastAndroid, FlatList, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import firebase from 'react-native-firebase';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

export class ThreadScreen extends React.Component {
	static navigationOptions = ({navigation}) => {		
		let users = navigation.getParam('users');
		return makeHeader(users 
			? users.map(u => u.name).join(', ') 
			: ''
		);
	}		

	constructor(props) {
		super(props);
		this.state = {
			messages: {},
			msg: null,
			image: null,
			msgCount: 10,
			isFetching: false,
			lastMsgKey: '',
			gotAllMessages: false,
			threadId: '',
			loadMoreMessages: false
		}
		
		this.handleViewableItemsChanged = this.handleViewableItemsChanged.bind(this)
		this.viewabilityConfig = {viewAreaCoveragePercentThreshold: 80}
	}	
	
	componentWillUnmount() {
		if(this.messagesRef) {
			this.messagesRef.off();
		}
	}

	async componentDidMount() {
		const threadId = this.props.navigation.getParam('threadId');
		if(threadId) {
			this.setState({threadId}, async () => {
				this.getUsers(threadId);
				await this.getMessages(threadId);
				this.addNewMessageListener(threadId);
			});			
		} else {
			// Find if there is a thread with the user/s

			let users = [];
			
			this.props.navigation.getParam('users').map(u => users.push(u.uid));
			users.push(firebase.auth().currentUser.uid);

			var serialisedUsers = users.sort().join(' ');

			firebase.database().ref(`threads`).orderByChild('serialisedUsers').equalTo(serialisedUsers).once('value', snapshot => {
				if(snapshot.val()) {
					var threadId = Object.keys(snapshot.val())[0];
				}

				var newState = {};

				if(threadId) {
					newState.threadId = threadId;
				}
				if(!threadId) {
					newState = {...newState, ...{isFetching: false, fetched: true}};
				}

				this.setState(newState,
					async () => {
						if(!!threadId) {
							await this.getMessages(threadId);
							this.addNewMessageListener(threadId);
						}
					}
				
				);
			});
		}
	}

	loadMoreMessages(threadId) {
		if(this.state.gotAllMessages) {
			return new Promise(resolve => {
				resolve('done');
			});
		}

		this.setState({isFetching: true, fetched: false});

		return new Promise((resolve, reject) => {
			var messagesRef = firebase.database().ref(`threads/${threadId}/messages`).orderByKey().endAt(this.state.lastMsgKey).limitToLast(4);
			
			messagesRef.once('value', snapshot => {		
				var gotAllMessages = true;
				var lastMsgKey = this.state.lastMsgKey;
				var messages = snapshot.val();
				if(messages) {
					for(var key in messages) {
						messages[key].key = key;
					};	
					
					gotAllMessages = Object.keys(messages).length < 3;			
					lastMsgKey = Object.keys(messages).sort()[0];
				}

				this.setState({messages: {...this.state.messages, ...messages}, 
					isFetching: false, 
					fetched: true,
					gotAllMessages,
					lastMsgKey
				}, () => {
					resolve('done');
				});
			});
		});
	}


	addNewMessageListener(threadId) {

			this.messagesRef = firebase.database().ref(`threads/${threadId}/messages`).limitToLast(1);
			// this.messagesRef.on('value', snapshot => {		
			// 	var messages = snapshot.val();
			// 	var changingUploadStatus = false;
			// 	if(messages) {
			// 		for(var key in messages) {
			// 			var msg = messages[key];
			// 			msg.key = key;

			// 			if(key in this.state.messages && this.state.messages[key].uploadStatus === 'uploading') {
			// 				msg.uploadStatus = 'sending';
			// 				newMessages[key] = msg;
			// 				changingUploadStatus = true;
			// 			} else if(key in this.state.messages && this.state.messages[key].uploadStatus === 'sending') {
			// 				msg.uploadStatus = 'sent';
			// 				newMessages[key] = msg;
			// 				changingUploadStatus = true;
			// 			} else if(key in this.state.messages && this.state.messages[key].uploadStatus === 'sent') {
			// 				delete msg.uploadStatus;
			// 				newMessages[key] = msg;
			// 			} 
			// 		};	

			// 		// New message received
			// 		if(!changingUploadStatus) {
			// 			newMessages = {...messages};
			// 		}
			// 	}

			// 	if(!!Object.keys(newMessages).length) {
			// 		this.setState({messages: {...this.state.messages, ...newMessages}
			// 			}, () => {
			// 				resolve('done');
			// 			});
			// 	} else {
			// 		resolve('done');
			// 	}
			// });

			this.messagesRef.on('child_added', snapshot => {

				var msg = snapshot.val();

				if(snapshot.key == this.state.uploadingMsgKey) {
					

					if(this.state.messages[snapshot.key].uploadStatus == 'uploading') {
						msg.uploadStatus = 'sent';
						msg.key = snapshot.key;
					}

					this.setState({messages: {...this.state.messages, ...{[snapshot.key]: msg}}});

				}

				// New message received from another user
				if(!(snapshot.key in this.state.messages)) {					

					var msg = snapshot.val();
					msg.key = snapshot.key;

					this.setState({messages: {...this.state.messages, ...{[snapshot.key]: msg}}});
				}
			})
			
	}

	getMessages(threadId) {

		this.setState({isFetching: true, fetched: false});

		return new Promise((resolve, reject) => {
			var messagesRef = firebase.database().ref(`threads/${threadId}/messages`).limitToLast(10);
			
			messagesRef.once('value', snapshot => {		
				var messages = snapshot.val();
				if(messages) {
					for(var key in messages) {
						var msg = messages[key];
						msg.key = key;
					};	
					
					var lastMsgKey = Object.keys(messages).sort()[0];
				}

				this.setState({messages: messages || {}, 
					isFetching: false, 
					fetched: true,
					gotAllMessages: !messages || Object.keys(messages).length < 10,
					lastMsgKey
				}, () => {
					resolve('done');
				});
			});
		});
	}

	getUsers(threadId) {
		firebase.database().ref(`threads/${threadId}/users`).on('value', snapshot => {
			let users = snapshot.val();
			if(users) {
				this.props.navigation.setParams({users: delete users[firebase.auth().currentUser.uid] && Object.values(users)});
			}
		});
	}

	handleViewableItemsChanged(info) {
	}

	// Create thread with users
	initialiseThread() {
		return new Promise((resolve, reject) => {

			let user = firebase.auth().currentUser;
			const threadId = firebase.database().ref('threads').push().key;

			let usersObject = {};
			
			this.props.navigation.getParam('users').map(u => usersObject[u.uid] = {
				name: u.name,
				photoURL: u.photoURL
			});

			usersObject[user.uid] = {
				name: user.displayName,
				photoURL: user.photoURL
			}

			firebase.database().ref(`threads/${threadId}`).set({
				users: usersObject,
				serialisedUsers: Object.keys(usersObject).sort().join(' ')
			}, err => {
				if(err) {
					ToastAndroid.show('Error initialising thread', ToastAndroid.SHORT);
					return;
				}

				this.setState({threadId, isFetching: false}, async () => {
					// await this.getMessages(threadId);
					await this.addNewMessageListener(threadId);
					resolve(threadId)
				});
			});
		});
	}

	async sendMsg(messages, msg, image) {

		let user = firebase.auth().currentUser;

		// const threadId = this.props.navigation.getParam('threadId') || this.state.threadId || await this.initialiseThread();
		let threadId;
		
		try{
			threadId = this.state.threadId || await this.initialiseThread();
		} catch(err) {
			return;
		}

		let timestamp = firebase.database.ServerValue.TIMESTAMP;


		let msgObject = {
			timestamp: timestamp,
			msg: msg,
			image: image,
			user: {
				uid: user.uid,
				name: user.displayName,
				photoURL: user.photoURL
			}
		};

		let msgKey = firebase.database().ref(`threads/${threadId}/messages`).push().key;

		this.setState({
			msg: null,
			image: null,
			messages: {
				...messages,
				[msgKey]: {
					...msgObject,
					key: msgKey,
					uploadStatus: 'uploading'
				}
			}
		});
		
		uploadMsg = imageURL => {
			firebase.database().ref(`threads/${threadId}/messages/${msgKey}`).set({
				...msgObject,
				image: imageURL
			}, err => {
				if(err) {
					console.log('err', err);
					ToastAndroid.show('message not sent', ToastAndroid.SHORT);
				} else {
				}
			})
			
			this.setState({msg: '', image: '', uploadingMsgKey: msgKey});
		};

		if(image) {
			let key = firebase.database().ref('postcards').push().key;
			firebase.storage().ref('postcardImages').child(key + '.jpeg').putFile(image)
				.then(snapshot => uploadMsg(snapshot.downloadURL))
				.catch(err => {
					console.log('err', err);
					ToastAndroid.show('message not sent', ToastAndroid.SHORT);
				});
		} else {
			uploadMsg(null);
		}
	}
	
	showImagePicker(){
		const options = {
			title: 'Select Photo',
			storageOptions: {
				skipBackup: true,
				path: 'images',
			},
		};
		
		ImagePicker.showImagePicker(options, (response) => {																
			
  		if(response.didCancel) {
				// user cancelled
			} else if(response.error) {
				Alert.alert('Error selecting image', response.error);
			} else {

				// ImageResizer.createResizedImage(response.uri, 1920, 1920, 'JPEG', 50, 0, null).then((response) => {
				// ImageResizer.createResizedImage(response.uri, 1280, 1280, 'JPEG', 50, 0, null).then((response) => {					
				ImageResizer.createResizedImage(response.uri, 1280, 1280, 'JPEG', 50, 0, null).then((response) => {
					this.setState({
						image: response.uri
					});
				}).catch((err) => {
					console.log('err', err);
					ToastAndroid.show('failed to resize image', ToastAndroid.SHORT);
				});
				
			}
		});
	}

  render() {
		const uid = firebase.auth().currentUser.uid;
		const threadId = this.props.navigation.getParam('threadId') || this.state.threadId;
		
		var messages = [];
						
		if(Object.keys(this.state.messages).length > 0) {

			Object.keys(this.state.messages).sort().forEach(key => {
				messages.push(this.state.messages[key]);
			});
		}

		messages = messages.reverse();
		
    return (
			<View style={{flex: 1, backgroundColor: 'white'}}>
				{this.state.isFetching &&
					<ActivityIndicator size='large' style={{flex: 1}} />
				}
				
				{messages.length > 0 
					? <FlatList
						contentContainerStyle={{paddingBottom: 10}}
						data={messages}
						onScroll={event => {
							this.flatListLastOffset = event.nativeEvent.contentOffset.y;
							// if(event.nativeEvent.contentSize.height != this.newHeight) {
								this.flatListHeight = event.nativeEvent.contentSize.height;
							// }
							
						}}
						onViewableItemsChanged={this.handleViewableItemsChanged}
						onContentSizeChange={(width, height)=>{
						}}
						viewabilityConfig={this.viewabilityConfig}
						ref={ref => this.scrollView = ref}
						onEndReachedThreshold={0.01}
						onEndReached={(info)=>{
							this.loadMoreMessages(this.state.threadId);
						}}
						inverted={true}
						ListEmptyComponent = {<View></View>}
						renderItem={({item: msg, index}) => {				
							if(!msg) return;
							
							return (<View key={msg.key} style={{flexDirection: 'row', marginBottom: 5}}>
								<View style={{flex: msg.user.uid == uid ? 0.5 : 0 }}></View>
								<View style={{flex: 2}}>
									<View style={{flexDirection: 'row', flex: 1, flexGrow: 1}}>
										{ 
											index == messages.length - 1 || msg.user.uid != messages[index+1].user.uid
											?
											<Image 
												source={{uri: msg.user.photoURL}}
												style={{width: 40, height: 40, borderRadius: 5}}
											/> :
											<View style={{width: 40, height: 40}}/>
										}
										
										<View style={{paddingLeft: 5, paddingRight: 5, flex: 1, flexDirection: 'column'}}>
											{!!msg.image && 
												<Image
													source={{uri: msg.image || ''}}
													resizeMode='cover'
													style={{
														width: '100%',
														height: 100
													}}
												/>
											}
											<View 
												style={{borderColor: 'lightgray', borderWidth: 1, padding: 5,												
													borderBottomLeftRadius: 5, borderBottomRightRadius: 5,
													borderTopRightRadius: msg.image ? 0 : 5, borderTopLeftRadius: msg.image ? 0 : 5}}
											>
												<Text>{msg.msg}</Text>
												<Text style={{fontSize: 10, color: 'gray'}}>
													{/* {`${("0" + new Date(msg.timestamp).getHours()).substr(-2,2)}:${("0" + new Date(msg.timestamp).getMinutes()).substr(-2,2)}`} */}
													{typeof msg.timestamp == 'number' && timeAgo.format(msg.timestamp)}
												</Text>
												{msg.uploadStatus && 
													<Text style={{fontSize: 10, color: '#039BE5'}}>{msg.uploadStatus}</Text>
												}
											</View>
										</View>
									</View>
										
								</View>
								<View style={{flex: msg.user.uid !== uid ? 0.5 : 0 }}></View>
							</View>)
						}}					
					/>
					: <View style={{flex: 1}}></View>
				}

				<View style={{flexDirection: 'column'}}>
					<View style={{borderTopColor: 'lightgray', borderTopWidth: 1, height: 50, padding: 10, alignItems: 'center', flexDirection: 'row'}}>
						{!!this.state.image && 
							<Image 
								source={{uri: this.state.image}}
								style={{width:30, height: 30}}
							/>
						}

						<TouchableOpacity
							style={{flex: 1}}
							onPress={()=>{if(!this.state.image) this.showImagePicker(); else this.setState({image: null});}}>
								<Text style={{color: styles.textColor}}>{this.state.image ? ' remove' : 'add photo'}</Text>
						</TouchableOpacity>
					</View>
					<View style={{flexDirection: 'row', borderTopColor: 'lightgray', borderTopWidth: 1, maxHeight: 100, padding: 5 }}>
						<View style={{flex: 1, marginRight: 5}}>
							<TextInput
								placeholder='write'
								multiline={true}
								value={this.state.msg}
								onChangeText={text => this.setState({msg: text})}
								style={{padding: 5}}
							/>
						</View>
						{(!!this.state.msg || !!this.state.image) &&
							<TouchableOpacity
								onPress={() => {
									this.sendMsg(this.state.messages, this.state.msg, this.state.image)}
								}
								style={{alignSelf: 'flex-end'}}
							>
								<Text style={{padding: 5, fontWeight: 'bold', color: styles.textColor}}>Send</Text>
							</TouchableOpacity>
						}
					</View>
				</View>
      </View>
    );
  }
}