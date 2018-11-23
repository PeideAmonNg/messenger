import React from 'react';
import {Text, TextInput, View, TouchableOpacity} from 'react-native';
import firebase from 'react-native-firebase';
import makeHeader from '../header';

export class SettingsScreen extends React.Component {
	static navigationOptions = ({navigation}) => 
		makeHeader('Settings', {text: 'Sign Out', func: () => firebase.auth().signOut().then(() => navigation.navigate('Auth'))});

	constructor(props) {
		super(props);
		this.state = {
			displayName: firebase.auth().currentUser.displayName,
			uid: firebase.auth().currentUser.uid
		}
	}

	updateProfile() {
		let user = firebase.auth().currentUser;
		this.setState({displayName: user.displayName});
	}

  render() {
    return (
      <View style={{padding: 10}}>
				<Text>displayName: {this.state.displayName || ''}</Text>
				<Text>uid: {this.state.uid}</Text>
				<TouchableOpacity
					onPress={() => this.props.navigation.navigate('UpdateProfile', {updateProfile: () => this.updateProfile()})}
				>
					<Text>Update Profile</Text>
				</TouchableOpacity>
      </View>
    );
  }
}

export class UpdateProfileScreen extends React.Component {
	static navigationOptions = ({navigation}) => 
		makeHeader('Update Profile', {text: 'Save', func: () => 
			firebase.auth().currentUser.updateProfile(navigation.getParam('profile')).then(navigation.getParam('updateProfile'))
				.then(() => navigation.navigate('Settings'))
		});

	constructor(props) {
		super(props);
		this.state = {
			displayName: firebase.auth().currentUser.displayName
		};
	}

  render() {
    return (
      <View style={{padding: 10}}>
				<Text style={{fontWeight: 'bold'}}>display name</Text>
				<TextInput
					value={this.state.displayName}
					placeholder='display name'
					onChangeText={text => {
						this.setState({displayName: text});
						this.props.navigation.setParams({profile: {...this.state, displayName: text}});
					}}
					style={{borderBottomColor: 'black', borderBottomWidth: 1, marginBottom: 20}}
				/>
      </View>
    );
  }
}