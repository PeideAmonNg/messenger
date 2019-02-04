import React from 'react';
import {Image, Text, TextInput, ToastAndroid, View, TouchableOpacity, Alert} from 'react-native';
import firebase from 'react-native-firebase';
import ImagePicker from 'react-native-image-picker';
import makeHeader from '../header';
import ImageResizer from 'react-native-image-resizer';

import styles from '../styles';

export class SettingsScreen extends React.Component {
	static navigationOptions = ({navigation}) => 
		makeHeader('Profile', {text: 'Update', func: () => navigation.navigate('UpdateProfile')});

	constructor(props) {
		super(props);

		let user = firebase.auth().currentUser;
		this.state = {
			displayName: user.displayName,
			photoURL: user.photoURL,
			uid: user.uid,
			email: user.email
		}
	}

	refreshProfile() {
		let user = firebase.auth().currentUser;
		this.setState({
			displayName: user.displayName,
			photoURL: user.photoURL,
			uid: user.uid,
			email: user.email
		});	
	}

	componentDidMount() {
		this.subs = [
			this.props.navigation.addListener('didFocus', (payload) => this.refreshProfile()),
		]; 
	}

  render() {
    return (
      <View style={{flex: 1, padding: 10, backgroundColor: 'white'}}>
				<Image source={{uri: this.state.photoURL}} style={{width: 100, height: 100}}/>
				<View style={{flexDirection: 'row'}}>
					<Text style={{color: 'gray'}}>name: </Text><Text style={{fontWeight: 'bold'}}>{this.state.displayName || ''}</Text>
				</View>
				<View style={{flexDirection: 'row'}}>
					<Text style={{color: 'gray'}}>email: </Text><Text style={{fontWeight: 'bold'}}>{this.state.email}</Text>
				</View>
				<View style={{flexDirection: 'row'}}>
					<Text style={{color: 'gray'}}>uid: </Text><Text style={{fontWeight: 'bold'}}>{this.state.uid}</Text>
				</View>

				<View style={{flex: 1, justifyContent: 'flex-end'}}>
					<TouchableOpacity
						onPress={() => firebase.auth().signOut().then(() => this.props.navigation.navigate('Auth'))}
						style={{alignSelf: 'flex-start'}}
					>
						<Text style={{padding: 5, borderWidth: 1, borderRadius: 2, borderColor: 'black'}}>Sign Out</Text>
					</TouchableOpacity>
				</View>
      </View>
    );
  }
}

const options = {
  title: 'Select Photo',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

export class UpdateProfileScreen extends React.Component {
	static navigationOptions = ({navigation}) => {
		let profile = navigation.getParam('profile');
		let user = firebase.auth().currentUser;

		let isProfileUpdated = profile && (profile.displayName != user.displayName || profile.photoURL != user.photoURL);

		return makeHeader('Update Profile', {
			text: navigation.getParam('loading') ? 'saving' : (isProfileUpdated ? '\u2713' : ''), 
			disabled:(navigation.getParam('loading') || !isProfileUpdated) ? true : false,
			func: () => {

				if(profile && (profile.displayName != user.displayName || profile.photoURL != photoURL)) {
					navigation.setParams({loading: true});
					
					let key = firebase.database().ref('users').push().key;

					if(profile.photoURL != user.photoURL) {
						firebase.storage().ref('userPhotos').child(key + '.jpeg').putFile(profile.photoURL).then(snapshot => {
							firebase.database().ref(`users/${user.uid}/photoURL`).set(snapshot.downloadURL);
							firebase.auth().currentUser.updateProfile({displayName: profile.displayName, photoURL: snapshot.downloadURL})
								.then(() => navigation.navigate('Settings'));
						});
					} else {
						firebase.auth().currentUser.updateProfile(profile)
							.then(() => navigation.navigate('Settings'));
					}

				} else {
					ToastAndroid.show('Enter a display name', ToastAndroid.SHORT);
				}
			}	
		});
	}

	constructor(props) {
		super(props);
		this.state = {
			profile: {				
				displayName: firebase.auth().currentUser.displayName,
				photoURL: firebase.auth().currentUser.photoURL || ''
			},
			width: 100,
			height: 100
		};
	}
	
	
	showImagePicker(){
		ImagePicker.showImagePicker(options, (response) => {																
			
  		if(response.didCancel) {
				// user cancelled
			} else if(response.error) {
				Alert.alert('Error selecting image', response.error);
			} else {

				ImageResizer.createResizedImage(response.uri, 200, 200, 'JPEG', 100, 0, null).then((response) => {
					// response.uri is the URI of the new image that can now be displayed, uploaded...
					// response.path is the path of the new image
					// response.name is the name of the new image with the extension
					// response.size is the size of the new image

					this.props.navigation.setParams({profile: {...this.state.profile, photoURL: response.uri}});

					this.setState({
						profile: {
							...this.state.profile,
							photoURL: response.uri
						}
					});
					
				}).catch((err) => {
					// Oops, something went wrong. Check that the filename is correct and
					// inspect err to get more details.
				});				
			}
		});
	}

  render() {
    return (
      <View style={{flex: 1, padding: 10, backgroundColor: 'white'}}>
				<Text style={{fontWeight: 'bold'}}>Name</Text>
				<TextInput
					value={this.state.profile.displayName}
					placeholder='Name'
					onChangeText={text => {
						this.props.navigation.setParams({profile: {...this.state.profile, displayName: text}});
						this.setState({profile: {...this.state.profile, displayName: text}});
					}}
					style={{borderBottomColor: 'black', borderBottomWidth: 1, marginBottom: 20}}
				/>
				<Text style={{fontWeight: 'bold'}}>Photo</Text>
				<TouchableOpacity onPress={() => this.showImagePicker()}><Text style={{paddingTop: 10, paddingBottom: 10}}>{this.state.profile.photoURL ? 'Change' : 'Select'}</Text></TouchableOpacity>
				{this.state.profile.photURL !== '' && 
					<Image source={{uri: this.state.profile.photoURL}} style={{width: this.state.width, height: this.state.height}}/>
				}
      </View>
    );
  }
}