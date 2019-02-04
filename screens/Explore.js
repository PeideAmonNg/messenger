import React from 'react';
import {Text, View, FlatList, TouchableOpacity, Picker, Image, ToastAndroid} from 'react-native';
import firebase from 'react-native-firebase';

import makeHeader from '../header';
import UserModal from './UserModal';

export class ExploreScreen extends React.Component {
	static navigationOptions = makeHeader('Community');

	constructor(props) {
		super(props);
		this.state = {
			users: {},
			sortValue: 'random',
			isModalVisible: false,
			selectedUser: {
				uid: '',
				userName: ''
			}
		}
	}

	componentDidMount() {
		this.getRandomPeople();
	}
	
	getRandomPeople() {
		let uid = firebase.auth().currentUser.uid;
		this.getRandomPeopleRef = firebase.database().ref('users').limitToLast(5).once('value', snapshot => {	
			var i = 0;
			var lastUid;
			var users = {};
			if(snapshot.val()) {

				snapshot.forEach(user => {
					users[user.key] = user.val();

					if(i == 0) {
						lastUid = user.key;
					}
					i++;
				});


				this.setState({users, lastUid})
			}
		});
	}

	getPeopleWithSimilarIntersts() {
		let uid = firebase.auth().currentUser.uid;
		this.getPeopleWithSimilarInterstsRef = firebase.database().ref(`matchingInterestsCount/${uid}`).once('value', snapshot => {
			let users = [];
			snapshot.forEach(user => {

				if(user.key !== uid) {
					users.push({
						key: user.key,
						name: user.val().name, 
						count: user.val().count,
						photoURL: user.val().photoURL,
						interests: user.val().interests && Object.values(user.val().interests).join(' & ')
					});
				}				
			});
			this.setState({users});
		});
	}

	getMoreUsers() {
		if(this.state.gotAllUsers) {
			return;
		}

		return new Promise(resolve => {
			this.getRandomPeopleRef = firebase.database().ref('users').orderByKey().endAt(this.state.lastUid).limitToLast(3).once('value', snapshot => {	
				if((snapshot.val() && Object.keys(snapshot.val()).length < 3)) {					
					
					var users = {...this.state.users};

					snapshot.forEach(user => {
						users[user.key] = user.val();
					});

					this.setState({gotAllUsers: true, users});

					resolve('done')

				} else {

					var users = {...this.state.users};
					var i = 0;
					var lastUid;
					snapshot.forEach(user => {
						users[user.key] = user.val();
	
						if(i == 0) {
							lastUid = user.key;
						}
						i++;
					});

					this.setState({users, lastUid: lastUid});
					resolve('done');
				}
			});
		});
	}
	
  render() {
		var users = [];
		Object.keys(this.state.users).forEach(key => {
			let user = this.state.users[key];
			user.key = key;
			users.push(user);
		});

    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
				<UserModal 
					isModalVisible={this.state.isModalVisible}
					selectedUser={this.state.selectedUser}			
					currentScreen='explore'
					navigation={this.props.navigation}
					_toggleModal={()=>this.setState({isModalVisible: !this.state.isModalVisible})}
				/>
				{users.length > 0 && <FlatList
					data={users}
					renderItem={({item}) => (
						<View style={{padding: 10}}>
							<TouchableOpacity
								onPress={() => this.setState({isModalVisible: true, selectedUser: {...item, uid: item.key, userName: item.name}})}
								style={{flex: 1, flexDirection: 'row'}}
							>
								{
									item.photoURL  
										? <Image source={{uri: item.photoURL}} style={{width: 40, height: 40, borderRadius: 2, marginRight: 5}}/>
										: <View style={{marginRight: 10, borderRadius: 20, width: 40, height: 40, backgroundColor: 'black'}}></View>
								}
								<Text style={{alignSelf: 'center'}}>{item.name}</Text>		
							</TouchableOpacity>
							{item.interests && <Text style={{marginLeft: 10, marginBottom: 5}}>{'\t' + item.interests}</Text>}
						</View>
					)}
					onEndReachedThreshold={0.01}
					onEndReached={async (info) => {
						if(!this.state.gotAllUsers) {
							this.getMoreUsers();
						}							
					}}
				/>
				}
      </View>
    );
  }
}