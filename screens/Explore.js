import React from 'react';
import {Text, View, FlatList, TouchableOpacity, Picker} from 'react-native';
import firebase from 'react-native-firebase';

import makeHeader from '../header';
import UserModal from './UserModal';

export class ExploreScreen extends React.Component {
	static navigationOptions = makeHeader('Explore');

	constructor(props) {
		super(props);
		this.state = {
			users: [],
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
		this.getRandomPeopleRef = firebase.database().ref('users').once('value', snapshot => {	
			let users = [];
			snapshot.forEach(user => {
				if(user.val().uid !== uid) {
					users.push({
						key: user.val().uid,
						name: user.val().name
					})
				}
			})
			this.setState({users: users})
		});
	}

	getPeopleWithSimilarIntersts() {
		let uid = firebase.auth().currentUser.uid;
		this.getPeopleWithSimilarInterstsRef = firebase.database().ref(`matchingInterestsCount/${uid}`).once('value', snapshot => {
			let users = [];
			snapshot.forEach(user => {
				console.log('interests', user.val().interests);
				users.push({
					key: user.key, 
					name: user.val().name, 
					count: user.val().count, 
					interests: user.val().interests && Object.values(user.val().interests).join(' & ')
				});								
			});

			this.setState({users});
		});
	}
	
  render() {
    return (
      <View style={{flex: 1, alignItems: 'stretch', padding: 10}}>
				<UserModal 
					isModalVisible={this.state.isModalVisible}
					selectedUser={this.state.selectedUser}			
					currentScreen='explore'
					navigation={this.props.navigation}
					_toggleModal={()=>this.setState({isModalVisible: !this.state.isModalVisible})}
				/>
				<Picker
					selectedValue={this.state.sortValue}
					onValueChange={(itemValue, itemIndex) => {
						this.setState({sortValue: itemValue});
						itemValue === 'random' ? this.getRandomPeople() : this.getPeopleWithSimilarIntersts();
					}}
				>
					<Picker.Item label="People with same interests" value="sameInterests" />
					<Picker.Item label="Random people" value="random" />
				</Picker>
				<FlatList
					data={this.state.users}
					renderItem={({item}) => (
						<View>
							<TouchableOpacity
								onPress={() => this.setState({isModalVisible: true, selectedUser: {uid: item.key, userName: item.name}})}
							>
								<Text style={{marginBottom: 5}}>
									<Text style={{fontWeight: 'bold'}}>{item.name}</Text>
									{item.count && ` - ${item.count}`}
								</Text>							
							</TouchableOpacity>
							{item.interests && <Text style={{marginLeft: 20}}>{'\t' + item.interests}</Text>}
						</View>
					)}
				/>
      </View>
    );
  }
}