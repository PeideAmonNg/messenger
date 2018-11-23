import React from 'react';
import {Text, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, Alert} from 'react-native';
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
						Alert.alert('Error sending postcard', err.toString());
					}
					
					this.props.navigation.navigate('Inbox');
				});	
			})
			.catch(err => Alert.alert('Error uploading postcard image', err.toString()));
	}

	handleSearch(name) {
		this.setState({toName: name});
		
		if(name) {
			firebase.database().ref('users').orderByChild('nameLower').startAt(name.toLowerCase()).endAt(name.toLowerCase() + '\uf8ff')
				.once('value', snapshot => {
					let users = [];
					snapshot.forEach(user => {
						users.push({name: user.val().name, key: user.val().uid});
					})
					this.setState({searchedNames: users});
				});
		} else {
			this.setState({searchedNames: []});
		}
	}

	showImagePicker(){
		ImagePicker.showImagePicker(options, (response) => {																
			if(response.error) {
				Alert.alert('Error selecting image', response.error);
			} else {
				const source = {uri: response.uri};						

				Image.getSize(response.uri, (width, height) => {
					let w = Dimensions.get('window').width;
					let ratio = width / (w-40);

					this.setState({
						image: source,
						width: w-40,
						height: height / ratio
					});	
				})									
			}
		});
	}

  render() {
    return (
			<ScrollView style={{flex: 1, alignSelf: 'stretch', paddingLeft: 10, paddingRight: 10}}>
				<Text style={{fontWeight: 'bold', marginTop: 10}}>To</Text>
				<TextInput
					onChangeText={text => this.handleSearch(text)}
					value={this.state.toName}
					style={{borderBottomColor: 'black', borderBottomWidth: 1}}
				/>
				<FlatList
					data={this.state.searchedNames}
					renderItem={({item}) => 
						<TouchableOpacity
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
				<TouchableOpacity
					onPress={() => this.showImagePicker()}
				>
					<Text style={{fontWeight: 'bold'}}>Select Image</Text>
				</TouchableOpacity>
				{
					this.state.image  !== '' &&
						<Image source={this.state.image} style={{width: this.state.width, height: this.state.height}}/>
				}
			</ScrollView>
    );
  }
}