import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import firebase from 'react-native-firebase';
import Modal from 'react-native-modal';	

export default class UserModal extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isModalVisible: false,
			sentCount: 0,
			receivedCount: 0,
			isFriend: false
		};
  };

  _toggleModal = () => {
		this.props._toggleModal();
	}
		
	fetch(user) {
		firebase.database().ref('friends').child(firebase.auth().currentUser.uid + '/' + user.uid)
			.once('value', snapshot => {
				this.setState({isFriend: snapshot.exists()});
			});

		firebase.database().ref('postcardCount/sent').child(firebase.auth().currentUser.uid + '/' + user.uid)
			.once('value', snapshot => {
				this.setState({sentCount: snapshot.val() || 0})
			});

		firebase.database().ref('postcardCount/received').child(firebase.auth().currentUser.uid + '/' + user.uid)
			.once('value', snapshot => {
				this.setState({receivedCount: snapshot.val() || 0})
			});
	}

  render() {
		let user = this.props.selectedUser;

    return (
      <View style={{backgroundColor: 'orange'}}>
        {/* <TouchableOpacity onPress={this._toggleModal}>
          <Text>Show Modal</Text>
        </TouchableOpacity> */}
        <Modal isVisible={this.props.isModalVisible}
					onBackdropPress={this._toggleModal}
					onBackButtonPress={this._toggleModal}
					animationIn='slideInLeft'
					animationOut='slideOutLeft'
					onModalShow={() => this.fetch(user)}
				>
          <View style={{backgroundColor: 'white', padding: 20 }}>
						<View style={{flexDirection: 'row', paddingBottom: 10, borderBottomColor: 'darkgray', borderBottomWidth: 1}}>
							<View style={{flex: 1, flexDirection: 'row'}}>
								<Text>{user.userName}</Text>
							</View>
							<View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>	
								<TouchableOpacity
									onPress={() => {
										this._toggleModal();
										// this.state.isFriend
										this.props.currentScreen == 'explore'
											? this.props.navigation.navigate('User', {isFriend: false, userName: user.userName, uid: user.uid})
											: this.props.navigation.navigate('Friend', {isFriend: true, userName: user.userName, uid: user.uid});
									}}
								>
									<Text>View Profile</Text>
								</TouchableOpacity>
							</View>
						</View>
						<View style={{paddingTop: 10}}>							
							<Text>Received {this.state.receivedCount || 0} & sent {this.state.sentCount || 0} postcards</Text>            							
							<Text style={{marginTop: 10, alignSelf: 'flex-start'}}>
								{this.state.isFriend ? 'Is a Friend' : ''}
							</Text>
						</View>							
          </View>
        </Modal>
      </View>
    );
  }
}