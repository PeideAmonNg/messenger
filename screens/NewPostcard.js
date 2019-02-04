import React from 'react';
import {Text, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, Alert, ToastAndroid} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import firebase from 'react-native-firebase';
import makeHeader from '../header';

const options = {
  title: 'Select Image',
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

export default class NewPostcardScreen extends React.Component {
	static navigationOptions = ({navigation}) => {
		let text = navigation.getParam('loading') ? 'Sending' : 'Send';
		let disabled = navigation.getParam('loading');
		let func = () => navigation.state.params.submitPostcard();

		return makeHeader('New Postcard', {text, disabled, func});

	}

	constructor(props) {
		super(props);
		this.state = {
			toName: '',
			toUid: '',
			message: '',
			image: '',
			searchedNames: [] // search results for recipient's name
		}

		this.submitPostcard = this.submitPostcard.bind(this);
	}

	componentDidMount() {
		this.props.navigation.setParams({submitPostcard: this.submitPostcard});

		if(this.props.navigation.getParam('uid')) {
			this.setState({
				toName: this.props.navigation.getParam('userName'),
				toUid: this.props.navigation.getParam('uid')
			});
		}
	}

	submitPostcard() {		
		this.props.navigation.setParams({loading: true});
		
		let key = firebase.database().ref('postcards').push().key;
		let user = firebase.auth().currentUser;

		firebase.storage().ref('postcardImages').child(key + '.jpeg').putFile(this.state.image.uri)
			.then(snapshot => {
				firebase.database().ref('postcards').push({
					to: {name: this.state.toName, uid: this.state.toUid},
					image: snapshot.downloadURL,
					message: this.state.message,
					from: {name: user.displayName || user.email, uid: user.uid}
				}, 
				err => {
					if(err) {
						ToastAndroid.show('Error sending postcard', ToastAndroid.SHORT);
					}
					
					ToastAndroid.show('Postcard sent!', ToastAndroid.SHORT);
					this.props.navigation.navigate('Home');
				});	
			})
			.catch(err => ToastAndroid.show('Error uploading postcard image', ToastAndroid.SHORT));
	}

	handleUserSearch(name) {
		this.setState({toName: name});
		
		if(name) {
			firebase.database().ref('users').orderByChild('nameLower')
				.startAt(name.toLowerCase()).endAt(name.toLowerCase() + '\uf8ff')
				.once('value', snapshot => {
					let users = [];
					snapshot.forEach(user => {
						users.push({name: user.val().name, key: user.key});
					})
					this.setState({searchedNames: users});
				});
		} else {
			this.setState({searchedNames: []});
		}
	}

	showImagePicker(){
		ImagePicker.showImagePicker(options, (response) => {																
			
  		if(response.didCancel) {
				// user cancelled
			} else if(response.error) {
				Alert.alert('Error selecting image', response.error);
			} else {
				const source = {uri: response.uri};						

				const sidePadding = 20;

				Image.getSize(response.uri, (width, height) => {
					let w = Dimensions.get('window').width;
					let ratio = width / (w-sidePadding);

					this.setState({
						image: source,
						width: w-sidePadding,
						height: height / ratio
					});	
				})									
			}
		});
	}

  render() {
    return (
			<ScrollView style={{flex: 1, alignSelf: 'stretch', paddingLeft: 10, paddingRight: 10, backgroundColor: 'white'}}>
				<Text style={{fontWeight: 'bold', marginTop: 10}}>To</Text>
				<TextInput
					onChangeText={text => this.handleUserSearch(text)}
					value={this.state.toName}
					style={{borderBottomColor: 'black', borderBottomWidth: 1}}
				/>
				<FlatList
					data={this.state.searchedNames}
					renderItem={({item}) => 
						<TouchableOpacity
							key={item.key}
							onPress={() => this.setState({toName: item.name, toUid: item.key, searchedNames: []})}
						>
							<Text style={{paddingTop: 5, paddingBottom: 5}}>{item.name}</Text>
						</TouchableOpacity>
					}
					style={{marginBottom: 20}}
				/>
				<Text style={{fontWeight: 'bold'}}>Message</Text>
				<TextInput
					onChangeText={text => this.setState({message: text})}
					value={this.state.message}
					multiline={true}
					numberOfLines={5}
					style={{borderBottomColor: 'black', borderBottomWidth: 1, marginBottom: 20}}
				/>
				<Text style={{fontWeight: 'bold'}}>Image</Text>
				<TouchableOpacity onPress={() => this.showImagePicker()}><Text style={{paddingTop: 10, paddingBottom: 10}}>Select</Text></TouchableOpacity>
				{
					this.state.image !== '' && <Image source={this.state.image} style={{width: this.state.width, height: this.state.height}}/>
				}
			</ScrollView>
    );
  }
}