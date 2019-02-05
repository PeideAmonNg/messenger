import React from 'react';
import {Text, TextInput, View, ToastAndroid, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, TouchableWithoutFeedback, Alert} from 'react-native';
import firebase from 'react-native-firebase';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import makeHeader from '../header';
import styles from '../styles';

import TimeAgo from 'javascript-time-ago'
 
// Load locale-specific relative date/time formatting rules.
import en from 'javascript-time-ago/locale/en'

TimeAgo.addLocale(en)
 
// Create relative date/time formatter.
const timeAgo = new TimeAgo('en-US')

export class ThreadListScreen extends React.Component {
	static navigationOptions = ({navigation}) => makeHeader('Messages', {
		text: <Icon name='plus' size={20} color={styles.textColor} />,
		func: () => navigation.navigate('SelectUsers')
	});

	constructor(props) {
		super(props);
		this.state = {
			threads: [],
			isFetching: false,
			fetched: false,
			modalVisible: false
		};
	}

	componentDidMount() {
		this.setState({isFetching: true}, () => {
			this.threadsRef = firebase.database().ref(`ThreadList/${firebase.auth().currentUser.uid}/threadList`);
			this.threadsRef.on('value', snapshot => {
				var threads = [];
				if(snapshot.val()) {
					var sortedKeys = Object.keys(snapshot.val()).sort();
					sortedKeys.forEach(key => {
						let thread = snapshot.val()[key]
						thread.key = key;
						threads.push(thread);
					});						
				}
				
				this.setState({threads, isFetching: false, fetched: true})
				
			});	
		});		
	}

	componentWillUnmount() {
		if(this.threadsRef) {
			this.threadsRef.off();
		}
	}

	setModalVisible(visible) {
    this.setState({modalVisible: visible});
	}
	
  render() {
		let uid = firebase.auth().currentUser.uid;
		
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
				{this.state.isFetching &&
					<ActivityIndicator size="large" style={{flex: 1}} />
				}

				{this.state.fetched && (this.state.threads.length == 0 ? 
					<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
						<TouchableOpacity
							onPress={() => this.props.navigation.navigate('SelectUsers')}
						><Text>Send a message</Text></TouchableOpacity>
					</View> : 
					<FlatList
						data={this.state.threads}
						renderItem={({item}) => {
							var uids = Object.keys(item.users);
							var photoURL = uids[0] == firebase.auth().currentUser.uid ? item.users[uids[1]].photoURL : item.users[uids[0]].photoURL;

							return <View style={{padding: 10}}>
								<TouchableOpacity
									onPress={() => {
										firebase.database().ref(`ThreadList/${uid}/threadList/${item.key}/lastRead`).set(firebase.database.ServerValue.TIMESTAMP);
										this.props.navigation.navigate('Thread', {threadId: item.key, users: Object.values(item.users)});
									}}
									onLongPress={() => this.setState({currentThreadId: item.key}, () => this.setModalVisible(true))}
								>
									<View style={{flexDirection: 'row'}}>
										<Image
											source={{uri: photoURL}}
											style={{width: 60, height: 60, marginRight: 5}}
										/>
										<View style={{flex: 1}}>
											<Text>{delete item.users[uid] && Object.values(item.users).map(u => u.name).join(', ')}</Text>
											<Text numberOfLines={1} style={{fontWeight: item.lastUpdated > item.lastRead ? 'bold' : 'normal'}}>
												{item.updatedBy.uid === uid ? 'me' : item.updatedBy.name}: {item.latestMsg}											
											</Text>
											<Text style={{color: 'gray', fontSize: 12}}>{timeAgo.format(new Date(item.lastUpdated))}</Text>
										</View>
									</View>
								</TouchableOpacity>
							</View>
						}}
					/>
				)}
				<Modal
					animationType="fade"
					transparent={true}
					visible={this.state.modalVisible}
					onRequestClose={() => {
						// Alert.alert('Modal has been closed.');
						this.setModalVisible(false);
					}}
				>
					<TouchableWithoutFeedback
						onPress={()=>{
							this.setModalVisible(false);
						}}
					>
						<View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
							<View style={{margin: 10, backgroundColor: 'white'}}>
								<TouchableOpacity
									onPress={() => {
										if(this.state.currentThreadId) {
											firebase.database().ref(`ThreadList/${uid}/threadList/${this.state.currentThreadId}`).remove(err => this.setModalVisible(false));
										} else {
											this.setModalVisible(false);
										}
									}}
								>
									<Text style={{padding: 10, textAlign: 'center'}}>Remove Thread</Text>
								</TouchableOpacity>
								
							</View>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
      </View>
    );
  }
}

