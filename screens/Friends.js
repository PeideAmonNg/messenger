import React from 'react';
import {Text, View, TouchableOpacity, FlatList, Image} from 'react-native';
import firebase from 'react-native-firebase';
import makeHeader from '../header';
import UserModal from './UserModal';

export class FriendsScreen extends React.Component {
	static navigationOptions =  makeHeader('Friends');

	constructor(props) {
		super(props);
		this.state = {
			friends: [],
			isModalVisible: false,
			selectedUser: {
				uid: 's',
				userName: ''
			}
		}
	}

	getFriends() {
		let uid = firebase.auth().currentUser.uid; 
		firebase.database().ref('friends').child(uid).on('value', (snapshot) => {	
			let friends = [];
			snapshot.forEach(friend => {
				friends.push({
					key: friend.key,
					name: friend.val().name,
					photoURL: friend.val().photoURL
				})
			})

			this.setState({friends})
		});
	}

	componentDidMount() {
		this.getFriends();
	}

	userClicked(item) {
		this.setState({selectedUser: {uid: item.key, userName: item.name}, isModalVisible: true});
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
					data={this.state.friends}
					renderItem={({item}) =>
						<View style={{padding: 10}}>
							<TouchableOpacity
								onPress={() => {
									this.userClicked(item);
								}}
								style={{flex: 1, flexDirection: 'row'}}
							>
								{
									item.photoURL	
										? <Image source={{uri: item.photoURL}} style={{width: 40, height: 40, marginRight: 5}}/>
										: <View style={{width: 40, height: 40, marginRight: 5}}></View>
								}
								<Text style={{alignSelf: 'center'}}>{item.name}</Text>
							</TouchableOpacity>
						</View>
					}
				/>
      </View>
    );
  }
}