import React from 'react';
import {Text, View, ToastAndroid} from 'react-native';
import firebase from 'react-native-firebase';

export class UserScreen extends React.Component {
	static navigationOptions = ({navigation}) => 
		makeHeader(navigation.getParam('userName'), 
			[{
				text: navigation.getParam('isFriend') ? 'Unfriend' : 'Friend',
				func: () => {
					if(navigation.getParam('isFriend')) {
						firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + navigation.getParam('uid'))
							.remove(err => {
								if(err) {
									Alert.alert('Error unfriending', err.toString());
								} else {								
									navigation.setParams({isFriend: false});
									ToastAndroid.show('Unfriended', ToastAndroid.SHORT);	
								}
							});							
					} else {
						firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + navigation.getParam('uid'))
							.set(navigation.getParam('userName'), err => {
								if(err) {
									Alert.alert('Error unfriending', err.toString());
								} else {								
									navigation.setParams({isFriend: true});
									ToastAndroid.show('Friended', ToastAndroid.SHORT);	
								}
							});
					}
				}
			}, {
				text: 'New',
				func: () => navigation.navigate('NewPostcard', {
					userName: navigation.getParam('userName'),
					uid: navigation.getParam('uid')
				})
			}]
		)

	constructor(props) {
		super(props);
		this.state = {
			receivedCount: 0,
			sentCount: 0
		}
	}
	componentDidMount() {
		firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + this.props.navigation.getParam('uid'))
			.once('value', snapshot => {
				this.props.navigation.setParams({isFriend: snapshot.exists()});
			});

		firebase.database().ref('postcardCount/sent').child(firebase.auth().currentUser.uid + '/' + this.props.navigation.getParam('uid'))
			.once('value', snapshot => {
				this.setState({sentCount: snapshot.val() || 0})
			});

		firebase.database().ref('postcardCount/received').child(firebase.auth().currentUser.uid + '/' + this.props.navigation.getParam('uid'))
			.once('value', snapshot => {
				this.setState({receivedCount: snapshot.val() || 0})
			});
	}

  render() {
    return (
      <View style={{flex: 1, padding: 10}}>
        <Text>{this.props.navigation.getParam('userName')}</Text>
				<Text>{this.props.navigation.getParam('uid')}</Text>
				<Text>Received {this.state.receivedCount || 0} & sent {this.state.sentCount || 0} postcards</Text>
      </View>
    );
  }
}