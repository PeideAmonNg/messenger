import React from 'react';
import {Text, TextInput, View, ActivityIndicator, TouchableOpacity, Alert, ToastAndroid} from 'react-native';
import firebase from 'react-native-firebase';

export class AuthLoadingScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			signedIn: true,
			loading: false
		}
	}

	componentDidMount() {
		this.unsubscriber = firebase.auth().onAuthStateChanged(user => {
			if(!user) {
				this.setState({signedIn: false});
			}else {
				this.props.navigation.navigate('App');
			}
		});
	}

	componentWillUnmount() {
		if(this.unsubscriber) {
			this.unsubscriber();
		}
	}

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
				{this.state.signedIn
					? <ActivityIndicator/>
					: <AuthScreen/>
				}        
      </View>
    );
  }
}

const SIGN_IN = 'sign in';
const SIGN_UP = 'sign up';

class AuthScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			authMode: SIGN_IN,
			email: '',
			password: '',
			displayName: ''
		}
	}

	handleAuth() {
		if(this.state.authMode == SIGN_IN) {
			if(!this.state.email || !this.state.password) {
				ToastAndroid.show('Enter Email and Password', ToastAndroid.SHORT);
			} else { 
				this.setState({loading: true});
				firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
				.catch(err => {
					this.setState({loading: false});
					ToastAndroid.show('Error signing in: ' + err.code, ToastAndroid.SHORT);
				});
			}
		} else {
			this.setState({loading: true});
			firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
				.then(userCred => {
					userCred.user.updateProfile({displayName: this.state.displayName});
					firebase.database().ref(`users/${userCred.user.uid}`)
						.set({
							name: this.state.displayName,
							nameLower: this.state.displayName && this.state.displayName.toLowerCase()
						});
				})
				.catch(err => {
					this.setState({loading: false});
					ToastAndroid.show('Error signing up: ' + err.code, ToastAndroid.SHORT);
				});
		}
	}

	render() {
		let color = styles.textColor, borderBottomColor = styles.textColor;

		return (			
      <View style={{flex: 1, alignSelf: 'stretch', padding: 20, backgroundColor: styles.mainColor}}>
				<Text style={{fontSize: 30, marginBottom: 20, color}}>{this.state.authMode}</Text>
				<TextInput
					onChangeText={text => this.setState({email: text})}
					value={this.state.email}
					textContentType='emailAddress'
					keyboardType='email-address'
					placeholder='email'
					placeholderTextColor="#cccccc" 
					style={{borderBottomColor, color, borderBottomWidth: 1, marginBottom: 20}}
				/>
				<TextInput
					onChangeText={text => this.setState({password: text})}
					value={this.state.password}
					secureTextEntry={true}	
					placeholder='password'
					placeholderTextColor="#cccccc" 
					style={{borderBottomColor, color, borderBottomWidth: 1, marginBottom: 20}}
				/>
				{
					this.state.authMode == SIGN_UP &&
					<TextInput
						onChangeText={text => this.setState({displayName: text})}
						value={this.state.displayName}
						placeholder='display name'
						placeholderTextColor="#cccccc" 
						style={{borderBottomColor, color, borderBottomWidth: 1, marginBottom: 20}}
					/>
				}
				
				{this.state.loading
					? <ActivityIndicator/>
					: <View style={{flex: 1}}>
							<TouchableOpacity onPress={() => this.handleAuth()}>
								<Text style={{padding: 5, borderColor: styles.textColor, color, borderWidth: 1, alignSelf: 'flex-start', borderRadius: 2}}>
									{this.state.authMode}
								</Text>
							</TouchableOpacity>			

							{this.state.authMode == SIGN_IN &&
								<View style={{flexDirection:'row', flexWrap:'wrap', marginTop: 10, marginBottom: 10}}>
									<Text style={{color}}>or </Text>
									<TouchableOpacity
										onPress={() => {
											this.setState({loading: true});
											firebase.auth().signInAnonymously();
										}}
									>
										<Text style={{color}}>sign in anonymously</Text>							
									</TouchableOpacity>		
								</View>
							}

							<View style={{flex: 1, justifyContent: 'flex-end'}}>
								<TouchableOpacity
									onPress={() => this.setState({authMode: this.state.authMode == SIGN_IN ? SIGN_UP : SIGN_IN})}
								>
									<Text style={{color}}>{this.state.authMode == SIGN_IN ? SIGN_UP : SIGN_IN}</Text>
								</TouchableOpacity>
							</View>
						</View>
				}				
			</View>
		)	
	}
}