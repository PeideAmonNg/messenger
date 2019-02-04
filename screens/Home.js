import React from 'react';
import {Text, View, TouchableOpacity, Image, Dimensions, FlatList} from 'react-native';
import firebase from 'react-native-firebase';
import UserModal from './UserModal';

export class ReceivedScreen extends React.Component {
	static navigationOptions = {
		title: 'Received'
	};
	
	constructor(props) {
		super(props);
		this.state = {
			postcards: [],
			isModalVisible: false,
			selectedUser: {
				uid: 's',
				userName: ''
			}
		}
	}

	// displayNotification(title, body) {
	// 	const notification = new firebase.notifications.Notification()
	// 	.setNotificationId('notificationId')		
	// 	.android.setChannelId('channelId')
	// 	.setTitle(title)
	// 	.setBody(body)
	// 	.setData({
	// 		key1: 'value1',
	// 		key2: 'value2',
	// 	});
	// 	firebase.notifications().displayNotification(notification);
	// }
		
	// listenToNewMessage() {
	// 	firebase.database().ref('postcards').orderByChild('to/uid').equalTo(firebase.auth().currentUser.uid).on('child_added', s => {
	// 		console.log('yay new postcard received', s);
			
	// 		let postcard = s.val();
	// 		this.displayNotification(`New Postcard from ${postcard.from.name}`, postcard.message.substr(0, 10) + '...');
	// 	});

	// 	firebase.database().ref('postcards').orderByChild('to/uid').equalTo(firebase.auth().currentUser.uid).on('child_changed', s => {
	// 		console.log('yay postcard changed', s);
			
	// 		let postcard = s.val();
	// 		this.displayNotification(`Changed Postcard from ${postcard.from.name}`, postcard.message.substr(0, 10) + '...');
	// 	});
	// }

	componentDidMount() {
		// this.listenToNewMessage();

		this.postcardsRef = firebase.database().ref('postcards').orderByChild('to/uid').equalTo(firebase.auth().currentUser.uid)
			.on('value', snapshot => {	
				let postcards = [];
				snapshot.forEach(postcard => {
					postcards.push({
						key: postcard.key,
						message: postcard.val().message, 
						image: postcard.val().image, 
						from: postcard.val().from.name, 
						fromUid: postcard.val().from.uid});
				});
				console.log(postcards);
				this.setState({postcards});
			});
	}

	componentWillUnmount() {
		if(this.postcardsRef) {
			this.postcardsRef();
		}
	}

	userClicked(item) {
		this.setState({selectedUser: {uid: item.fromUid, userName: item.from}, isModalVisible: true});
	}

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
				<UserModal 
					isModalVisible={this.state.isModalVisible}
					selectedUser={this.state.selectedUser}
					navigation={this.props.navigation}
					_toggleModal={()=>this.setState({isModalVisible: !this.state.isModalVisible})}
				/>
				<FlatList
					data={this.state.postcards}
					renderItem={({item}) => {
						return (
							<View style={{marginBottom: 20}}>
								<Image source={{uri: item.image}} style={{width: Dimensions.get('window').width, height: 200}}/>
								<View style={{padding: 10}}>
									<TouchableOpacity
										onPress={()=>{
											this.userClicked(item);
										}}
									>
										<Text style={{fontWeight: 'bold'}}>{item.from}</Text>
									</TouchableOpacity>
									<Text>{item.message}</Text>
								</View>
							</View>
						);
					}}
				/>
      </View>
    );
  }
}

export class SentScreen extends React.Component {
	static navigationOptions = {
		title: 'Sent'
	};

	constructor(props) {
		super(props);
		this.state = {
			postcards: [],
			isModalVisible: false,
			selectedUser: {
				uid: 's',
				userName: ''
			}
		}
	}
		
	componentDidMount() {
		this.postcardsRef = firebase.database().ref('postcards').orderByChild('from/uid').equalTo(firebase.auth().currentUser.uid)
			.on('value', snapshot => {
				let postcards = [];
				snapshot.forEach(postcard => {
					postcards.push({
						key: postcard.key, 
						message: postcard.val().message, 
						image: postcard.val().image, 
						to: postcard.val().to.name, 
						toUid: postcard.val().to.uid});
				});
				this.setState({postcards});
			});
	}

	componentWillUnmount() {
		if(this.postcardsRef) {
			this.postcardsRef();
		}
	}

	userClicked(item) {
		this.setState({selectedUser: {uid: item.toUid, userName: item.to}, isModalVisible: true});
	}

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
				<UserModal 
					isModalVisible={this.state.isModalVisible}
					selectedUser={this.state.selectedUser}			
					navigation={this.props.navigation}
					_toggleModal={()=>this.setState({isModalVisible: !this.state.isModalVisible})}
				/>
				<FlatList
					data={this.state.postcards}
					renderItem={({item}) => {
						return (
							<View style={{marginBottom: 20}}>
								<Image source={{uri: item.image}} style={{width: Dimensions.get('window').width, height: 200}}/>
								<View style={{padding: 10}}>
									<TouchableOpacity
										onPress={()=>{
											this.userClicked(item);
										}}
									>
										<Text style={{fontWeight: 'bold'}}>{item.to}</Text>
									</TouchableOpacity>
									<Text>{item.message}</Text>
								</View>
							</View>
						)
					}}
				/>
      </View>
    );
  }
}