export class SelectUsersScreen extends React.Component {	
	static navigationOptions = ({navigation}) => makeHeader('Send To', {
		text: <Icon name='arrow-right' size={20} color={styles.textColor} />,
		func: () => {
			var users = navigation.getParam('users');
			if(Array.isArray(users) && users.length > 0) {
				navigation.navigate('Thread', {users: navigation.getParam('users')});
			} else {
				ToastAndroid.show('Choose at least one user', ToastAndroid.SHORT);
			}
		}
	});

	constructor(props) {
		super(props);
		this.state = {
			users: [],
			selected: [],
			name: ''
		};
	}

	search(name) {
		name = name.trim();

		if(name) {
			firebase.database().ref('users').orderByChild('nameLower')
				.startAt(name.toLowerCase()).endAt(name.toLowerCase() + '\uf8ff')
				.once('value', snapshot => {
					let users = [];
					snapshot.forEach(user => {
						users.push({...user.val(), uid: user.key, key: user.key});
					})
					this.setState({users, searching: false});
				});
		} else {
			this.setState({users: [], searching: false});
		}
	}

	onNameSearchchange(name) {
		this.setState({name, searching: true});
		this.search(name);
	}

	addUser(user) {			
		
		let userExists = false;
		this.state.selected.forEach(u => {
			if(u.key == user.key) {
				userExists = true;
			}
		})

		if(!userExists) {
			const newSelected = [...this.state.selected, user];
			this.props.navigation.setParams({users: newSelected});
			this.setState({selected: newSelected});
		} else {
			ToastAndroid.show('User already added', ToastAndroid.SHORT);
		}
	}
	
	removeUser(user) {
		let newSelected = [];
		this.state.selected.map(item => item.key != user.key && newSelected.push(item));
		this.props.navigation.setParams({users: newSelected});
		this.setState({selected: newSelected});
	}

	render() {
		return <View style={{flex: 1, backgroundColor: 'white'}}>
			<View style={{flexDirection:'row', flexWrap:'wrap', padding: 5}}>
				{this.state.selected.map(user => {
					return <TouchableOpacity
						key={user.key}
						onPress={() => this.removeUser(user)}
					>
						<View style={{flexDirection: 'row', margin: 5, padding: 5, backgroundColor: styles.textColor, alignItems: 'center'}}>
							<Image source={{uri: user.photoURL}} style={{width: 30, height: 30}}/>
							<Text key={user.key} style={{padding: 5, color: styles.mainColor}}>{user.name}</Text>
							{/* <Text style={{padding: 5, color: 'lightgray'}}>x</Text> */}
							<Icon name='close' size={20} color={styles.mainColor} />
						</View>
					</TouchableOpacity>
				})}
			</View>

			<View style={{flexDirection: 'row', padding: 10}}>
				<TextInput
					placeholder='Search user'
					value={this.state.name}
					onChangeText={text => this.onNameSearchchange(text)}
					style={{flex: 1, borderBottomColor: 'black', borderBottomWidth: 1}}
				/>
			</View>
			
			{this.state.users.length > 0 &&
					<FlatList
						data={this.state.users}
						showsVerticalScrollIndicator={true}
						renderItem={({item}) => <TouchableOpacity onPress={() => this.addUser(item)}>
							<View style={{flexDirection: 'row', marginTop: 10}}>
								<Image source={{uri: item.photoURL}} style={{width: 30, height: 30}}/>
								<Text style={{alignSelf: 'center', marginLeft: 5}} key={item.name}>{item.name}</Text>
							</View>
						</TouchableOpacity>}
						contentContainerStyle={{marginLeft: 10, marginRight: 10}}
						style={{}}
					/>
			}		

		</View>;
	}
}