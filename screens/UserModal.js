import React from 'react';
import {Text, View, TouchableOpacity, TouchableWithoutFeedback, ToastAndroid, Image, Modal} from 'react-native';
import firebase from 'react-native-firebase';
// import Modal from 'react-native-modal';

export default class UserModal extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isModalVisible: false,
			sentCount: 0,
			receivedCount: 0,
			isFriend: false,
			selectedUser: {
				uid: '',
				userName: '',
				photoURL: ''
			}
		};

		this.addFriend = this.addFriend.bind(this);
		this.unfriend = this.unfriend.bind(this);
  };

  _toggleModal = () => {
		this.props._toggleModal();
	}
	
	resetUser() {
		this.setState({
			sentCount: 0,
			receivedCount: 0,
			isFriend: false,
			selectedUser: {
				uid: this.props.selectedUser.uid,
				userName: this.props.selectedUser.userName,
				photoURL: this.props.selectedUser.photoURL
			}
		});
	}

	fetch() {
		// if(this.props.selectedUser.uid != this.state.selectedUser.uid) {
		// 	this.resetUser();
		// }		
		
		const uid = firebase.auth().currentUser.uid;

		const user = this.props.selectedUser;

		firebase.database().ref('users').child(user.uid).once('value', snapshot => {
			if(snapshot.exists()) {
				this.setState({
					selectedUser: {
						...this.state.selectedUser,
						uid: user.uid,
						userName: (snapshot.exists() && snapshot.val().name) || '[deleted]',
						photoURL: (snapshot.exists() && snapshot.val().photoURL) || ''
					}
				});
			} else {
				this.setState({
					selectedUser: {
						...this.state.selectedUser,
						uid: user.uid,
						userName: '[deleted]',
						photoURL: ''
					}
				});
			}
			
		});

		firebase.database().ref('friends').child(uid + '/' + user.uid)
			.once('value', snapshot => {
				this.setState({isFriend: snapshot.exists()});
			});

		firebase.database().ref(`postcardCount/${uid}/${user.uid}`)
			.once('value', snapshot => {
				this.setState({
					sentCount: (snapshot.exists() && snapshot.val().sent) || 0, 
					receivedCount: (snapshot.exists() && snapshot.val().received) || 0
				});
			});
	}

	addFriend() {
		let user = this.props.selectedUser;

		firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + user.uid)
		.set({name: user.userName, photoURL: user.photoURL},  err => {
			if(err) {
				ToastAndroid.show('Error adding Friend', ToastAndroid.SHORT);
			} else {
				this.setState({isFriend: true});
				ToastAndroid.show('Friended', ToastAndroid.SHORT);
			}
		});
	}

	unfriend() {
		let user = this.props.selectedUser;

		firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + user.uid)
			.remove(err => {
				if(err) {
					ToastAndroid.show('Error unfriending', ToastAndroid.SHORT);
				} else {
					this.setState({isFriend: false});
					ToastAndroid.show('Unfriended', ToastAndroid.SHORT);
				}
			});
	}

  render() {
		// let user = this.props.selectedUser;
		// let user = this.props.selectedUser;

		return <Modal
			animationType="fade"
			transparent={true}
			visible={this.props.isModalVisible}
			onRequestClose={() => {
				// Alert.alert('Modal has been closed.');
				this._toggleModal();
			}}
			onShow={() => this.fetch()}
		>
			<TouchableWithoutFeedback
				onPress={()=>{
					this._toggleModal();
				}}
			>
				<View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
				<TouchableWithoutFeedback>
					<View style={{margin: 10, padding: 20, backgroundColor: 'white'}}>
						<View style={{flexDirection: 'row', paddingBottom: 10, borderBottomColor: 'darkgray', borderBottomWidth: 1}}>
								<View style={{flex: 1, flexDirection: 'row'}}>
									{this.state.selectedUser.photoURL
										? <Image source={{uri: this.state.selectedUser.photoURL}} style={{width: 40, height: 40, marginRight: 5}}/>
										: <View style={{width: 40, height: 40, marginRight: 5}}></View>
									}
									<View>
										<Text>{this.state.selectedUser.userName}</Text>
									</View>
									
								</View>
								<View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>	
									{this.state.isFriend
										? <Text>Friend &#10003;</Text>
										: <TouchableOpacity onPress={this.addFriend}>
												<Text>Add Friend</Text>
											</TouchableOpacity>
									}
								</View>
							</View>
							<View style={{marginTop: 10}}>
								<TouchableOpacity
									onPress={() => {
										this._toggleModal();
										var selectedUser = this.state.selectedUser;
										this.props.navigation.navigate('Thread', {users:
											[
												{uid: selectedUser.uid, name: selectedUser.userName, photoURL: selectedUser.photoURL}
											]
										});
									}}
								>
									<Text>Message</Text>
								</TouchableOpacity>
								<View style={{marginTop: 10}}>
									{this.state.isFriend && 
										<TouchableOpacity onPress={this.unfriend} >
											<Text>Unfriend</Text>
										</TouchableOpacity>
									}
								</View>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>

  }
}