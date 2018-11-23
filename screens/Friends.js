import React from 'react';
import {Text, View, TouchableOpacity, FlatList} from 'react-native';
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
					name: friend.val()
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
      <View style={{flex: 1, padding: 10}}>
				<UserModal 
					isModalVisible={this.state.isModalVisible}
					selectedUser={this.state.selectedUser}
					navigation={this.props.navigation}
					_toggleModal={()=>this.setState({isModalVisible: !this.state.isModalVisible})}
				/>
				<FlatList
					data={this.state.friends}
					renderItem={({item}) => 
						<TouchableOpacity
							onPress={() => {
								// this.props.navigation.navigate('Friend', {uid: item.key, userName: item.name});
								this.userClicked(item);
							}}>
							<Text style={{marginBottom: 5}}>{item.name}</Text>
						</TouchableOpacity>
					}
				/>
      </View>
    );
  }
}